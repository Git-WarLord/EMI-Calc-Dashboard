import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { calculateMonthlyEMITotals, getTotalOutstandingEMI } from "@shared/emiCalculator";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============ LOANS ROUTES ============
  loans: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserLoans(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const loan = await db.getLoanById(input.id, ctx.user.id);
        if (!loan) throw new TRPCError({ code: "NOT_FOUND" });
        return loan;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          monthlyEMI: z.string().or(z.number()),
          remainingEMIs: z.number().min(1),
          totalRemaining: z.string().or(z.number()),
          dueDate: z.string(),
          closesIn: z.string(),
          extraLoan: z.string().or(z.number()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const monthlyEMI = typeof input.monthlyEMI === "string" 
          ? parseFloat(input.monthlyEMI) 
          : input.monthlyEMI;
        const totalRemaining = typeof input.totalRemaining === "string" 
          ? parseFloat(input.totalRemaining) 
          : input.totalRemaining;
        const extraLoan = input.extraLoan !== undefined
          ? (typeof input.extraLoan === "string" ? parseFloat(input.extraLoan) : input.extraLoan)
          : 0;

        return await db.createLoan({
          userId: ctx.user.id,
          name: input.name,
          monthlyEMI: monthlyEMI.toString(),
          remainingEMIs: input.remainingEMIs,
          totalRemaining: totalRemaining.toString(),
          dueDate: input.dueDate,
          closesIn: input.closesIn,
          extraLoan: extraLoan.toString(),
          status: "active",
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          monthlyEMI: z.string().or(z.number()).optional(),
          remainingEMIs: z.number().optional(),
          totalRemaining: z.string().or(z.number()).optional(),
          dueDate: z.string().optional(),
          closesIn: z.string().optional(),
          extraLoan: z.string().or(z.number()).optional(),
          status: z.enum(["active", "closed", "paused"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const loan = await db.getLoanById(input.id, ctx.user.id);
        if (!loan) throw new TRPCError({ code: "NOT_FOUND" });

        const updateData: any = {};
        if (input.name) updateData.name = input.name;
        if (input.monthlyEMI) {
          updateData.monthlyEMI = typeof input.monthlyEMI === "string" 
            ? input.monthlyEMI 
            : input.monthlyEMI.toString();
        }
        if (input.remainingEMIs) updateData.remainingEMIs = input.remainingEMIs;
        if (input.totalRemaining) {
          updateData.totalRemaining = typeof input.totalRemaining === "string" 
            ? input.totalRemaining 
            : input.totalRemaining.toString();
        }
        if (input.dueDate) updateData.dueDate = input.dueDate;
        if (input.closesIn) updateData.closesIn = input.closesIn;
        if (input.extraLoan !== undefined) {
          updateData.extraLoan = typeof input.extraLoan === "string"
            ? input.extraLoan
            : input.extraLoan.toString();
        }
        if (input.status) updateData.status = input.status;

        return await db.updateLoan(input.id, ctx.user.id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const loan = await db.getLoanById(input.id, ctx.user.id);
        if (!loan) throw new TRPCError({ code: "NOT_FOUND" });
        return await db.deleteLoan(input.id, ctx.user.id);
      }),
  }),

  // ============ INCOME ROUTES ============
  income: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserIncome(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          category: z.string().min(1),
          amount: z.string().or(z.number()),
          date: z.string().or(z.date()),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const amount = typeof input.amount === "string" 
          ? parseFloat(input.amount) 
          : input.amount;
        const date = typeof input.date === "string" 
          ? new Date(input.date) 
          : input.date;

        return await db.createIncome({
          userId: ctx.user.id,
          category: input.category,
          amount: amount.toString(),
          date: date,
          notes: input.notes,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          category: z.string().optional(),
          amount: z.string().or(z.number()).optional(),
          date: z.string().or(z.date()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updateData: any = {};
        if (input.category) updateData.category = input.category;
        if (input.amount) {
          updateData.amount = typeof input.amount === "string" 
            ? input.amount 
            : input.amount.toString();
        }
        if (input.date) {
          updateData.date = typeof input.date === "string" 
            ? new Date(input.date) 
            : input.date;
        }
        if (input.notes !== undefined) updateData.notes = input.notes;

        return await db.updateIncome(input.id, ctx.user.id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteIncome(input.id, ctx.user.id);
      }),
  }),

  // ============ EXPENSES ROUTES ============
  expenses: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserExpenses(ctx.user.id);
    }),

    create: protectedProcedure
      .input(
        z.object({
          category: z.string().min(1),
          amount: z.string().or(z.number()),
          date: z.string().or(z.date()),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const amount = typeof input.amount === "string" 
          ? parseFloat(input.amount) 
          : input.amount;
        const date = typeof input.date === "string" 
          ? new Date(input.date) 
          : input.date;

        return await db.createExpense({
          userId: ctx.user.id,
          category: input.category,
          amount: amount.toString(),
          date: date,
          notes: input.notes,
        });
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          category: z.string().optional(),
          amount: z.string().or(z.number()).optional(),
          date: z.string().or(z.date()).optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const updateData: any = {};
        if (input.category) updateData.category = input.category;
        if (input.amount) {
          updateData.amount = typeof input.amount === "string" 
            ? input.amount 
            : input.amount.toString();
        }
        if (input.date) {
          updateData.date = typeof input.date === "string" 
            ? new Date(input.date) 
            : input.date;
        }
        if (input.notes !== undefined) updateData.notes = input.notes;

        return await db.updateExpense(input.id, ctx.user.id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return await db.deleteExpense(input.id, ctx.user.id);
      }),
  }),

  // ============ DASHBOARD ROUTES ============
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const userLoans = await db.getUserLoans(ctx.user.id);
      const userIncome = await db.getUserIncome(ctx.user.id);
      const userExpenses = await db.getUserExpenses(ctx.user.id);

      // Convert loans to LoanData format
      const loanData = userLoans.map(loan => ({
        id: loan.id,
        name: loan.name,
        monthlyEMI: loan.monthlyEMI,
        remainingEMIs: loan.remainingEMIs,
        dueDate: loan.dueDate,
        closesIn: loan.closesIn,
      }));

      // Calculate EMI schedule using shared scheduler
      const monthlyEMIData = calculateMonthlyEMITotals(loanData);
      
      const today = new Date();
      const currentMonthStr = today.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric"
      });
      
      const currentMonthEMIEntry = monthlyEMIData.find(entry => entry.month === currentMonthStr);
      const totalEMI = currentMonthEMIEntry 
        ? currentMonthEMIEntry.totalEMI 
        : (monthlyEMIData[0]?.totalEMI || 0);

      // Determine target month for consistent view
      const targetMonthStr = currentMonthEMIEntry ? currentMonthStr : (monthlyEMIData[0]?.month || currentMonthStr);

      // Calculate totals for target month
      const totalOutstanding = getTotalOutstandingEMI(loanData);
      const activeLoans = userLoans.filter(l => l.status === "active").length;

      const totalIncome = userIncome
        .filter(inc => {
          const date = new Date(inc.date);
          const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          return month === targetMonthStr;
        })
        .reduce((sum, inc) => sum + parseFloat(inc.amount as any), 0);

      const totalExpenses = userExpenses
        .filter(exp => {
          const date = new Date(exp.date);
          const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          return month === targetMonthStr;
        })
        .reduce((sum, exp) => sum + parseFloat(exp.amount as any), 0);

      return {
        totalEMI,
        totalOutstanding,
        activeLoans,
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses - totalEMI,
      };
    }),

    monthlyBreakdown: protectedProcedure.query(async ({ ctx }) => {
      const userLoans = await db.getUserLoans(ctx.user.id);
      const userIncome = await db.getUserIncome(ctx.user.id);
      const userExpenses = await db.getUserExpenses(ctx.user.id);

      // Convert loans to LoanData format
      const loanData = userLoans.map(loan => ({
        id: loan.id,
        name: loan.name,
        monthlyEMI: loan.monthlyEMI,
        remainingEMIs: loan.remainingEMIs,
        dueDate: loan.dueDate,
        closesIn: loan.closesIn,
      }));

      // Calculate monthly EMI totals using the shared utility
      const monthlyEMIData = calculateMonthlyEMITotals(loanData);

      const monthlyData: Record<string, any> = {};

      // Initialize with correct EMI schedule
      monthlyEMIData.forEach(entry => {
        monthlyData[entry.month] = {
          emi: entry.totalEMI,
          income: 0,
          expenses: 0,
          loans: entry.loans.map(l => l.name),
        };
      });

      // Add income
      userIncome.forEach(inc => {
        const date = new Date(inc.date);
        const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (!monthlyData[month]) {
          monthlyData[month] = { emi: 0, income: 0, expenses: 0, loans: [] };
        }
        monthlyData[month].income += parseFloat(inc.amount as any);
      });

      // Add expenses
      userExpenses.forEach(exp => {
        const date = new Date(exp.date);
        const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (!monthlyData[month]) {
          monthlyData[month] = { emi: 0, income: 0, expenses: 0, loans: [] };
        }
        monthlyData[month].expenses += parseFloat(exp.amount as any);
      });

      return monthlyData;
    }),
  }),

  // ============ EMI HISTORY ROUTES ============
  emi: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserEmiHistory(ctx.user.id);
    }),

    markPaid: protectedProcedure
      .input(
        z.object({
          loanId: z.number(),
          dueDate: z.string().or(z.date()),
          paidDate: z.string().or(z.date()),
          amount: z.string().or(z.number()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const dueDate = typeof input.dueDate === "string" ? new Date(input.dueDate) : input.dueDate;
        const paidDate = typeof input.paidDate === "string" ? new Date(input.paidDate) : input.paidDate;
        const amount = typeof input.amount === "number" ? input.amount.toString() : input.amount;

        return await db.upsertEmiHistory(ctx.user.id, input.loanId, dueDate, {
          status: "paid",
          paidDate,
          amount,
        });
      }),

    markUnpaid: protectedProcedure
      .input(
        z.object({
          loanId: z.number(),
          dueDate: z.string().or(z.date()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const dueDate = typeof input.dueDate === "string" ? new Date(input.dueDate) : input.dueDate;
        return await db.deleteEmiHistory(ctx.user.id, input.loanId, dueDate);
      }),
  }),
});

export type AppRouter = typeof appRouter;
