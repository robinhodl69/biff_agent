import { BiffState } from "../state";
import { getLLM } from "../config";
import { logger } from "../logger";
import { z } from "zod";
import { getStore } from "../store";

// Definimos el esquema de respuesta para el LLM
const DecisionSchema = z.object({
  nextAction: z.enum([
    "request_credit",
    "add_collateral",
    "repay_or_renew",
    "idle",
  ]),
  actionReason: z
    .string()
    .describe("Explica brevemente por qué se tomó esta decisión"),
});

/**
 * evaluateDecision: Nodo LLM que razona sobre el estado actual y decide el siguiente paso.
 */
export async function evaluateDecision(
  state: BiffState,
): Promise<Partial<BiffState>> {
  logger.info("Node: evaluate_decision - Reasoning over state");

  try {
    const llm = getLLM();

    // Get runtime thresholds from store
    const store = getStore();
    const { minUsdcBalance, maxLtv, loanWarnDays } = store.getConfig();

    // Forzamos el output estructurado usando el esquema Zod
    // @ts-ignore
    const structuredLlm = llm.withStructuredOutput(DecisionSchema);

    const systemPrompt = `You are Biff Agent, an autonomous financial agent on Base Sepolia.
Your goal is to maintain USDC liquidity and keep your Floe loans healthy.

Decision Rules:
1. If your USDC balance is below ${minUsdcBalance} -> action: request_credit
2. If any loan has an LTV (Loan-to-Value) greater than ${maxLtv}% -> action: add_collateral
3. If any loan is expiring in less than ${loanWarnDays} days -> action: repay_or_renew
4. If everything looks healthy and you have enough USDC -> action: idle

Current State:
- USDC Balance: ${state.usdcBalance}
- WETH Balance: ${state.wethBalance}
- WETH Price (USD): ${state.wethPriceUSD}
- Active Loans: ${JSON.stringify(state.activeLoans)}

Return your decision in JSON format with "nextAction" and "actionReason".`;

    const decision = await structuredLlm.invoke([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: "Analyze current state and provide nextAction.",
      },
    ]);

    logger.info("LLM Decision reached", {
      action: decision.nextAction,
      reason: decision.actionReason,
    });

    return {
      lastAction: decision.nextAction,
      actionReason: decision.actionReason,
    };
  } catch (error: any) {
    logger.error("Error in evaluate_decision node", { error: error.message });
    return {
      lastAction: "idle",
      actionReason:
        "LLM Error, defaulting to idle to prevent unauthorized actions.",
    };
  }
}
