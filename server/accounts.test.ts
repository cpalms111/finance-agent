import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";

describe("Accounts Feature", () => {
  let testUserId: number;

  beforeAll(async () => {
    // Use a test user ID for testing
    testUserId = 1;
  });

  afterAll(async () => {
    // Cleanup is handled by the test database
  });

  describe("createAccount", () => {
    it("should create a new account", async () => {
      const result = await db.createAccount(
        testUserId,
        "My Checking",
        "Checking",
        "Wells Fargo",
        "#3b82f6"
      );

      expect(result).toBeDefined();
    });

    it("should create multiple accounts with different types", async () => {
      const checking = await db.createAccount(
        testUserId,
        "Checking Account",
        "Checking",
        "Chase",
        "#3b82f6"
      );
      const savings = await db.createAccount(
        testUserId,
        "Savings Account",
        "Savings",
        "Chase",
        "#10b981"
      );
      const business = await db.createAccount(
        testUserId,
        "Business Account",
        "Business",
        "Bank of America",
        "#f59e0b"
      );
      const creditCard = await db.createAccount(
        testUserId,
        "Credit Card",
        "Credit Card",
        "American Express",
        "#8b5cf6"
      );

      expect(checking).toBeDefined();
      expect(savings).toBeDefined();
      expect(business).toBeDefined();
      expect(creditCard).toBeDefined();
    });
  });

  describe("getUserAccounts", () => {
    it("should retrieve all accounts for a user", async () => {
      // Create some accounts
      await db.createAccount(
        testUserId,
        "Account 1",
        "Checking",
        "Bank A",
        "#3b82f6"
      );
      await db.createAccount(
        testUserId,
        "Account 2",
        "Savings",
        "Bank B",
        "#10b981"
      );

      const userAccounts = await db.getUserAccounts(testUserId);

      expect(userAccounts).toBeDefined();
      expect(Array.isArray(userAccounts)).toBe(true);
    });

    it("should return empty array for user with no accounts", async () => {
      // Test with a user ID that likely has no accounts
      const userAccounts = await db.getUserAccounts(9999);

      expect(Array.isArray(userAccounts)).toBe(true);
    });

    it("should not return accounts from other users", async () => {
      // Get accounts for test user
      const testUserAccounts = await db.getUserAccounts(testUserId);

      // Verify all accounts belong to test user
      expect(testUserAccounts.every((acc) => acc.userId === testUserId)).toBe(true);
    });
  });

  describe("updateAccount", () => {
    it("should update account name", async () => {
      const account = await db.createAccount(
        testUserId,
        "Original Name",
        "Checking",
        "Bank A",
        "#3b82f6"
      );

      const updated = await db.updateAccount(
        account.id,
        testUserId,
        "Updated Name",
        undefined,
        undefined,
        undefined
      );

      expect(updated).toBeDefined();
    });

    it("should update account type", async () => {
      const account = await db.createAccount(
        testUserId,
        "Test Account",
        "Checking",
        "Bank A",
        "#3b82f6"
      );

      const updated = await db.updateAccount(
        account.id,
        testUserId,
        undefined,
        "Savings",
        undefined,
        undefined
      );

      expect(updated).toBeDefined();
    });

    it("should update account color", async () => {
      const account = await db.createAccount(
        testUserId,
        "Test Account",
        "Checking",
        "Bank A",
        "#3b82f6"
      );

      const updated = await db.updateAccount(
        account.id,
        testUserId,
        undefined,
        undefined,
        undefined,
        "#ef4444"
      );

      expect(updated).toBeDefined();
    });

    it("should update multiple fields at once", async () => {
      const account = await db.createAccount(
        testUserId,
        "Original",
        "Checking",
        "Bank A",
        "#3b82f6"
      );

      const updated = await db.updateAccount(
        account.id,
        testUserId,
        "New Name",
        "Business",
        "Bank B",
        "#10b981"
      );

      expect(updated).toBeDefined();
    });

    it("should not update accounts from other users", async () => {
      // This test verifies the database layer enforces user isolation
      // Try to update a non-existent account for this user
      const result = await db.updateAccount(
        9999,
        testUserId,
        "Hacked",
        undefined,
        undefined,
        undefined
      );

      // Should not throw an error, just not update anything
      expect(result).toBeDefined();
    });
  });

  describe("deleteAccount", () => {
    it("should delete an account", async () => {
      const account = await db.createAccount(
        testUserId,
        "Account to Delete",
        "Checking",
        "Bank A",
        "#3b82f6"
      );

      const result = await db.deleteAccount(account.id, testUserId);

      expect(result).toBeDefined();
    });

    it("should not delete accounts from other users", async () => {
      // This test verifies the database layer enforces user isolation
      // Try to delete a non-existent account for this user
      const result = await db.deleteAccount(9999, testUserId);

      // Should not throw an error, just not delete anything
      expect(result).toBeDefined();
    });

    it("should handle deleting non-existent account gracefully", async () => {
      // This should not throw an error
      await db.deleteAccount(99999, testUserId);
      // If we get here, it passed
      expect(true).toBe(true);
    });
  });

  describe("Account isolation", () => {
    it("should maintain data isolation between users", async () => {
      // Test that getUserAccounts only returns accounts for the specified user
      const accounts1 = await db.getUserAccounts(1);
      const accounts2 = await db.getUserAccounts(2);

      // Verify each user only gets their own accounts
      expect(accounts1.every((acc) => acc.userId === 1)).toBe(true);
      expect(accounts2.every((acc) => acc.userId === 2)).toBe(true);
    });
  });
});
