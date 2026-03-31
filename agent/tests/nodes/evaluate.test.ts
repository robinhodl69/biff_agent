import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../src/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/config")>();
  return {
    ...actual,
    getLLM: vi.fn(),
  };
});

vi.mock("../../src/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import { evaluateDecision } from "../../src/nodes/evaluate";
import { getLLM, config } from "../../src/config";

const mockGetLLM = vi.mocked(getLLM);

function createMockLLM(decision: { nextAction: string; actionReason: string }) {
  return {
    withStructuredOutput: vi.fn().mockReturnValue({
      invoke: vi.fn().mockResolvedValue(decision),
    }),
  };
}

describe("evaluateDecision node", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return request_credit when LLM decides to borrow", async () => {
    const mockLLM = createMockLLM({
      nextAction: "request_credit",
      actionReason: "USDC balance below minimum threshold",
    });
    mockGetLLM.mockReturnValue(mockLLM as any);

    const state = {
      ...{
        usdcBalance: 5,
        wethBalance: 2,
        wethPriceUSD: 3000,
        activeLoans: [],
        lastAction: "monitor" as const,
        actionReason: "",
        totalApiEarnings: 0,
        pendingApiRequests: 0,
        operationLog: [],
      },
    };

    const result = await evaluateDecision(state);

    expect(result.lastAction).toBe("request_credit");
    expect(result.actionReason).toBe("USDC balance below minimum threshold");
  });

  it("should return add_collateral when LLM detects high LTV", async () => {
    const mockLLM = createMockLLM({
      nextAction: "add_collateral",
      actionReason: "Loan #2 LTV at 85%, risk of liquidation",
    });
    mockGetLLM.mockReturnValue(mockLLM as any);

    const state = {
      ...{
        usdcBalance: 100,
        wethBalance: 2,
        wethPriceUSD: 3000,
        activeLoans: [
          {
            id: "1",
            ltv: 60,
            daysRemaining: 5,
            principal: 3000,
            collateral: 1,
          },
          {
            id: "2",
            ltv: 85,
            daysRemaining: 4,
            principal: 5000,
            collateral: 2,
          },
        ],
        lastAction: "monitor" as const,
        actionReason: "",
        totalApiEarnings: 0,
        pendingApiRequests: 0,
        operationLog: [],
      },
    };

    const result = await evaluateDecision(state);

    expect(result.lastAction).toBe("add_collateral");
    expect(result.actionReason).toContain("LTV");
  });

  it("should return repay_or_renew when LLM detects expiring loan", async () => {
    const mockLLM = createMockLLM({
      nextAction: "repay_or_renew",
      actionReason: "Loan expires in 1 day, needs repayment",
    });
    mockGetLLM.mockReturnValue(mockLLM as any);

    const state = {
      ...{
        usdcBalance: 6000,
        wethBalance: 2,
        wethPriceUSD: 3000,
        activeLoans: [
          {
            id: "1",
            ltv: 50,
            daysRemaining: 1,
            principal: 5000,
            collateral: 2,
          },
        ],
        lastAction: "monitor" as const,
        actionReason: "",
        totalApiEarnings: 0,
        pendingApiRequests: 0,
        operationLog: [],
      },
    };

    const result = await evaluateDecision(state);

    expect(result.lastAction).toBe("repay_or_renew");
  });

  it("should return idle when LLM determines state is healthy", async () => {
    const mockLLM = createMockLLM({
      nextAction: "idle",
      actionReason: "All loans healthy, sufficient USDC balance",
    });
    mockGetLLM.mockReturnValue(mockLLM as any);

    const state = {
      ...{
        usdcBalance: 200,
        wethBalance: 5,
        wethPriceUSD: 3500,
        activeLoans: [
          {
            id: "1",
            ltv: 45,
            daysRemaining: 10,
            principal: 3000,
            collateral: 1,
          },
        ],
        lastAction: "monitor" as const,
        actionReason: "",
        totalApiEarnings: 0,
        pendingApiRequests: 0,
        operationLog: [],
      },
    };

    const result = await evaluateDecision(state);

    expect(result.lastAction).toBe("idle");
  });

  it("should return idle with error reason when LLM call fails", async () => {
    const mockLLM = {
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: vi.fn().mockRejectedValue(new Error("API rate limit exceeded")),
      }),
    };
    mockGetLLM.mockReturnValue(mockLLM as any);

    const state = {
      ...{
        usdcBalance: 100,
        wethBalance: 2,
        wethPriceUSD: 3000,
        activeLoans: [],
        lastAction: "monitor" as const,
        actionReason: "",
        totalApiEarnings: 0,
        pendingApiRequests: 0,
        operationLog: [],
      },
    };

    const result = await evaluateDecision(state);

    expect(result.lastAction).toBe("idle");
    expect(result.actionReason).toContain("LLM Error");
    expect(result.actionReason).toContain("idle to prevent unauthorized");
  });

  it("should pass full state context to the LLM prompt", async () => {
    const mockInvoke = vi.fn().mockResolvedValue({
      nextAction: "idle",
      actionReason: "ok",
    });
    const mockLLM = {
      withStructuredOutput: vi.fn().mockReturnValue({
        invoke: mockInvoke,
      }),
    };
    mockGetLLM.mockReturnValue(mockLLM as any);

    const state = {
      ...{
        usdcBalance: 150,
        wethBalance: 3.5,
        wethPriceUSD: 2800,
        activeLoans: [
          {
            id: "42",
            ltv: 55,
            daysRemaining: 6,
            principal: 4000,
            collateral: 2,
          },
        ],
        lastAction: "monitor" as const,
        actionReason: "",
        totalApiEarnings: 0,
        pendingApiRequests: 0,
        operationLog: [],
      },
    };

    await evaluateDecision(state);

    const callArgs = mockInvoke.mock.calls[0][0];
    const systemPrompt = callArgs[0].content;

    expect(systemPrompt).toContain("150"); // USDC balance
    expect(systemPrompt).toContain("3.5"); // WETH balance
    expect(systemPrompt).toContain("2800"); // WETH price
    expect(systemPrompt).toContain("42"); // loan ID
    expect(systemPrompt).toContain(config.MIN_USDC_BALANCE.toString());
    expect(systemPrompt).toContain(config.MAX_LTV.toString());
    expect(systemPrompt).toContain(config.LOAN_WARN_DAYS.toString());
  });

  it("should handle multi-loan state with mixed conditions", async () => {
    const mockLLM = createMockLLM({
      nextAction: "add_collateral",
      actionReason: "Priority: loan #3 at 92% LTV",
    });
    mockGetLLM.mockReturnValue(mockLLM as any);

    const state = {
      ...{
        usdcBalance: 5, // also below minimum
        wethBalance: 2,
        wethPriceUSD: 3000,
        activeLoans: [
          {
            id: "1",
            ltv: 40,
            daysRemaining: 10,
            principal: 2000,
            collateral: 1,
          },
          {
            id: "2",
            ltv: 65,
            daysRemaining: 2,
            principal: 3000,
            collateral: 1,
          },
          {
            id: "3",
            ltv: 92,
            daysRemaining: 5,
            principal: 8000,
            collateral: 3,
          },
        ],
        lastAction: "monitor" as const,
        actionReason: "",
        totalApiEarnings: 0,
        pendingApiRequests: 0,
        operationLog: [],
      },
    };

    const result = await evaluateDecision(state);

    expect(result.lastAction).toBe("add_collateral");
    expect(result.actionReason).toContain("92");
  });
});
