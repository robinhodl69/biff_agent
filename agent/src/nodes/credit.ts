import { BiffState } from "../state";
import { getWalletClient } from "../wallet";
import { config } from "../config";
import { logger } from "../logger";
import { BorrowIntent, LendIntent } from "../types/floe";
import {
  parseUnits,
  keccak256,
  encodeAbiParameters,
  parseAbiParameters,
  encodeFunctionData,
} from "viem";
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
    name: "registerBorrowIntent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "intent",
        type: "tuple",
        components: [
          { name: "borrower", type: "address" },
          { name: "onBehalfOf", type: "address" },
          { name: "borrowAmount", type: "uint256" },
          { name: "collateralAmount", type: "uint256" },
          { name: "minFillAmount", type: "uint256" },
          { name: "maxInterestRateBps", type: "uint256" },
          { name: "minLtvBps", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "allowPartialFill", type: "bool" },
          { name: "validFromTimestamp", type: "uint256" },
          { name: "matcherCommissionBps", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "marketId", type: "bytes32" },
          { name: "salt", type: "bytes32" },
          {
            name: "conditions",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
          {
            name: "preHooks",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "gasLimit", type: "uint256" },
              { name: "expiry", type: "uint256" },
              { name: "allowFailure", type: "bool" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
          {
            name: "postHooks",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "gasLimit", type: "uint256" },
              { name: "expiry", type: "uint256" },
              { name: "allowFailure", type: "bool" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
        ],
      },
    ],
    outputs: [],
  },
  {
    name: "matchLoanIntents",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "lender",
        type: "tuple",
        components: [
          { name: "lender", type: "address" },
          { name: "onBehalfOf", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "minFillAmount", type: "uint256" },
          { name: "filledAmount", type: "uint256" },
          { name: "minInterestRateBps", type: "uint256" },
          { name: "maxLtvBps", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "allowPartialFill", type: "bool" },
          { name: "validFromTimestamp", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "marketId", type: "bytes32" },
          { name: "salt", type: "bytes32" },
          {
            name: "conditions",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
          {
            name: "preHooks",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "gasLimit", type: "uint256" },
              { name: "expiry", type: "uint256" },
              { name: "allowFailure", type: "bool" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
          {
            name: "postHooks",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "gasLimit", type: "uint256" },
              { name: "expiry", type: "uint256" },
              { name: "allowFailure", type: "bool" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
        ],
      },
      { name: "lenderSig", type: "bytes" },
      {
        name: "borrower",
        type: "tuple",
        components: [
          { name: "borrower", type: "address" },
          { name: "onBehalfOf", type: "address" },
          { name: "borrowAmount", type: "uint256" },
          { name: "collateralAmount", type: "uint256" },
          { name: "minFillAmount", type: "uint256" },
          { name: "maxInterestRateBps", type: "uint256" },
          { name: "minLtvBps", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "allowPartialFill", type: "bool" },
          { name: "validFromTimestamp", type: "uint256" },
          { name: "matcherCommissionBps", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "marketId", type: "bytes32" },
          { name: "salt", type: "bytes32" },
          {
            name: "conditions",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
          {
            name: "preHooks",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "gasLimit", type: "uint256" },
              { name: "expiry", type: "uint256" },
              { name: "allowFailure", type: "bool" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
          {
            name: "postHooks",
            type: "tuple[]",
            components: [
              { name: "target", type: "address" },
              { name: "callData", type: "bytes" },
              { name: "gasLimit", type: "uint256" },
              { name: "expiry", type: "uint256" },
              { name: "allowFailure", type: "bool" },
              { name: "applyToAllPartialFills", type: "bool" },
            ],
          },
        ],
      },
      { name: "borrowerSig", type: "bytes" },
      { name: "marketId", type: "bytes32" },
      { name: "isLenderOnChain", type: "bool" },
      { name: "isBorrowerOnChain", type: "bool" },
    ],
    outputs: [{ type: "uint256" }],
  },
] as const;

/**
 * requestCredit: Flujo real de préstamo on-chain.
 */
export async function requestCredit(
  _state: BiffState,
): Promise<Partial<BiffState>> {
  logger.info("Node: request_credit - Real borrow flow initiated");
  const client = getWalletClient();
  const address = client.getAddress() as `0x${string}`;

  try {
    const { minUsdcBalance, maxLtv } = getStore().getConfig();
    const borrowAmount = parseUnits((minUsdcBalance * 2).toString(), 6);
    const collateralAmount = parseUnits("0.1", 18);

    const borrowIntent: BorrowIntent = {
      borrower: address,
      onBehalfOf: address,
      borrowAmount,
      collateralAmount,
      minFillAmount: borrowAmount,
      maxInterestRateBps: 1500n,
      minLtvBps: BigInt(maxLtv * 100),
      duration: 60n * 60n * 24n * 7n,
      allowPartialFill: false,
      validFromTimestamp: BigInt(Math.floor(Date.now() / 1000)),
      matcherCommissionBps: 0n,
      expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
      marketId: keccak256("0x01"),
      salt: keccak256(
        encodeAbiParameters(parseAbiParameters("uint256"), [
          BigInt(Date.now()),
        ]),
      ),
      conditions: [],
      preHooks: [],
      postHooks: [],
    };

    // 1. Registrar Intent
    logger.info("Registering borrow intent on-chain");
    await client.sendTransaction({
      to: config.LENDING_INTENT_MATCHER,
      data: encodeFunctionData({
        abi: MATCHER_ABI,
        functionName: "registerBorrowIntent",
        args: [borrowIntent],
      }),
    });

    // 2. Aprobar colateral
    logger.info("Approving WETH collateral");
    await client.sendTransaction({
      to: config.WETH_ADDRESS,
      data: encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [config.LENDING_INTENT_MATCHER, collateralAmount],
      }),
    });

    // 3. Match
    logger.info("Fetching best offer and matching");
    const bestOffer = await fetchBestOffer(borrowAmount);

    if (bestOffer) {
      await client.sendTransaction({
        to: config.LENDING_INTENT_MATCHER,
        data: encodeFunctionData({
          abi: MATCHER_ABI,
          functionName: "matchLoanIntents",
          args: [
            bestOffer.lender,
            "0x",
            borrowIntent,
            "0x",
            borrowIntent.marketId,
            true,
            true,
          ],
        }),
      });
      return {
        lastAction: "credit_opened",
        actionReason: "Matched successfully",
      };
    }

    return { lastAction: "idle", actionReason: "No offers" };
  } catch (error: any) {
    logger.error("Credit request failed", { error: error.message });
    return { lastAction: "credit_failed" };
  }
}

async function fetchBestOffer(
  _amount: bigint,
): Promise<{ lender: LendIntent } | null> {
  try {
    const response = await fetch(`${config.FLOE_API_URL}/getintentbook`);
    if (response.ok) {
      const book = await response.json();
      return book.offers?.[0] || null;
    }
  } catch {}
  return null;
}
