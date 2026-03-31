import { BiffState } from "../state";
import { getWalletClient } from "../wallet";
import { config } from "../config";
import { logger } from "../logger";
import { parseUnits, encodeFunctionData } from "viem";
import { getStore } from "../store";

const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const MATCHER_ABI = [
  {
    name: "repayLoan",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "loanId", type: "uint256" },
      { name: "repayAmount", type: "uint256" },
      { name: "maxTotalRepayment", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "addCollateral",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "loanId", type: "uint256" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

/**
 * addCollateral: Incrementa el colateral real on-chain.
 */
export async function addCollateral(
  state: BiffState,
): Promise<Partial<BiffState>> {
  logger.info("Node: add_collateral - Real mitigation flow");
  const client = getWalletClient();

  try {
    const { maxLtv } = getStore().getConfig();
    const atRiskLoan = state.activeLoans.find((l) => l.ltv > maxLtv);
    if (!atRiskLoan) return { lastAction: "idle" };

    const amountToAdd = parseUnits("0.05", 18);

    // 1. Aprobar WETH
    logger.info("Approving WETH for additional collateral");
    await client.sendTransaction({
      to: config.WETH_ADDRESS,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [config.LENDING_INTENT_MATCHER, amountToAdd],
      }),
    });

    // 2. Llamar addCollateral
    logger.info("Executing addCollateral on-chain", { loanId: atRiskLoan.id });
    await client.sendTransaction({
      to: config.LENDING_INTENT_MATCHER,
      data: encodeFunctionData({
        abi: MATCHER_ABI,
        functionName: "addCollateral",
        args: [BigInt(atRiskLoan.id), amountToAdd],
      }),
    });

    return {
      lastAction: "collateral_added",
      actionReason: `LTV de préstamo ${atRiskLoan.id} mitigado on-chain.`,
    };
  } catch (error: any) {
    logger.error("Failed to add collateral on-chain", { error: error.message });
    return { lastAction: "payment_error" };
  }
}

/**
 * repayOrRenew: Gestión de ciclo de vida real.
 */
export async function repayOrRenew(
  state: BiffState,
): Promise<Partial<BiffState>> {
  logger.info("Node: repay_or_renew - Real lifecycle management");
  const client = getWalletClient();

  try {
    const { loanWarnDays } = getStore().getConfig();
    const expiringLoan = state.activeLoans.find(
      (l) => l.daysRemaining < loanWarnDays,
    );
    if (!expiringLoan) return { lastAction: "idle" };

    const shouldRepay = state.usdcBalance > expiringLoan.principal * 1.1;
    const loanId = BigInt(expiringLoan.id);

    if (shouldRepay) {
      const repayAmount = parseUnits(expiringLoan.principal.toString(), 6);

      // 1. Aprobar USDC
      logger.info("Approving USDC for repayment");
      await client.sendTransaction({
        to: config.USDC_ADDRESS,
        data: encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "approve",
          args: [config.LENDING_INTENT_MATCHER, repayAmount * 2n],
        }),
      });

      // 2. Ejecutar repayLoan
      logger.info("Executing repayLoan on-chain", { loanId: expiringLoan.id });
      await client.sendTransaction({
        to: config.LENDING_INTENT_MATCHER,
        data: encodeFunctionData({
          abi: MATCHER_ABI,
          functionName: "repayLoan",
          args: [loanId, repayAmount, repayAmount * 2n],
        }),
      });

      return {
        lastAction: "repaid",
        actionReason: `Préstamo ${expiringLoan.id} pagado.`,
      };
    }

    return {
      lastAction: "idle",
      actionReason: "Renewal logic pending Phase 6",
    };
  } catch (error: any) {
    logger.error("Failed to manage loan lifecycle", { error: error.message });
    return { lastAction: "payment_error" };
  }
}

export async function processPayment(
  _state: BiffState,
): Promise<Partial<BiffState>> {
  return { lastAction: "payment_processed" };
}
