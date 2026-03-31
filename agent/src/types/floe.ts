export enum FloeLoanStatus {
  ACTIVE = 'ACTIVE',
  REPAID = 'REPAID',
  LIQUIDATED = 'LIQUIDATED'
}

/**
 * Representa un préstamo en el protocolo Floe (On-chain struct).
 */
export interface Loan {
  marketId: `0x${string}`;
  loanId: bigint;
  lender: `0x${string}`;
  borrower: `0x${string}`;
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  principal: bigint;
  interestRateBps: bigint;
  ltvBps: bigint;
  liquidationLtvBps: bigint;
  marketFeeBps: bigint;
  matcherCommissionBps: bigint;
  startTime: bigint;
  duration: bigint;
  collateralAmount: bigint;
  repaid: boolean;
}

/**
 * Representa un préstamo procesado para BiffState.
 */
export interface FloeLoan {
  id: string;
  principal: number;
  collateral: number;
  ltv: number;
  daysRemaining: number;
  status: FloeLoanStatus;
}

export interface BorrowIntent {
  borrower: `0x${string}`;
  onBehalfOf: `0x${string}`;
  borrowAmount: bigint;
  collateralAmount: bigint;
  minFillAmount: bigint;
  maxInterestRateBps: bigint;
  minLtvBps: bigint;
  duration: bigint;
  allowPartialFill: boolean;
  validFromTimestamp: bigint;
  matcherCommissionBps: bigint;
  expiry: bigint;
  marketId: `0x${string}`;
  salt: `0x${string}`;
  conditions: { target: `0x${string}`; callData: `0x${string}`; applyToAllPartialFills: boolean }[];
  preHooks: { target: `0x${string}`; callData: `0x${string}`; gasLimit: bigint; expiry: bigint; allowFailure: boolean; applyToAllPartialFills: boolean }[];
  postHooks: { target: `0x${string}`; callData: `0x${string}`; gasLimit: bigint; expiry: bigint; allowFailure: boolean; applyToAllPartialFills: boolean }[];
}

export interface LendIntent {
  lender: `0x${string}`;
  onBehalfOf: `0x${string}`;
  amount: bigint;
  minFillAmount: bigint;
  filledAmount: bigint;
  minInterestRateBps: bigint;
  maxLtvBps: bigint;
  duration: bigint;
  allowPartialFill: boolean;
  validFromTimestamp: bigint;
  expiry: bigint;
  marketId: `0x${string}`;
  salt: `0x${string}`;
  conditions: { target: `0x${string}`; callData: `0x${string}`; applyToAllPartialFills: boolean }[];
  preHooks: { target: `0x${string}`; callData: `0x${string}`; gasLimit: bigint; expiry: bigint; allowFailure: boolean; applyToAllPartialFills: boolean }[];
  postHooks: { target: `0x${string}`; callData: `0x${string}`; gasLimit: bigint; expiry: bigint; allowFailure: boolean; applyToAllPartialFills: boolean }[];
}
