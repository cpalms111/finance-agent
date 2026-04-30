import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Expense tracking table.
 * Stores individual expense entries with category, amount, date, and description.
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(), // e.g., "food", "transport", "utilities"
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Budget tracking table.
 * Stores monthly budget limits per category for each user.
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  limit: decimal("limit", { precision: 10, scale: 2 }).notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: "YYYY-MM"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Savings goals table.
 * Stores user-defined savings goals with target amounts and deadlines.
 */
export const savingsGoals = mysqlTable("savingsGoals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  deadline: timestamp("deadline"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

/**
 * Income records table.
 * Tracks variable income entries for gig workers and self-employed users.
 */
export const incomeRecords = mysqlTable("incomeRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  source: varchar("source", { length: 255 }), // e.g., "freelance", "gig work", "side project"
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IncomeRecord = typeof incomeRecords.$inferSelect;
export type InsertIncomeRecord = typeof incomeRecords.$inferInsert;

/**
 * Monthly summaries table.
 * Stores AI-generated monthly financial summaries.
 */
export const monthlySummaries = mysqlTable("monthlySummaries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 7 }).notNull(), // Format: "YYYY-MM"
  summary: text("summary").notNull(), // AI-generated summary content
  totalIncome: decimal("totalIncome", { precision: 12, scale: 2 }).default("0"),
  totalExpenses: decimal("totalExpenses", { precision: 12, scale: 2 }).default("0"),
  savingsAmount: decimal("savingsAmount", { precision: 12, scale: 2 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MonthlySummary = typeof monthlySummaries.$inferSelect;
export type InsertMonthlySummary = typeof monthlySummaries.$inferInsert;