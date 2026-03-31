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

import { monitorState } from "../../src/nodes/monitor";
import { getWalletClient, getBalances } from "../../src/wallet";
import { globalStats, initialState } from "../../src/state";

const mockGetWalletClient = vi.mocked(getWalletClient);
const mockGetBalances = vi.mocked(getBalances);

function createMockClient() {
  return {
    getAddress: vi
      .fn()
      .mockReturnValue("0x1234567890abcdef1234567890abcdef12345678"),
    readContract: vi.fn(),
    sendTransaction: vi.fn().mockResolvedValue({ hash: "0xfake" }),
  };
}

describe("monitorState node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalStats.totalApiEarnings = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return updated balances, price, and active loans on happy path", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);
    mockGetBalances.mockResolvedValue({ usdc: 100, weth: 2 });

    // Call 1: Chainlink oracle
    mockClient.readContract.mockResolvedValueOnce([
      0n,
      300000000000n,
      0n,
      0n,
      0n,
    ]);
    // Call 2: getLoanIdsByUser
    mockClient.readContract.mockResolvedValueOnce([]);

    const result = await monitorState(initialState);

    expect(result.usdcBalance).toBe(100);
    expect(result.wethBalance).toBe(2);
    expect(result.wethPriceUSD).toBe(3000);
    expect(result.activeLoans).toEqual([]);
    expect(result.lastAction).toBe("monitor");
  });

  it("should handle Chainlink oracle failure gracefully", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);
    mockGetBalances.mockResolvedValue({ usdc: 50, weth: 1 });

    // Call 1: Chainlink rejects
    mockClient.readContract.mockRejectedValueOnce(
      new Error("Oracle unavailable"),
    );
    // Call 2: getLoanIdsByUser
    mockClient.readContract.mockResolvedValueOnce([]);

    const result = await monitorState(initialState);

    expect(result.wethPriceUSD).toBeNull();
    expect(result.usdcBalance).toBe(50);
    expect(result.lastAction).toBe("monitor");
  });

  it("should parse multiple active loans correctly", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);
    mockGetBalances.mockResolvedValue({ usdc: 200, weth: 3 });

    // Call 1: Chainlink oracle ($3000 WETH)
    mockClient.readContract.mockResolvedValueOnce([
      0n,
      300000000000n,
      0n,
      0n,
      0n,
    ]);
    // Call 2: getLoanIdsByUser
    mockClient.readContract.mockResolvedValueOnce([1n, 2n]);
    // Call 3: getLoan(1)
    mockClient.readContract.mockResolvedValueOnce({
      loanId: 1n,
      principal: 5000000000n,
      collateralAmount: 2000000000000000000n,
      startTime: BigInt(now - 86400 * 3),
      duration: 86400n * 7n,
      repaid: false,
    });
    // Call 4: getLoan(2)
    mockClient.readContract.mockResolvedValueOnce({
      loanId: 2n,
      principal: 3000000000n,
      collateralAmount: 1000000000000000000n,
      startTime: BigInt(now - 86400 * 2),
      duration: 86400n * 7n,
      repaid: false,
    });

    const result = await monitorState(initialState);

    expect(result.activeLoans).toHaveLength(2);
    expect(result.activeLoans[0].id).toBe("1");
    expect(result.activeLoans[1].id).toBe("2");
    expect(result.activeLoans[0].principal).toBe(5000);
    expect(result.activeLoans[1].collateral).toBe(1);
  });

  it("should filter out repaid loans", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);
    mockGetBalances.mockResolvedValue({ usdc: 100, weth: 1 });

    // Call 1: Chainlink
    mockClient.readContract.mockResolvedValueOnce([
      0n,
      300000000000n,
      0n,
      0n,
      0n,
    ]);
    // Call 2: getLoanIdsByUser
    mockClient.readContract.mockResolvedValueOnce([1n, 2n]);
    // Call 3: getLoan(1) - repaid
    mockClient.readContract.mockResolvedValueOnce({
      loanId: 1n,
      principal: 1000000000n,
      collateralAmount: 1000000000000000000n,
      startTime: 0n,
      duration: 86400n * 7n,
      repaid: true,
    });
    // Call 4: getLoan(2) - active
    mockClient.readContract.mockResolvedValueOnce({
      loanId: 2n,
      principal: 2000000000n,
      collateralAmount: 1000000000000000000n,
      startTime: BigInt(Math.floor(Date.now() / 1000)),
      duration: 86400n * 7n,
      repaid: false,
    });

    const result = await monitorState(initialState);

    expect(result.activeLoans).toHaveLength(1);
    expect(result.activeLoans[0].id).toBe("2");
  });

  it("should return empty loans when Floe fetch fails", async () => {
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);
    mockGetBalances.mockResolvedValue({ usdc: 100, weth: 1 });

    // Call 1: Chainlink
    mockClient.readContract.mockResolvedValueOnce([
      0n,
      300000000000n,
      0n,
      0n,
      0n,
    ]);
    // Call 2: getLoanIdsByUser fails
    mockClient.readContract.mockRejectedValueOnce(
      new Error("Floe contract error"),
    );

    const result = await monitorState(initialState);

    expect(result.activeLoans).toEqual([]);
    expect(result.lastAction).toBe("monitor");
  });

  it("should return monitor_error on critical failure", async () => {
    mockGetWalletClient.mockImplementation(() => {
      throw new Error("Wallet not connected");
    });

    const result = await monitorState(initialState);

    expect(result.lastAction).toBe("monitor_error");
  });

  it("should propagate globalStats.totalApiEarnings into state", async () => {
    globalStats.totalApiEarnings = 42.5;

    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);
    mockGetBalances.mockResolvedValue({ usdc: 100, weth: 1 });
    mockClient.readContract.mockResolvedValueOnce([
      0n,
      300000000000n,
      0n,
      0n,
      0n,
    ]);
    mockClient.readContract.mockResolvedValueOnce([]);

    const result = await monitorState(initialState);

    expect(result.totalApiEarnings).toBe(42.5);
  });

  it("should correctly calculate LTV for each loan based on current price", async () => {
    const now = Math.floor(Date.now() / 1000);
    const mockClient = createMockClient();
    mockGetWalletClient.mockReturnValue(mockClient as any);
    mockGetBalances.mockResolvedValue({ usdc: 100, weth: 1 });

    // Call 1: Chainlink ($2500 WETH)
    mockClient.readContract.mockResolvedValueOnce([
      0n,
      250000000000n,
      0n,
      0n,
      0n,
    ]);
    // Call 2: getLoanIdsByUser
    mockClient.readContract.mockResolvedValueOnce([1n]);
    // Call 3: getLoan(1) - $5000 principal, 2 WETH collateral
    mockClient.readContract.mockResolvedValueOnce({
      loanId: 1n,
      principal: 5000000000n,
      collateralAmount: 2000000000000000000n,
      startTime: BigInt(now),
      duration: 86400n * 7n,
      repaid: false,
    });

    const result = await monitorState(initialState);

    // LTV = 5000 / (2 * 2500) * 100 = 100%
    expect(result.activeLoans[0].ltv).toBeCloseTo(100, 0);
  });
});
