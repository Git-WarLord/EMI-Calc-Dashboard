import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
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
 * Loans table - stores all loan information
 */
export const loans = mysqlTable("loans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  monthlyEMI: decimal("monthlyEMI", { precision: 12, scale: 2 }).notNull(),
  remainingEMIs: int("remainingEMIs").notNull(),
  totalRemaining: decimal("totalRemaining", { precision: 12, scale: 2 }).notNull(),
  dueDate: varchar("dueDate", { length: 50 }).notNull(), // e.g., "5th", "9th", "1st"
  closesIn: varchar("closesIn", { length: 100 }).notNull(), // e.g., "Nov 2025"
  extraLoan: decimal("extraLoan", { precision: 12, scale: 2 }).default("0").notNull(), // Extra loan amount if any
  status: mysqlEnum("status", ["active", "closed", "paused"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Loan = typeof loans.$inferSelect;
export type InsertLoan = typeof loans.$inferInsert;

/**
 * EMI History table - tracks EMI payments
 */
export const emiHistory = mysqlTable("emiHistory", {
  id: int("id").autoincrement().primaryKey(),
  loanId: int("loanId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paidDate"),
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmiHistory = typeof emiHistory.$inferSelect;
export type InsertEmiHistory = typeof emiHistory.$inferInsert;

/**
 * Income table - tracks all income entries
 */
export const income = mysqlTable("income", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "salary", "freelance", "bonus"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Income = typeof income.$inferSelect;
export type InsertIncome = typeof income.$inferInsert;

/**
 * Expenses table - tracks daily expenses
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "food", "transport", "utilities"
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Monthly Summary table - caches monthly aggregates for performance
 */
export const monthlySummary = mysqlTable("monthlySummary", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  month: varchar("month", { length: 50 }).notNull(), // e.g., "Jul 2025"
  totalEMI: decimal("totalEMI", { precision: 12, scale: 2 }).notNull().default("0"),
  totalIncome: decimal("totalIncome", { precision: 12, scale: 2 }).notNull().default("0"),
  totalExpenses: decimal("totalExpenses", { precision: 12, scale: 2 }).notNull().default("0"),
  activeLoans: int("activeLoans").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonthlySummary = typeof monthlySummary.$inferSelect;
export type InsertMonthlySummary = typeof monthlySummary.$inferInsert;
