import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { z } from "zod";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  expenses: router({
    list: protectedProcedure
      .input(z.object({ startDate: z.date().optional(), endDate: z.date().optional(), category: z.string().optional(), accountId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const expenseList = await db.getUserExpenses(ctx.user.id, input.startDate, input.endDate, input.category, input.accountId);
        return expenseList;
      }),
    create: protectedProcedure
      .input(z.object({ amount: z.string(), category: z.string(), description: z.string().nullable(), date: z.date(), accountId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.createExpense(ctx.user.id, input.amount, input.category, input.description, input.date, input.accountId);
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), amount: z.string().optional(), category: z.string().optional(), description: z.string().nullable().optional(), date: z.date().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.updateExpense(input.id, ctx.user.id, input.amount, input.category, input.description, input.date);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteExpense(input.id, ctx.user.id);
      }),
  }),

  budgets: router({
    list: protectedProcedure
      .input(z.object({ month: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getUserBudgets(ctx.user.id, input.month);
      }),
    set: protectedProcedure
      .input(z.object({ category: z.string(), limit: z.string(), month: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.setBudget(ctx.user.id, input.category, input.limit, input.month);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteBudget(input.id, ctx.user.id);
      }),
  }),

  savingsGoals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSavingsGoals(ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string(), targetAmount: z.string(), deadline: z.date().optional(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.createSavingsGoal(ctx.user.id, input.name, input.targetAmount, input.deadline, input.description);
      }),
    update: protectedProcedure
      .input(z.object({ id: z.number(), currentAmount: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.updateSavingsGoal(input.id, ctx.user.id, input.currentAmount);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteSavingsGoal(input.id, ctx.user.id);
      }),
  }),

  income: router({
    list: protectedProcedure
      .input(z.object({ startDate: z.date().optional(), endDate: z.date().optional(), accountId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getUserIncomeRecords(ctx.user.id, input.startDate, input.endDate, input.accountId);
      }),
    create: protectedProcedure
      .input(z.object({ amount: z.string(), source: z.string().optional(), date: z.date().optional(), description: z.string().optional(), accountId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.createIncomeRecord(ctx.user.id, input.amount, input.source, input.date, input.description, input.accountId);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteIncomeRecord(input.id, ctx.user.id);
      }),
  }),

  summaries: router({
    get: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getMonthlySummary(ctx.user.id, input.month);
      }),

    generate: protectedProcedure
      .input(z.object({ month: z.string() })) // format: 'YYYY-MM'
      .mutation(async ({ ctx, input }) => {
        const [year, month] = input.month.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const expenses = await db.getUserExpenses(ctx.user.id, startDate, endDate);
        const income = await db.getUserIncomeRecords(ctx.user.id, startDate, endDate);
        const budgets = await db.getUserBudgets(ctx.user.id, input.month);
        const goals = await db.getUserSavingsGoals(ctx.user.id);

        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);
        const savingsAmount = (totalIncome - totalExpenses).toString();

        const prompt = `Generate a monthly financial summary for ${input.month}.
        
Financial Data:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Savings: $${(totalIncome - totalExpenses).toFixed(2)}
- Number of Transactions: ${expenses.length}
- Active Budgets: ${budgets.length}
- Savings Goals: ${goals.length}

Provide a concise, professional summary of the user's financial performance this month, highlighting key trends and areas for improvement.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a financial analyst. Provide a professional monthly summary.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const summaryText = response.choices[0]?.message.content;
        if (!summaryText || typeof summaryText !== 'string') {
          throw new Error("Failed to generate summary from LLM");
        }

        await db.createMonthlySummary(
          ctx.user.id,
          input.month,
          summaryText,
          totalIncome.toString(),
          totalExpenses.toString(),
          savingsAmount
        );

        return db.getMonthlySummary(ctx.user.id, input.month);
      }),
  }),

  bankImport: router({
    getMerchantRules: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserMerchantRules(ctx.user.id);
    }),

    categorizeTransactions: protectedProcedure
      .input(z.object({
        transactions: z.array(z.object({
          date: z.string(),
          description: z.string(),
          amount: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        let rules: any[] = [];
        try {
          rules = await db.getUserMerchantRules(ctx.user.id);
        } catch (e) {
          // Table might not exist yet, continue without rules
          rules = [];
        }

        // Apply merchant rules first
        const categorizedByRules = input.transactions.map((tx: any) => {
          const matchedRule = rules.find((rule: any) =>
            tx.description.toUpperCase().includes(rule.merchantKeyword.toUpperCase())
          );
          return {
            ...tx,
            category: matchedRule?.category || null,
          };
        });

        // Get transactions that need AI categorization
        const needsAI = categorizedByRules.filter((tx: any) => !tx.category);

        if (needsAI.length === 0) {
          return categorizedByRules.map((tx: any) => ({
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            category: tx.category || "other",
          }));
        }

        // Use AI to categorize remaining transactions
        const prompt = `Categorize these bank transactions into one of these categories: Vehicle & Fuel, Business Supplies & Equipment, Marketing & Advertising, Subcontractors & Labor, Food & Personal, Subscriptions, Home & Family, Tax & Savings, Other.

Transactions:
${needsAI.map((tx: any) => `- ${tx.description} ($${tx.amount})`).join('\n')}

Respond with a JSON array where each object has: description (original), category (one of the above).`;

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a financial categorization expert. Always respond with valid JSON array.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const content = response.choices[0]?.message.content;
          if (!content || typeof content !== 'string') {
            console.error("LLM response missing content");
            return categorizedByRules.map((tx: any) => ({
              date: tx.date,
              description: tx.description,
              amount: tx.amount,
              category: tx.category || "other",
            }));
          }

          const cleanContent = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

          const aiCategories = JSON.parse(cleanContent);
          if (!Array.isArray(aiCategories)) {
            throw new Error("LLM response is not an array");
          }
          const categoryMap = new Map(aiCategories.map((item: any) => [item.description, item.category]));
          return categorizedByRules.map((tx: any) => ({
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            category: tx.category || categoryMap.get(tx.description) || "other",
          }));
        } catch (e) {
          console.error("Error during AI categorization:", e);
          // Fallback: return transactions with default categories
          return categorizedByRules.map((tx: any) => ({
            date: tx.date,
            description: tx.description,
            amount: tx.amount,
            category: tx.category || "other",
          }));
        }
      }),

    saveMerchantRule: protectedProcedure
      .input(z.object({ merchantKeyword: z.string(), category: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return db.saveMerchantRule(ctx.user.id, input.merchantKeyword, input.category);
      }),

    extractFromPDF: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const prompt = `Extract all transactions from this Wells Fargo PDF. For each, provide date (MM/DD/YYYY), description, amount (positive=income, negative=expense). Respond with JSON array: [{date, description, amount}]. Only "Posted" transactions.`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are a financial document parser. Extract transaction data accurately. Always respond with valid JSON array.",
              },
              {
                role: "user",
                content: prompt,
              },
              {
                role: "user",
                content: [
                  {
                    type: "file_url",
                    file_url: {
                      url: `data:application/pdf;base64,${input.fileData}`,
                      mime_type: "application/pdf",
                    },
                  },
                ],
              },
            ],
          });

          const content = response.choices[0]?.message.content;
          if (!content || typeof content !== 'string') {
            throw new Error("Failed to extract transactions from PDF");
          }

          const cleanContent = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

          const transactions = JSON.parse(cleanContent);
          if (!Array.isArray(transactions)) {
            throw new Error("PDF extraction did not return an array");
          }

          return transactions.map((tx: any) => {
            const amount = parseFloat(tx.amount);
            const isIncome = amount > 0;
            return {
              date: tx.date,
              description: tx.description,
              amount: Math.abs(amount).toString(),
              type: isIncome ? 'income' : 'expense',
              isIncome: isIncome,
            };
          });
        } catch (error: any) {
          console.error("PDF extraction error:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to extract from PDF: ${error?.message}` });
        }
      }),

    importTransactions: protectedProcedure
      .input(z.array(z.object({
        date: z.string(),
        description: z.string(),
        amount: z.string(),
        category: z.string(),
        accountId: z.number().optional(),
      })))
      .mutation(async ({ ctx, input }) => {
        const results = [];
        for (const tx of input) {
          const result = await db.createExpense(
            ctx.user.id,
            tx.amount,
            tx.category,
            tx.description,
            new Date(tx.date),
            tx.accountId
          );
          results.push(result);
        }
        return { imported: results.length, total: input.length };
      }),
  }),

  advisor: router({
    analyze: protectedProcedure
      .input(z.object({ decision: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const expenses = await db.getUserExpenses(ctx.user.id);
        const income = await db.getUserIncomeRecords(ctx.user.id);
        const goals = await db.getUserSavingsGoals(ctx.user.id);

        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);
        const totalSavings = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);

        const prompt = `You are a financial advisor. Analyze this financial decision based on the user's financial situation.

User's Financial Context:
- Total Monthly Income: $${totalIncome.toFixed(2)}
- Total Monthly Expenses: $${totalExpenses.toFixed(2)}
- Current Savings: $${totalSavings.toFixed(2)}
- Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%

Financial Decision to Analyze:
${input.decision}

Provide your analysis in JSON format with: verdict (wise/unwise/neutral), reasoning, risks array, benefits array, recommendations array.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a financial advisor providing personalized financial guidance. Always respond with valid JSON.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const content = response.choices[0]?.message.content;
        if (!content || typeof content !== 'string') {
          throw new Error("Failed to get analysis from LLM");
        }

        try {
          const cleanContent = content
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/i, '')
            .replace(/```\s*$/i, '')
            .trim();

          const analysis = JSON.parse(cleanContent);
          return {
            verdict: analysis.verdict || "neutral",
            reasoning: analysis.reasoning || "Unable to provide analysis",
            risks: Array.isArray(analysis.risks) ? analysis.risks : [],
            benefits: Array.isArray(analysis.benefits) ? analysis.benefits : [],
            recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
          };
        } catch (e) {
          return {
            verdict: "neutral" as const,
            reasoning: typeof content === 'string' ? content : "Unable to provide analysis",
            risks: [],
            benefits: [],
            recommendations: [],
          };
        }
      }),
  }),

  monthlySummaries: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserMonthlySummaries(ctx.user.id);
      }),
    get: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getMonthlySummary(ctx.user.id, input.month);
      }),
    generate: protectedProcedure
      .input(z.object({ month: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Check if summary already exists for this month
        const existing = await db.getMonthlySummary(ctx.user.id, input.month);
        if (existing) {
          return existing;
        }

        // Get all financial data for the month
        const [startDate, endDate] = input.month.split('-');
        const monthStart = new Date(`${input.month}-01`);
        const monthEnd = new Date(new Date(monthStart).setMonth(monthStart.getMonth() + 1));

        const expenses = await db.getUserExpenses(ctx.user.id, monthStart, monthEnd);
        const income = await db.getUserIncomeRecords(ctx.user.id, monthStart, monthEnd);
        const budgets = await db.getUserBudgets(ctx.user.id, input.month);

        const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);
        const savingsAmount = totalIncome - totalExpenses;

        // Build expense breakdown
        const expensesByCategory: Record<string, number> = {};
        expenses.forEach(e => {
          expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + parseFloat(e.amount);
        });

        // Generate AI summary
        const prompt = `Generate a personalized financial summary for the month of ${input.month}.

Financial Data:
- Total Income: $${totalIncome.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Net Savings: $${savingsAmount.toFixed(2)}
- Savings Rate: ${totalIncome > 0 ? ((savingsAmount / totalIncome) * 100).toFixed(1) : 0}%

Expense Breakdown:
${Object.entries(expensesByCategory).map(([cat, amt]) => `- ${cat}: $${amt.toFixed(2)}`).join('\n')}

Budgets Set:
${budgets.map((b: any) => `- ${b.category}: $${b.limit} (spent: $${expensesByCategory[b.category] || 0})`).join('\n')}

Provide a concise, actionable summary with:
1. Key spending patterns
2. Budget performance highlights
3. Savings insights
4. Specific recommendations for next month

Keep it professional but conversational, 150-200 words.`;

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a personal finance analyst. Provide insightful, actionable financial summaries.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        });

        const summaryContent = response.choices[0]?.message.content || "Unable to generate summary";
        const summaryText = typeof summaryContent === 'string' ? summaryContent : JSON.stringify(summaryContent);

        // Save summary to database
        await db.createMonthlySummary(
          ctx.user.id,
          input.month,
          summaryText,
          totalIncome.toString(),
          totalExpenses.toString(),
          savingsAmount.toString()
        );

        return {
          month: input.month,
          summary: summaryText,
          totalIncome: totalIncome.toString(),
          totalExpenses: totalExpenses.toString(),
          savingsAmount: savingsAmount.toString(),
        };
       }),
  }),

  accounts: router({
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getUserAccounts(ctx.user.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["Checking", "Savings", "Business", "Credit Card"]),
        institution: z.string().min(1),
        color: z.string().regex(/^#[0-9A-F]{6}$/i),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createAccount(ctx.user.id, input.name, input.type, input.institution, input.color);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["Checking", "Savings", "Business", "Credit Card"]).optional(),
        institution: z.string().optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateAccount(input.id, ctx.user.id, input.name, input.type, input.institution, input.color);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.deleteAccount(input.id, ctx.user.id);
      }),
  }),
});
export type AppRouter = typeof appRouter;
