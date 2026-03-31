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

vi.mock("../../src/store", () => ({
  getStore: vi.fn(() => ({
    getConfig: () => ({
      minUsdcBalance: 50,
      maxLtv: 70,
      loanWarnDays: 3,
      loopIntervalMin: 5,
      isPaused: false,
    }),
  })),
}));

import { requestCredit } from "../../src/nodes/credit";
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

describe("requestCredit node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should register borrow intent and approve collateral before matching", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    // Native fetch cannot be mocked in Node.js, so fetchBestOffer returns null
    // This tests the pre-match flow: register intent + approve collateral
    const result = await requestCredit(initialState);

    // Two transactions always happen: registerBorrowIntent + approve WETH
    expect(mockClient.sendTransaction).toHaveBeenCalledTimes(2);

    // First tx targets the Floe matcher contract (registerBorrowIntent)
    const firstCall = mockClient.sendTransaction.mock.calls[0][0];
    expect(firstCall.to).toBe("0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E");

    // Second tx targets WETH contract (approve)
    const secondCall = mockClient.sendTransaction.mock.calls[1][0];
    expect(secondCall.to).toBe("0x4200000000000000000000000000000000000006");

    // No offers available (fetch not mockable in Node) → idle
    expect(result.lastAction).toBe("idle");
    expect(result.actionReason).toBe("No offers");
  });

  it("should return credit_failed when registerBorrowIntent transaction reverts", async () => {
    const mockClient = createMockClient();
    mockClient.sendTransaction.mockRejectedValueOnce(
      new Error("execution reverted"),
    );
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const result = await requestCredit(initialState);

    expect(result.lastAction).toBe("credit_failed");
  });

  it("should return credit_failed when approve transaction fails", async () => {
    const mockClient = createMockClient();
    // First tx succeeds, second fails
    mockClient.sendTransaction.mockResolvedValueOnce({ hash: "0x1" });
    mockClient.sendTransaction.mockRejectedValueOnce(
      new Error("allowance exceeded"),
    );
    mockGetWalletClient.mockReturnValue(mockClient as any);

    const result = await requestCredit(initialState);

    expect(result.lastAction).toBe("credit_failed");
  });

  it("should use correct Floe matcher contract address", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    await requestCredit(initialState);

    const registerCall = mockClient.sendTransaction.mock.calls[0][0];
    expect(registerCall.to).toBe("0xF351eDF229ded7E2e2b23E44c70e9964CbA91B2E");
  });

  it("should use correct WETH contract address for approval", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);

    await requestCredit(initialState);

    const approveCall = mockClient.sendTransaction.mock.calls[1][0];
    expect(approveCall.to).toBe("0x4200000000000000000000000000000000000006");
  });
});
