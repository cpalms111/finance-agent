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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("Finance Agent API", { timeout: 15000 }, () => {
  describe("Expenses", () => {
    it("should list expenses", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const expenses = await caller.expenses.list({
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      });

      expect(Array.isArray(expenses)).toBe(true);
    });

    it("should create an expense", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const expense = await caller.expenses.create({
        amount: "50.00",
        category: "food",
        description: "Lunch",
        date: new Date(),
      });

      expect(expense).toBeDefined();
      expect(typeof expense).toBe("object");
    });
  });

  describe("Budgets", () => {
    it("should list budgets", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const budgets = await caller.budgets.list({ month: "2026-04" });

      expect(Array.isArray(budgets)).toBe(true);
    });

    it("should set a budget", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const budget = await caller.budgets.set({
        category: "food",
        limit: "500.00",
        month: "2026-04",
      });

      expect(budget).toBeDefined();
      expect(typeof budget).toBe("object");
    });
  });

  describe("Savings Goals", () => {
    it("should list savings goals", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const goals = await caller.savingsGoals.list();

      expect(Array.isArray(goals)).toBe(true);
    });

    it("should create a savings goal", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const goal = await caller.savingsGoals.create({
        name: "Emergency Fund",
        targetAmount: "5000.00",
        deadline: new Date("2026-12-31"),
        description: "Build a 3-month emergency fund",
      });

      expect(goal).toBeDefined();
      expect(typeof goal).toBe("object");
    });

    it("should update savings goal progress", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Test update with a valid ID
      const updated = await caller.savingsGoals.update({
        id: 1,
        currentAmount: "500.00",
      });

      expect(updated).toBeDefined();
      expect(typeof updated).toBe("object");
    });
  });

  describe("Income", () => {
    it("should list income records", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const income = await caller.income.list({
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
      });

      expect(Array.isArray(income)).toBe(true);
    });

    it("should create an income record", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const income = await caller.income.create({
        amount: "3000.00",
        source: "Freelance",
        date: new Date(),
        notes: "Web design project",
      });

      expect(income).toBeDefined();
      expect(typeof income).toBe("object");
    });
  });

  describe("Financial Advisor", () => {
    it(
      "should analyze a financial decision",
      async () => {
        const { ctx } = createAuthContext();
        const caller = appRouter.createCaller(ctx);

        const analysis = await caller.advisor.analyze({
          decision: "Should I take a $5000 loan for a vacation?",
        });

        expect(analysis).toBeDefined();
        expect(["wise", "unwise", "neutral"]).toContain(analysis.verdict);
        expect(typeof analysis.reasoning).toBe("string");
        expect(Array.isArray(analysis.risks)).toBe(true);
        expect(Array.isArray(analysis.benefits)).toBe(true);
        expect(Array.isArray(analysis.recommendations)).toBe(true);
      },
      { timeout: 15000 }
    );
  });

  describe("Auth", () => {
    it("should get current user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const user = await caller.auth.me();

      expect(user).toBeDefined();
      expect(user?.openId).toBe("test-user");
      expect(user?.email).toBe("test@example.com");
    });
  });
});
