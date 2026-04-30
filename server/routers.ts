import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
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
      .input(z.object({ startDate: z.date().optional(), endDate: z.date().optional(), category: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const expenseList = await db.getUserExpenses(ctx.user.id, input.startDate, input.endDate, input.category);
        return expenseList;
      }),
    create: protectedProcedure
      .input(z.object({ amount: z.string(), category: z.string(), description: z.string().nullable(), date: z.date() }))
      .mutation(async ({ ctx, input }) => {
        return db.createExpense(ctx.user.id, input.amount, input.category, input.description, input.date);
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
  }),

  income: router({
    list: protectedProcedure
      .input(z.object({ startDate: z.date().optional(), endDate: z.date().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getUserIncomeRecords(ctx.user.id, input.startDate, input.endDate);
      }),
    create: protectedProcedure
      .input(z.object({ amount: z.string(), source: z.string().optional(), date: z.date(), notes: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        return db.createIncomeRecord(ctx.user.id, input.amount, input.source, input.date, input.notes);
      }),
  }),

  summaries: router({
    get: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getMonthlySummary(ctx.user.id, input.month);
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
          const analysis = JSON.parse(content);
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
});

export type AppRouter = typeof appRouter;
