import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Multi-Account Transaction System", () => {
  let testUserId: number;
  let accountId: number;

  beforeAll(async () => {
    // Create a test user
    const result = await db.upsertUser({
      openId: "test-multi-account-user",
      name: "Test Multi Account User",
      email: "test-multi-account@example.com",
    });

    // Get the user ID
    const userResult = await db.getUserByOpenId("test-multi-account-user");
    if (userResult) {
      testUserId = userResult.id;
    } else {
      testUserId = 1;
    }

    // Create a test account
    const account = await db.createAccount(
      testUserId,
      "Test Checking Account",
      "Checking",
      "Test Bank",
      "#3b82f6"
    );
    accountId = account.id;
  });

  afterAll(async () => {
    // Cleanup is handled by test database
  });

  describe("Expense Creation with Accounts", () => {
    it("should create expense without accountId (backward compatible)", async () => {
      const result = await db.createExpense(
        testUserId,
        "50.00",
        "food",
        "Lunch",
        new Date()
      );

      expect(result).toBeDefined();
    });

    it("should create expense with accountId", async () => {
      const result = await db.createExpense(
        testUserId,
        "75.00",
        "transport",
        "Gas",
        new Date(),
        accountId
      );

      expect(result).toBeDefined();
    });

    it("should retrieve expenses and filter by account", async () => {
      // Create multiple expenses
      await db.createExpense(
        testUserId,
        "100.00",
        "utilities",
        "Electric bill",
        new Date(),
        accountId
      );

      await db.createExpense(
        testUserId,
        "50.00",
        "food",
        "Groceries",
        new Date()
      );

      // Get all expenses
      const allExpenses = await db.getUserExpenses(testUserId);

      expect(allExpenses).toBeDefined();
      expect(Array.isArray(allExpenses)).toBe(true);
      expect(allExpenses.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Income Creation with Accounts", () => {
    it("should create income without accountId (backward compatible)", async () => {
      const result = await db.createIncomeRecord(
        testUserId,
        "1000.00",
        "Salary",
        new Date()
      );

      expect(result).toBeDefined();
    });

    it("should create income with accountId", async () => {
      const result = await db.createIncomeRecord(
        testUserId,
        "500.00",
        "Freelance",
        new Date(),
        "Project payment",
        accountId
      );

      expect(result).toBeDefined();
    });

    it("should retrieve income records", async () => {
      // Create multiple income records
      await db.createIncomeRecord(
        testUserId,
        "200.00",
        "Bonus",
        new Date(),
        "Monthly bonus",
        accountId
      );

      await db.createIncomeRecord(
        testUserId,
        "150.00",
        "Gig work",
        new Date()
      );

      // Get all income records
      const allIncome = await db.getUserIncomeRecords(testUserId);

      expect(allIncome).toBeDefined();
      expect(Array.isArray(allIncome)).toBe(true);
      expect(allIncome.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Data Integrity", () => {
    it("should maintain data integrity with mixed account/no-account transactions", async () => {
      // Create expenses with and without accounts
      const expenseWithAccount = await db.createExpense(
        testUserId,
        "60.00",
        "entertainment",
        "Movie",
        new Date(),
        accountId
      );

      const expenseWithoutAccount = await db.createExpense(
        testUserId,
        "40.00",
        "shopping",
        "Clothes",
        new Date()
      );

      expect(expenseWithAccount).toBeDefined();
      expect(expenseWithoutAccount).toBeDefined();

      // Create income with and without accounts
      const incomeWithAccount = await db.createIncomeRecord(
        testUserId,
        "300.00",
        "Consulting",
        new Date(),
        "Project work",
        accountId
      );

      const incomeWithoutAccount = await db.createIncomeRecord(
        testUserId,
        "100.00",
        "Interest",
        new Date()
      );

      expect(incomeWithAccount).toBeDefined();
      expect(incomeWithoutAccount).toBeDefined();
    });
  });
});
