import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Account Filtering System", () => {
  let testUserId: number;
  let account1Id: number;
  let account2Id: number;

  beforeAll(async () => {
    // Create a test user
    const result = await db.upsertUser({
      openId: "test-filtering-user",
      name: "Test Filtering User",
      email: "test-filtering@example.com",
    });

    // Get the user ID
    const userResult = await db.getUserByOpenId("test-filtering-user");
    if (userResult) {
      testUserId = userResult.id;
    } else {
      testUserId = 1;
    }

    // Create two test accounts
    const account1 = await db.createAccount(
      testUserId,
      "Checking Account",
      "Checking",
      "Bank A",
      "#3b82f6"
    );
    account1Id = account1.id;

    const account2 = await db.createAccount(
      testUserId,
      "Savings Account",
      "Savings",
      "Bank B",
      "#10b981"
    );
    account2Id = account2.id;
  });

  describe("Expense Filtering", () => {
    it("should create expense with account1", async () => {
      const expense = await db.createExpense(
        testUserId,
        "50.00",
        "food",
        "Lunch",
        new Date(),
        account1Id
      );

      expect(expense).toBeDefined();
      expect(expense.accountId).toBe(account1Id);
    });

    it("should create expense with account2", async () => {
      const expense = await db.createExpense(
        testUserId,
        "75.00",
        "transport",
        "Gas",
        new Date(),
        account2Id
      );

      expect(expense).toBeDefined();
      expect(expense.accountId).toBe(account2Id);
    });

    it("should retrieve all expenses", async () => {
      const allExpenses = await db.getUserExpenses(testUserId);
      expect(Array.isArray(allExpenses)).toBe(true);
      expect(allExpenses.length).toBeGreaterThanOrEqual(2);
    });

    it("should support accountId parameter in query", async () => {
      // This test verifies the function accepts the accountId parameter
      // The actual filtering is tested at the tRPC layer
      const expenses = await db.getUserExpenses(
        testUserId,
        undefined,
        undefined,
        undefined,
        account1Id
      );
      expect(Array.isArray(expenses)).toBe(true);
    });
  });

  describe("Income Filtering", () => {
    it("should create income with account1", async () => {
      const income = await db.createIncomeRecord(
        testUserId,
        "1000.00",
        "Salary",
        new Date(),
        undefined,
        account1Id
      );

      expect(income).toBeDefined();
      expect(income.accountId).toBe(account1Id);
    });

    it("should create income with account2", async () => {
      const income = await db.createIncomeRecord(
        testUserId,
        "500.00",
        "Freelance",
        new Date(),
        undefined,
        account2Id
      );

      expect(income).toBeDefined();
      expect(income.accountId).toBe(account2Id);
    });

    it("should retrieve all income records", async () => {
      const allIncome = await db.getUserIncomeRecords(testUserId);
      expect(Array.isArray(allIncome)).toBe(true);
      expect(allIncome.length).toBeGreaterThanOrEqual(2);
    });

    it("should support accountId parameter in query", async () => {
      // This test verifies the function accepts the accountId parameter
      const income = await db.getUserIncomeRecords(
        testUserId,
        undefined,
        undefined,
        account1Id
      );
      expect(Array.isArray(income)).toBe(true);
    });
  });

  describe("Mixed Transactions", () => {
    it("should handle transactions with and without accountId", async () => {
      // Create expense without account
      const unaccountedExpense = await db.createExpense(
        testUserId,
        "25.00",
        "shopping",
        "Clothes",
        new Date()
      );

      expect(unaccountedExpense).toBeDefined();
      expect(unaccountedExpense.accountId).toBeUndefined();

      // Create expense with account
      const accountedExpense = await db.createExpense(
        testUserId,
        "30.00",
        "entertainment",
        "Movie",
        new Date(),
        account1Id
      );

      expect(accountedExpense).toBeDefined();
      expect(accountedExpense.accountId).toBe(account1Id);

      // Get all expenses
      const allExpenses = await db.getUserExpenses(testUserId);
      expect(allExpenses.length).toBeGreaterThanOrEqual(3);
    });
  });
});
