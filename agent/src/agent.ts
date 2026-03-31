import { StateGraph, START, END } from "@langchain/langgraph";
import {
  BiffStateAnnotation,
  initialState,
  BiffState,
  BiffAction,
} from "./state";
import { monitorState } from "./nodes/monitor";
import { evaluateDecision } from "./nodes/evaluate";
import { requestCredit } from "./nodes/credit";
import { addCollateral, repayOrRenew } from "./nodes/payments";
import { startApiServer } from "./nodes/serve";
import { initWallet } from "./wallet";
import { config } from "./config";
import { logger } from "./logger";
import { initStore, getStore } from "./store";

/** Nodo para idle */
async function idleNode() {
  return { lastAction: "idle" as BiffAction };
}

/** Nodo final para registro */
async function logOperation(state: typeof BiffStateAnnotation.State) {
  logger.info("Cycle Summary", {
    action: state.lastAction,
    reason: state.actionReason,
    usdc: state.usdcBalance,
  });
  return {
    operationLog: [
      ...state.operationLog,
      {
        timestamp: new Date().toISOString(),
        action: state.lastAction,
        result: state.actionReason,
      },
    ],
  };
}

const workflow = new StateGraph(BiffStateAnnotation)
  .addNode("monitor", monitorState)
  .addNode("evaluate", evaluateDecision)
  .addNode("request_credit", requestCredit)
  .addNode("add_collateral", addCollateral)
  .addNode("repay_or_renew", repayOrRenew)
  .addNode("idle", idleNode)
  .addNode("log_operation", logOperation)
  .addEdge(START, "monitor")
  .addEdge("monitor", "evaluate")
  .addConditionalEdges("evaluate", (state) => {
    // Si hubo error en monitor, saltamos directo a log_operation
    if (state.lastAction === "monitor_error") return "log_operation";

    // Check for forced action override
    const store = getStore();
    const forcedAction = store.getForcedAction();
    if (
      forcedAction &&
      ["request_credit", "add_collateral", "repay_or_renew", "idle"].includes(
        forcedAction,
      )
    ) {
      return forcedAction;
    }

    // Mapeo estricto de acciones a nodos
    const validActions: BiffAction[] = [
      "request_credit",
      "add_collateral",
      "repay_or_renew",
      "idle",
    ];
    return validActions.includes(state.lastAction) ? state.lastAction : "idle";
  })
  .addEdge("request_credit", "log_operation")
  .addEdge("add_collateral", "log_operation")
  .addEdge("repay_or_renew", "log_operation")
  .addEdge("idle", "log_operation")
  .addEdge("log_operation", END);

const app = workflow.compile();

function getRuntimeIntervalMs(): number {
  return getStore().getConfig().loopIntervalMin * 60 * 1000;
}

function getRuntimeThresholds() {
  const cfg = getStore().getConfig();
  return {
    minUsdcBalance: cfg.minUsdcBalance,
    maxLtv: cfg.maxLtv,
    loanWarnDays: cfg.loanWarnDays,
  };
}

async function main() {
  try {
    logger.info("Biff Agent Bootstrap starting...");
    const wallet = await initWallet();
    const store = initStore(wallet.getAddress());
    store.setRunning(true);
    store.setWalletAddress(wallet.getAddress());

    // Start API server + frontend
    startApiServer(wallet.getAddress());

    logger.info("Agent loop starting", {
      address: wallet.getAddress(),
      initialIntervalMin: store.getConfig().loopIntervalMin,
    });

    while (true) {
      try {
        // Check pause state
        if (store.isPaused()) {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          continue;
        }

        // Check force cycle trigger
        const shouldForceCycle = store.shouldForceCycle();
        if (!shouldForceCycle) {
          // Normal interval wait
          await new Promise((resolve) =>
            setTimeout(resolve, getRuntimeIntervalMs()),
          );
        } else {
          logger.info("Force cycle executing immediately");
        }

        logger.info("--- Starting Agent Cycle ---");
        const cycleStart = Date.now();
        const result = await app.invoke(initialState);
        const cycleDuration = Date.now() - cycleStart;

        // Record snapshot
        const state = result as BiffState;
        store.recordCycle({
          timestamp: new Date().toISOString(),
          usdcBalance: state.usdcBalance,
          wethBalance: state.wethBalance,
          wethPriceUSD: state.wethPriceUSD,
          activeLoans: state.activeLoans,
          lastAction: state.lastAction,
          actionReason: state.actionReason,
          llmCostEstimate: 0,
          gasEstimate: 0,
        });
      } catch (error: any) {
        logger.error("Critical cycle failure", { message: error.message });
        store.recordError();
      }
    }
  } catch (error: any) {
    logger.error("Fatal bootstrap error", { message: error.message });
    process.exit(1);
  }
}
main();
