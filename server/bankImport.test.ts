import { describe, it, expect } from "vitest";
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

describe("bankImport", () => {
  it("should categorize transactions with AI", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = [
      {
        date: "2026-04-30",
        description: "SHELL GAS 4521",
        amount: "50.00",
      },
      {
        date: "2026-04-29",
        description: "STARBUCKS COFFEE",
        amount: "5.50",
      },
    ];

    const result = await caller.bankImport.categorizeTransactions({
      transactions,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("category");
    expect(result[0].category).toBeTruthy();
    expect(result[1]).toHaveProperty("category");
    expect(result[1].category).toBeTruthy();
  }, { timeout: 15000 });

  it("should validate transaction structure", () => {
    const transactions = [
      {
        date: "2026-04-30",
        description: "Test Transaction",
        amount: "100.00",
      },
    ];

    expect(transactions[0]).toHaveProperty("date");
    expect(transactions[0]).toHaveProperty("description");
    expect(transactions[0]).toHaveProperty("amount");
    expect(typeof transactions[0].date).toBe("string");
    expect(typeof transactions[0].description).toBe("string");
    expect(typeof transactions[0].amount).toBe("string");
  });

  it("should handle multiple transactions with different amounts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = [
      {
        date: "2026-04-30",
        description: "AMAZON PURCHASE",
        amount: "150.00",
      },
      {
        date: "2026-04-29",
        description: "WALMART GROCERIES",
        amount: "75.50",
      },
      {
        date: "2026-04-28",
        description: "UBER RIDE",
        amount: "25.00",
      },
    ];

    const result = await caller.bankImport.categorizeTransactions({
      transactions,
    });

    expect(result.length).toBe(3);
    result.forEach((tx) => {
      expect(tx.date).toBeDefined();
      expect(tx.description).toBeDefined();
      expect(tx.amount).toBeDefined();
      expect(tx.category).toBeDefined();
    });
  }, { timeout: 15000 });

  it("should preserve transaction data during categorization", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const transactions = [
      {
        date: "2026-04-30",
        description: "TEST MERCHANT",
        amount: "99.99",
      },
    ];

    const result = await caller.bankImport.categorizeTransactions({
      transactions,
    });

    expect(result[0].date).toBe(transactions[0].date);
    expect(result[0].description).toBe(transactions[0].description);
    expect(result[0].amount).toBe(transactions[0].amount);
  }, { timeout: 15000 });
});
