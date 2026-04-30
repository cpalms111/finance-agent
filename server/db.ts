import { eq, and, gte, lte, desc, or, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, expenses, budgets, savingsGoals, incomeRecords, monthlySummaries, merchantRules, accounts, Account, InsertAccount } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Expense queries
export async function getUserExpenses(userId: number, startDate?: Date, endDate?: Date, category?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(expenses.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(expenses.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(expenses.date, endDate));
  }
  if (category) {
    conditions.push(eq(expenses.category, category));
  }

  return db.select().from(expenses).where(and(...conditions)).orderBy(desc(expenses.date));
}

export async function createExpense(userId: number, amount: string, category: string, description: string | null, date: Date, accountId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(expenses).values({
    userId,
    accountId,
    amount,
    category,
    description,
    date,
  });

  return result;
}

export async function updateExpense(id: number, userId: number, amount?: string, category?: string, description?: string | null, date?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: Record<string, unknown> = {};
  if (amount !== undefined) updates.amount = amount;
  if (category !== undefined) updates.category = category;
  if (description !== undefined) updates.description = description;
  if (date !== undefined) updates.date = date;

  return db.update(expenses).set(updates).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

export async function deleteExpense(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.userId, userId)));
}

// Budget queries
export async function getUserBudgets(userId: number, month?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(budgets.userId, userId)];
  if (month) {
    conditions.push(eq(budgets.month, month));
  }
  return db.select().from(budgets).where(and(...conditions));
}

export async function setBudget(userId: number, category: string, limit: string, month: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(budgets).where(
    and(eq(budgets.userId, userId), eq(budgets.category, category), eq(budgets.month, month))
  ).limit(1);

  if (existing.length > 0) {
    return db.update(budgets).set({ limit }).where(
      and(eq(budgets.userId, userId), eq(budgets.category, category), eq(budgets.month, month))
    );
  }

  return db.insert(budgets).values({ userId, category, limit, month });
}

export async function deleteBudget(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(budgets).where(and(eq(budgets.id, id), eq(budgets.userId, userId)));
}

// Savings goals queries
export async function getUserSavingsGoals(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(savingsGoals).where(eq(savingsGoals.userId, userId)).orderBy(desc(savingsGoals.createdAt));
}

export async function createSavingsGoal(userId: number, name: string, targetAmount: string, deadline?: Date, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(savingsGoals).values({ userId, name, targetAmount, deadline, description });
}

export async function updateSavingsGoal(id: number, userId: number, currentAmount: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.update(savingsGoals).set({ currentAmount }).where(
    and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId))
  );
}

export async function deleteSavingsGoal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, userId)));
}

// Income records queries
export async function getUserIncomeRecords(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(incomeRecords.userId, userId)];
  
  if (startDate) {
    conditions.push(gte(incomeRecords.date, startDate));
  }
  if (endDate) {
    conditions.push(lte(incomeRecords.date, endDate));
  }

  return db.select().from(incomeRecords).where(and(...conditions)).orderBy(desc(incomeRecords.date));
}

export async function createIncomeRecord(userId: number, amount: string, source?: string, date?: Date, description?: string, accountId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(incomeRecords).values({ userId, accountId, amount, source: source || "Other", date: date || new Date(), description });
}

export async function deleteIncomeRecord(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(incomeRecords).where(and(eq(incomeRecords.id, id), eq(incomeRecords.userId, userId)));
}

// Monthly summaries queries
export async function getMonthlySummary(userId: number, month: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(monthlySummaries).where(
    and(eq(monthlySummaries.userId, userId), eq(monthlySummaries.month, month))
  ).limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function createMonthlySummary(userId: number, month: string, summary: string, totalIncome?: string, totalExpenses?: string, savingsAmount?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(monthlySummaries).values({ userId, month, summary, totalIncome, totalExpenses, savingsAmount });
}


// Merchant rules queries
export async function getUserMerchantRules(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(merchantRules).where(eq(merchantRules.userId, userId));
}

export async function saveMerchantRule(userId: number, merchantKeyword: string, category: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if rule already exists
  const existing = await db.select().from(merchantRules).where(
    and(eq(merchantRules.userId, userId), eq(merchantRules.merchantKeyword, merchantKeyword))
  ).limit(1);

  if (existing.length > 0) {
    // Update existing rule
    return db.update(merchantRules).set({ category }).where(
      and(eq(merchantRules.userId, userId), eq(merchantRules.merchantKeyword, merchantKeyword))
    );
  }

  // Create new rule
  return db.insert(merchantRules).values({ userId, merchantKeyword, category });
}

export async function deleteMerchantRule(userId: number, ruleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(merchantRules).where(
    and(eq(merchantRules.id, ruleId), eq(merchantRules.userId, userId))
  );
}

export async function getUserMonthlySummaries(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(monthlySummaries).where(eq(monthlySummaries.userId, userId)).orderBy(desc(monthlySummaries.month));
}


// Account queries
export async function getUserAccounts(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(accounts).where(eq(accounts.userId, userId)).orderBy(asc(accounts.createdAt));
}

export async function createAccount(userId: number, name: string, type: "Checking" | "Savings" | "Business" | "Credit Card", institution: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.insert(accounts).values({ userId, name, type, institution, color });
}

export async function updateAccount(id: number, userId: number, name?: string, type?: string, institution?: string, color?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateSet: Record<string, any> = {};
  if (name !== undefined) updateSet.name = name;
  if (type !== undefined) updateSet.type = type;
  if (institution !== undefined) updateSet.institution = institution;
  if (color !== undefined) updateSet.color = color;

  if (Object.keys(updateSet).length === 0) return;

  return db.update(accounts).set(updateSet).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
}

export async function deleteAccount(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(accounts).where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
}
