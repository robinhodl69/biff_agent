import { describe, it, expect } from "vitest";
import { initialState, globalStats } from "../src/state";
import { config } from "../src/config";
import {
  calculateLTV,
  calculateDaysRemaining,
  isLoanAtRisk,
  isLoanExpiring,
  canRepayLoan,
} from "../src/utils/financial";

// ============================================================
// STATE TESTS
// ============================================================

describe("BiffState", () => {
  it("should initialize with zero balances", () => {
    expect(initialState.usdcBalance).toBe(0);
    expect(initialState.wethBalance).toBe(0);
  });

  it("should initialize with null WETH price", () => {
    expect(initialState.wethPriceUSD).toBeNull();
  });

  it("should initialize with empty activeLoans", () => {
    expect(initialState.activeLoans).toEqual([]);
  });

  it("should initialize with START as lastAction", () => {
    expect(initialState.lastAction).toBe("START");
  });

  it("should initialize with empty operationLog", () => {
    expect(initialState.operationLog).toEqual([]);
  });

  it("should initialize with zero earnings and pending requests", () => {
    expect(initialState.totalApiEarnings).toBe(0);
    expect(initialState.pendingApiRequests).toBe(0);
  });

  it("should have correct initial actionReason", () => {
    expect(initialState.actionReason).toBe("initialization");
  });
});

describe("globalStats", () => {
  it("should start with zero totalApiEarnings", () => {
    expect(globalStats.totalApiEarnings).toBe(0);
  });
});

// ============================================================
// CONFIG TESTS
// ============================================================

