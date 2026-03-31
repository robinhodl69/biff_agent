import { BiffState, globalStats } from "../state";
import { getBalances, getWalletClient } from "../wallet";
import { config } from "../config";
import { logger } from "../logger";
import { Loan, FloeLoan, FloeLoanStatus } from "../types/floe";
import { calculateLTV, calculateDaysRemaining } from "../utils/financial";

const ORACLE_ABI = [
  {
    name: "latestRoundData",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "roundId", type: "uint80" },
      { name: "answer", type: "int256" },
      { name: "startedAt", type: "uint256" },
      { name: "updatedAt", type: "uint256" },
      { name: "answeredInRound", type: "uint80" },
    ],
  },
] as const;

const MATCHER_ABI = [
  {
    name: "getLoanIdsByUser",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ type: "uint256[]" }],
  },
  {
    name: "getLoan",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "loanId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "marketId", type: "bytes32" },
          { name: "loanId", type: "uint256" },
          { name: "lender", type: "address" },
          { name: "borrower", type: "address" },
          { name: "loanToken", type: "address" },
          { name: "collateralToken", type: "address" },
          { name: "principal", type: "uint256" },
          { name: "interestRateBps", type: "uint256" },
          { name: "ltvBps", type: "uint256" },
          { name: "liquidationLtvBps", type: "uint256" },
          { name: "marketFeeBps", type: "uint256" },
          { name: "matcherCommissionBps", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "collateralAmount", type: "uint256" },
          { name: "repaid", type: "bool" },
        ],
      },
    ],
  },
] as const;

let hasLoggedFeed = false;

/**
 * monitorState: Nodo de percepción que actualiza balances, precios y salud de préstamos reales.
 */
export async function monitorState(
  _state: BiffState,
): Promise<Partial<BiffState>> {
  if (!hasLoggedFeed) {
    logger.info(`Using Chainlink feed: ${config.CHAINLINK_WETH_USD_FEED}`);
    hasLoggedFeed = true;
  }

  logger.info("Node: monitor_state - Updating real perceptions");

  try {
    const client = getWalletClient();

    // 1. Obtener balances y precio de WETH en paralelo
    let wethPriceUSD: number | null = null;
    const [balances, priceResult] = (await Promise.all([
      getBalances(),
      client
        .readContract({
          address: config.CHAINLINK_WETH_USD_FEED as `0x${string}`,
          abi: ORACLE_ABI,
          functionName: "latestRoundData",
        })
        .catch((err) => {
          logger.warn(
            "Chainlink Oracle call failed, proceeding with null price",
            { error: err.message },
          );
          return null;
        }),
    ])) as [any, readonly any[] | null];

    if (priceResult) {
      wethPriceUSD = Number(priceResult[1]) / 1e8;
    }

    // 2. Obtener préstamos activos reales de Floe
    const activeLoans = await fetchFloeLoans(
      client.getAddress() as `0x${string}`,
      wethPriceUSD,
    );

    logger.info("Real perceptions updated", {
      usdc: balances.usdc,
      price: wethPriceUSD,
      loans: activeLoans.length,
      apiEarnings: globalStats.totalApiEarnings,
    });

    return {
      usdcBalance: balances.usdc,
      wethBalance: balances.weth,
      wethPriceUSD,
      activeLoans,
      totalApiEarnings: globalStats.totalApiEarnings,
      lastAction: "monitor",
    };
  } catch (error: any) {
    logger.error("Real perception cycle failed", { error: error.message });
    return { lastAction: "monitor_error" };
  }
}

/**
 * Consulta LendingIntentMatcher para obtener préstamos reales.
 */
async function fetchFloeLoans(
  address: `0x${string}`,
  currentPrice: number | null,
): Promise<FloeLoan[]> {
  const client = getWalletClient();

  try {
    const loanIds = (await client.readContract({
      address: config.LENDING_INTENT_MATCHER,
      abi: MATCHER_ABI,
      functionName: "getLoanIdsByUser",
      args: [address],
    })) as bigint[];

    const loansRaw = (await Promise.all(
      loanIds.map((id) =>
        client.readContract({
          address: config.LENDING_INTENT_MATCHER,
          abi: MATCHER_ABI,
          functionName: "getLoan",
          args: [id],
        }),
      ),
    )) as Loan[];

    return loansRaw
      .filter((l) => !l.repaid)
      .map((l) => {
        const principal = Number(l.principal) / 1e6;
        const collateral = Number(l.collateralAmount) / 1e18;
        const currentLtv = calculateLTV(
          principal,
          collateral,
          currentPrice ?? 0,
        );
        const daysRemaining = calculateDaysRemaining(
          Number(l.startTime),
          Number(l.duration),
        );

        return {
          id: l.loanId.toString(),
          principal,
          collateral,
          ltv: currentLtv,
          daysRemaining,
          status: FloeLoanStatus.ACTIVE,
        };
      });
  } catch (error: any) {
    logger.error("Error fetching real Floe loans", { error: error.message });
    return [];
  }
}
