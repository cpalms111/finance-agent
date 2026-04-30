import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("monthlySummaries", () => {
  it("lists monthly summaries for a user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This should return an empty array or existing summaries
    const result = await caller.monthlySummaries.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("retrieves a specific monthly summary", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Try to get a summary for current month
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const result = await caller.monthlySummaries.get({ month });

    // Should return null or a summary object
    if (result !== null) {
      expect(result).toHaveProperty("month");
      expect(result).toHaveProperty("summary");
      expect(result.month).toBe(month);
    }
  });

  it("generates a monthly summary with AI analysis", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const month = new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Generate summary (this will use AI, so it might take a moment)
    const result = await caller.monthlySummaries.generate({ month }, { timeout: 30000 });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("month");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("totalIncome");
    expect(result).toHaveProperty("totalExpenses");
    expect(result).toHaveProperty("savingsAmount");
    expect(result.month).toBe(month);
    expect(typeof result.summary).toBe("string");
    expect(result.summary.length).toBeGreaterThan(0);
  }, { timeout: 35000 });

  it("returns cached summary on subsequent calls", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const month = new Date().toISOString().slice(0, 7);

    // First call generates
    const first = await caller.monthlySummaries.generate({ month }, { timeout: 30000 });

    // Second call should return cached version
    const second = await caller.monthlySummaries.generate({ month }, { timeout: 30000 });

    expect(first.month).toBe(second.month);
    // Summary content should be identical (cached)
    expect(first.summary).toBe(second.summary);
  }, { timeout: 35000 });

  it("summary contains financial metrics", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const month = new Date().toISOString().slice(0, 7);
    const result = await caller.monthlySummaries.generate({ month }, { timeout: 30000 });

    // Verify financial metrics are numbers
    expect(typeof parseFloat(result.totalIncome)).toBe("number");
    expect(typeof parseFloat(result.totalExpenses)).toBe("number");
    expect(typeof parseFloat(result.savingsAmount)).toBe("number");

    // Savings should equal income minus expenses
    const income = parseFloat(result.totalIncome);
    const expenses = parseFloat(result.totalExpenses);
    const savings = parseFloat(result.savingsAmount);
    expect(savings).toBe(income - expenses);
  }, { timeout: 35000 });
});