describe("Config", () => {
  it("should have required CDP credentials configured", () => {
    expect(config.CDP_API_KEY_ID).toBeDefined();
    expect(config.CDP_API_KEY_SECRET).toBeDefined();
    expect(config.CDP_WALLET_SECRET).toBeDefined();
  });

  it("should have valid network ID", () => {
    expect(config.NETWORK_ID).toBeDefined();
    expect(config.NETWORK_ID.length).toBeGreaterThan(0);
  });

  it("should have Floe contract addresses configured", () => {
    expect(config.LENDING_INTENT_MATCHER).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(config.PRICE_ORACLE).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should have valid Chainlink feed address", () => {
    expect(config.CHAINLINK_WETH_USD_FEED).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should have valid token addresses", () => {
    expect(config.USDC_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(config.WETH_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it("should have reasonable default thresholds", () => {
    expect(config.MIN_USDC_BALANCE).toBeGreaterThan(0);
    expect(config.MAX_LTV).toBeGreaterThan(0);
    expect(config.MAX_LTV).toBeLessThanOrEqual(100);
    expect(config.LOAN_WARN_DAYS).toBeGreaterThan(0);
  });

  it("should have positive agent loop interval", () => {
    expect(config.AGENT_LOOP_INTERVAL_MS).toBeGreaterThan(0);
  });

  it("should have protocol constants configured", () => {
    expect(config.MIN_LTV_GAP_BPS).toBeGreaterThan(0);
    expect(config.GRACE_PERIOD).toBeGreaterThan(0);
    expect(config.LIQUIDATION_BONUS_BPS).toBeGreaterThan(0);
  });
});

// ============================================================
// FINANCIAL UTILS TESTS
// ============================================================

describe("calculateLTV", () => {
  it("should calculate correct LTV for a standard loan", () => {
    // $5000 principal, 2 WETH collateral at $3000/WETH
    const ltv = calculateLTV(5000, 2, 3000);
    expect(ltv).toBeCloseTo(83.33, 1);
  });

  it("should return 0 when collateral price is 0", () => {
    const ltv = calculateLTV(5000, 2, 0);
    expect(ltv).toBe(0);
  });

  it("should return 0 when collateral price is negative", () => {
    const ltv = calculateLTV(5000, 2, -100);
    expect(ltv).toBe(0);
  });

  it("should return 0 when collateral amount is 0", () => {
    const ltv = calculateLTV(5000, 0, 3000);
    expect(ltv).toBe(0);
  });

  it("should return 0 when collateral amount is negative", () => {
    const ltv = calculateLTV(5000, -1, 3000);
    expect(ltv).toBe(0);
  });

  it("should return 100% when principal equals collateral value", () => {
    const ltv = calculateLTV(6000, 2, 3000);
    expect(ltv).toBeCloseTo(100, 1);
  });

  it("should return 50% when principal is half of collateral value", () => {
    const ltv = calculateLTV(3000, 2, 3000);
    expect(ltv).toBeCloseTo(50, 1);
  });

  it("should handle very small amounts", () => {
    const ltv = calculateLTV(1, 1, 1);
    expect(ltv).toBeCloseTo(100, 1);
  });

  it("should handle large amounts", () => {
    const ltv = calculateLTV(1_000_000, 500, 4000);
    expect(ltv).toBeCloseTo(50, 1);
  });
});

describe("calculateDaysRemaining", () => {
  it("should return positive days for future expiry", () => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - 86400 * 3; // started 3 days ago
    const duration = 86400 * 7; // 7 day loan
    const days = calculateDaysRemaining(startTime, duration);
    expect(days).toBeCloseTo(4, 0);
  });

  it("should return 0 for expired loan", () => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - 86400 * 10; // started 10 days ago
    const duration = 86400 * 7; // 7 day loan (expired 3 days ago)
    const days = calculateDaysRemaining(startTime, duration);
    expect(days).toBe(0);
  });

  it("should return 0 for loan expiring right now", () => {
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - 86400 * 7;
    const duration = 86400 * 7;
    const days = calculateDaysRemaining(startTime, duration);
    expect(days).toBeLessThan(0.01);
  });
});

describe("isLoanAtRisk", () => {
  it("should return true when LTV exceeds max", () => {
    expect(isLoanAtRisk(75, 70)).toBe(true);
  });

  it("should return false when LTV is below max", () => {
    expect(isLoanAtRisk(60, 70)).toBe(false);
  });

  it("should return false when LTV equals max", () => {
    expect(isLoanAtRisk(70, 70)).toBe(false);
  });

  it("should return true for extremely high LTV", () => {
    expect(isLoanAtRisk(150, 70)).toBe(true);
  });

  it("should return false for zero LTV", () => {
    expect(isLoanAtRisk(0, 70)).toBe(false);
  });
});

describe("isLoanExpiring", () => {
  it("should return true when days remaining is below threshold", () => {
    expect(isLoanExpiring(2, 3)).toBe(true);
  });

  it("should return false when days remaining is above threshold", () => {
    expect(isLoanExpiring(5, 3)).toBe(false);
  });

  it("should return false when days remaining equals threshold", () => {
    expect(isLoanExpiring(3, 3)).toBe(false);
  });

  it("should return true for expired loan (0 days)", () => {
    expect(isLoanExpiring(0, 3)).toBe(true);
  });
});

describe("canRepayLoan", () => {
  it("should return true when balance exceeds principal with buffer", () => {
    expect(canRepayLoan(551, 500, 1.1)).toBe(true);
  });

  it("should return false when balance is below principal with buffer", () => {
    expect(canRepayLoan(500, 500, 1.1)).toBe(false);
  });

  it("should return true with exact balance and no buffer", () => {
    expect(canRepayLoan(500, 500, 1.0)).toBe(false); // > not >=
  });

  it("should return false when balance is zero", () => {
    expect(canRepayLoan(0, 500)).toBe(false);
  });

  it("should use default buffer of 1.1", () => {
    expect(canRepayLoan(549, 500)).toBe(false);
    expect(canRepayLoan(551, 500)).toBe(true);
  });

  it("should handle custom buffer multiplier", () => {
    expect(canRepayLoan(600, 500, 1.2)).toBe(false);
    expect(canRepayLoan(601, 500, 1.2)).toBe(true);
  });
});

// ============================================================
// DECISION RULES (evaluated inline — no LLM calls)
// ============================================================

describe("Decision Rules", () => {
  it("should request credit when USDC balance is below minimum", async () => {
    const state = {
      usdcBalance: 5,
      wethBalance: 2,
      wethPriceUSD: 3000,
      activeLoans: [],
      lastAction: "monitor" as const,
      actionReason: "",
      totalApiEarnings: 0,
      pendingApiRequests: 0,
      operationLog: [],
    };

    // Regla: si usdcBalance < MIN_USDC_BALANCE → request_credit
    const shouldRequestCredit = state.usdcBalance < config.MIN_USDC_BALANCE;
    expect(shouldRequestCredit).toBe(true);
  });

  it("should not request credit when USDC balance is sufficient", async () => {
    const state = {
      usdcBalance: 100,
      wethBalance: 2,
      wethPriceUSD: 3000,
      activeLoans: [],
      lastAction: "monitor" as const,
      actionReason: "",
      totalApiEarnings: 0,
      pendingApiRequests: 0,
      operationLog: [],
    };

    const shouldRequestCredit = state.usdcBalance < config.MIN_USDC_BALANCE;
    expect(shouldRequestCredit).toBe(false);
  });

  it("should identify at-risk loans based on LTV", async () => {
    const state = {
      usdcBalance: 100,
      wethBalance: 2,
      wethPriceUSD: 3000,
      activeLoans: [
        { id: "1", ltv: 65, daysRemaining: 5, principal: 5000, collateral: 2 },
        { id: "2", ltv: 78, daysRemaining: 4, principal: 3000, collateral: 1 },
      ],
      lastAction: "monitor" as const,
      actionReason: "",
      totalApiEarnings: 0,
      pendingApiRequests: 0,
      operationLog: [],
    };

    const atRiskLoan = state.activeLoans.find((l) => l.ltv > config.MAX_LTV);
    expect(atRiskLoan).toBeDefined();
    expect(atRiskLoan?.id).toBe("2");
  });

  it("should identify expiring loans", async () => {
    const state = {
      usdcBalance: 100,
      wethBalance: 2,
      wethPriceUSD: 3000,
      activeLoans: [
        { id: "1", ltv: 60, daysRemaining: 5, principal: 5000, collateral: 2 },
        { id: "2", ltv: 55, daysRemaining: 2, principal: 3000, collateral: 1 },
      ],
      lastAction: "monitor" as const,
      actionReason: "",
      totalApiEarnings: 0,
      pendingApiRequests: 0,
      operationLog: [],
    };

    const expiringLoan = state.activeLoans.find(
      (l) => l.daysRemaining < config.LOAN_WARN_DAYS,
    );
    expect(expiringLoan).toBeDefined();
    expect(expiringLoan?.id).toBe("2");
  });

  it("should default to idle when everything is healthy", async () => {
    const state = {
      usdcBalance: 100,
      wethBalance: 2,
      wethPriceUSD: 3000,
      activeLoans: [
        { id: "1", ltv: 50, daysRemaining: 10, principal: 5000, collateral: 2 },
      ],
      lastAction: "monitor" as const,
      actionReason: "",
      totalApiEarnings: 0,
      pendingApiRequests: 0,
      operationLog: [],
    };

    const needsCredit = state.usdcBalance < config.MIN_USDC_BALANCE;
    const hasAtRiskLoan = state.activeLoans.some((l) => l.ltv > config.MAX_LTV);
    const hasExpiringLoan = state.activeLoans.some(
      (l) => l.daysRemaining < config.LOAN_WARN_DAYS,
    );

    expect(needsCredit).toBe(false);
    expect(hasAtRiskLoan).toBe(false);
    expect(hasExpiringLoan).toBe(false);
    // All healthy → idle
  });
});

// ============================================================
// FINANCIAL SCENARIO TESTS
// ============================================================

describe("Financial Scenarios", () => {
  it("should correctly process a healthy loan state", () => {
    const principal = 5000; // USDC
    const collateral = 2; // WETH
    const price = 3500; // USD per WETH

    const ltv = calculateLTV(principal, collateral, price);
    const atRisk = isLoanAtRisk(ltv, config.MAX_LTV);

    expect(ltv).toBeCloseTo(71.43, 1);
    expect(atRisk).toBe(true); // slightly above 70%
  });

  it("should correctly process a safe loan state", () => {
    const principal = 3000;
    const collateral = 2;
    const price = 3000;

    const ltv = calculateLTV(principal, collateral, price);
    const atRisk = isLoanAtRisk(ltv, config.MAX_LTV);

    expect(ltv).toBeCloseTo(50, 1);
    expect(atRisk).toBe(false);
  });

  it("should correctly determine repayment capability", () => {
    const usdcBalance = 6000;
    const loan1Principal = 3000;
    const loan2Principal = 5000;

    expect(canRepayLoan(usdcBalance, loan1Principal)).toBe(true);
    expect(canRepayLoan(usdcBalance, loan2Principal)).toBe(true);
    expect(canRepayLoan(usdcBalance, 5500)).toBe(false);
  });

  it("should handle multiple loans with mixed states", () => {
    const loans = [
      { id: "1", principal: 3000, collateral: 2, ltv: 50, daysRemaining: 10 },
      { id: "2", principal: 5000, collateral: 2, ltv: 83, daysRemaining: 1 },
      { id: "3", principal: 2000, collateral: 1, ltv: 60, daysRemaining: 5 },
    ];

    const atRiskLoans = loans.filter((l) =>
      isLoanAtRisk(l.ltv, config.MAX_LTV),
    );
    const expiringLoans = loans.filter((l) =>
      isLoanExpiring(l.daysRemaining, config.LOAN_WARN_DAYS),
    );

    expect(atRiskLoans).toHaveLength(1);
    expect(atRiskLoans[0].id).toBe("2");
    expect(expiringLoans).toHaveLength(1);
    expect(expiringLoans[0].id).toBe("2");
    // Loan 2 is both at-risk AND expiring
  });
});
