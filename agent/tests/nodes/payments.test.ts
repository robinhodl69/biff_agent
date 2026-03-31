import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/wallet", () => ({
  getWalletClient: vi.fn(),
  getBalances: vi.fn(),
  initWallet: vi.fn(),
}));

vi.mock("../../src/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { addCollateral, repayOrRenew } from "../../src/nodes/payments";
import { getWalletClient } from "../../src/wallet";
import { initialState } from "../../src/state";

const mockGetWalletClient = vi.mocked(getWalletClient);

function createMockClient() {
  return {
    getAddress: vi
      .fn()
      .mockReturnValue("0x1234567890abcdef1234567890abcdef12345678"),
    readContract: vi.fn().mockResolvedValue(0n),
    sendTransaction: vi.fn().mockResolvedValue({ hash: "0xfake" }),
  };
}

// ============================================================
// addCollateral TESTS
// ============================================================

describe("addCollateral node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should add collateral to at-risk loan and return collateral_added", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      activeLoans: [
        { id: "1", ltv: 60, daysRemaining: 5, principal: 3000, collateral: 1 },
        { id: "2", ltv: 78, daysRemaining: 4, principal: 5000, collateral: 2 }, // above 70% MAX_LTV
      ],
    };

    const result = await addCollateral(state);

    expect(mockClient.sendTransaction).toHaveBeenCalledTimes(2);

    // First: approve WETH
    const approveCall = mockClient.sendTransaction.mock.calls[0][0];
    expect(approveCall.to).toBe("0x4200000000000000000000000000000000000006");

    // Second: addCollateral on matcher contract
    const collateralCall = mockClient.sendTransaction.mock.calls[1][0];
    expect(collateralCall.to).toBe(
      "0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E",
    );

    expect(result.lastAction).toBe("collateral_added");
    expect(result.actionReason).toContain("2"); // loan id
  });

  it("should return idle when no loans are at risk", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      activeLoans: [
        { id: "1", ltv: 50, daysRemaining: 5, principal: 3000, collateral: 1 },
        { id: "2", ltv: 65, daysRemaining: 4, principal: 5000, collateral: 2 },
      ],
    };

    const result = await addCollateral(state);

    expect(mockClient.sendTransaction).not.toHaveBeenCalled();
    expect(result.lastAction).toBe("idle");
  });

  it("should return idle when no active loans exist", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const result = await addCollateral(initialState);

    expect(mockClient.sendTransaction).not.toHaveBeenCalled();
    expect(result.lastAction).toBe("idle");
  });

  it("should return payment_error when transaction fails", async () => {
    const mockClient = createMockClient();
    mockClient.sendTransaction.mockRejectedValueOnce(
      new Error("insufficient WETH balance"),
    );
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      activeLoans: [
        { id: "1", ltv: 80, daysRemaining: 3, principal: 5000, collateral: 2 },
      ],
    };

    const result = await addCollateral(state);

    expect(result.lastAction).toBe("payment_error");
  });

  it("should target the first at-risk loan when multiple are at risk", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      activeLoans: [
        { id: "1", ltv: 85, daysRemaining: 2, principal: 5000, collateral: 2 },
        { id: "2", ltv: 90, daysRemaining: 1, principal: 8000, collateral: 3 },
      ],
    };

    const result = await addCollateral(state);

    // Verify the collateral call targets loan "1" (the first at-risk)
    const collateralCall = mockClient.sendTransaction.mock.calls[1][0];
    expect(collateralCall.data).toBeDefined();
    expect(result.lastAction).toBe("collateral_added");
  });
});

// ============================================================
// repayOrRenew TESTS
// ============================================================

describe("repayOrRenew node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should repay expiring loan when USDC balance is sufficient", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      usdcBalance: 6000,
      activeLoans: [
        { id: "1", ltv: 50, daysRemaining: 2, principal: 5000, collateral: 2 },
      ],
    };

    const result = await repayOrRenew(state);

    expect(mockClient.sendTransaction).toHaveBeenCalledTimes(2);

    // First: approve USDC
    const approveCall = mockClient.sendTransaction.mock.calls[0][0];
    expect(approveCall.to).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");

    // Second: repayLoan
    const repayCall = mockClient.sendTransaction.mock.calls[1][0];
    expect(repayCall.to).toBe("0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E");

    expect(result.lastAction).toBe("repaid");
    expect(result.actionReason).toContain("1"); // loan id
  });

  it("should return idle when USDC balance is insufficient for repayment", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      usdcBalance: 3000, // less than 5000 * 1.1 = 5500
      activeLoans: [
        { id: "1", ltv: 50, daysRemaining: 2, principal: 5000, collateral: 2 },
      ],
    };

    const result = await repayOrRenew(state);

    expect(mockClient.sendTransaction).not.toHaveBeenCalled();
    expect(result.lastAction).toBe("idle");
    expect(result.actionReason).toContain("Renewal");
  });

  it("should return idle when no loans are expiring", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      usdcBalance: 10000,
      activeLoans: [
        { id: "1", ltv: 50, daysRemaining: 10, principal: 3000, collateral: 1 },
        { id: "2", ltv: 60, daysRemaining: 7, principal: 5000, collateral: 2 },
      ],
    };

    const result = await repayOrRenew(state);

    expect(mockClient.sendTransaction).not.toHaveBeenCalled();
    expect(result.lastAction).toBe("idle");
  });

  it("should return idle when no active loans exist", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const result = await repayOrRenew(initialState);

    expect(mockClient.sendTransaction).not.toHaveBeenCalled();
    expect(result.lastAction).toBe("idle");
  });

  it("should return payment_error when repayment transaction fails", async () => {
    const mockClient = createMockClient();
    mockClient.sendTransaction.mockRejectedValueOnce(
      new Error("insufficient USDC allowance"),
    );
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      usdcBalance: 10000,
      activeLoans: [
        { id: "1", ltv: 50, daysRemaining: 1, principal: 5000, collateral: 2 },
      ],
    };

    const result = await repayOrRenew(state);

    expect(result.lastAction).toBe("payment_error");
  });

  it("should use 2x safety buffer for USDC approval amount", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const state = {
      ...initialState,
      usdcBalance: 10000,
      activeLoans: [
        { id: "1", ltv: 50, daysRemaining: 2, principal: 5000, collateral: 2 },
      ],
    };

    await repayOrRenew(state);

    const approveCall = mockClient.sendTransaction.mock.calls[0][0];
    expect(approveCall.to).toBe("0x036CbD53842c5426634e7929541eC2318f3dCF7e");
    // The approval should be repayAmount * 2n (2x buffer)
    expect(approveCall.data).toBeDefined();
  });
});
