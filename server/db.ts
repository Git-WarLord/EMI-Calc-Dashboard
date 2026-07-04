import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, loans, income, expenses, emiHistory, monthlySummary } from "../drizzle/schema";
import { ENV } from './_core/env';
import fs from "fs";
import path from "path";

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

// File-based persistence configuration for fallback mode
const DATA_DIR = path.join(import.meta.dirname, "data");

function readDataFile<T>(filename: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    // Ignore read-only filesystem errors on Vercel
  }
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf8");
    } catch (e) {}
    return defaultValue;
  }
  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${filename}, resetting to default:`, error);
    return defaultValue;
  }
}

function writeDataFile<T>(filename: string, data: T): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.warn(`[Database] Could not write to ${filename} (read-only filesystem?)`);
  }
}

const initialMockLoans: any[] = [
  {
    id: 1,
    userId: 1,
    name: 'OneCard (CC)',
    monthlyEMI: "4125.00",
    remainingEMIs: 5,
    totalRemaining: "20625.00",
    dueDate: '9th',
    closesIn: 'Nov 2026',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    userId: 1,
    name: 'OneCard Fridge',
    monthlyEMI: "2708.00",
    remainingEMIs: 4,
    totalRemaining: "10832.00",
    dueDate: '9th',
    closesIn: 'Oct 2026',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    userId: 1,
    name: 'Fibe',
    monthlyEMI: "5646.00",
    remainingEMIs: 3,
    totalRemaining: "16938.00",
    dueDate: '5th',
    closesIn: 'Sep 2026',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    userId: 1,
    name: 'KreditBee',
    monthlyEMI: "4651.00",
    remainingEMIs: 10,
    totalRemaining: "46510.00",
    dueDate: '8th',
    closesIn: 'Apr 2027',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 5,
    userId: 1,
    name: 'Kotak Mahindra',
    monthlyEMI: "4649.00",
    remainingEMIs: 5,
    totalRemaining: "23245.00",
    dueDate: '5th',
    closesIn: 'Nov 2026',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 6,
    userId: 1,
    name: 'mPokket',
    monthlyEMI: "1893.00",
    remainingEMIs: 6,
    totalRemaining: "11358.00",
    dueDate: '2nd',
    closesIn: 'Dec 2026',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 7,
    userId: 1,
    name: 'mMoney',
    monthlyEMI: "12910.00",
    remainingEMIs: 1,
    totalRemaining: "12910.00",
    dueDate: '5th',
    closesIn: 'Jul 2026',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 8,
    userId: 1,
    name: 'Navi',
    monthlyEMI: "4300.00",
    remainingEMIs: 16,
    totalRemaining: "68800.00",
    dueDate: '1st',
    closesIn: 'Oct 2027',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 9,
    userId: 1,
    name: 'Bike extra loan',
    monthlyEMI: "2000.00",
    remainingEMIs: 1,
    totalRemaining: "2000.00",
    dueDate: '3rd',
    closesIn: 'Jul 2026',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 10,
    userId: 1,
    name: 'Bike',
    monthlyEMI: "7818.00",
    remainingEMIs: 24,
    totalRemaining: "187632.00",
    dueDate: '3rd',
    closesIn: 'Jun 2028',
    extraLoan: "0.00",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const mockLoans: any[] = readDataFile("loans.json", initialMockLoans).map((l: any) => ({
  ...l,
  createdAt: new Date(l.createdAt),
  updatedAt: new Date(l.updatedAt),
}));

const mockIncome: any[] = readDataFile("income.json", []).map((i: any) => ({
  ...i,
  date: new Date(i.date),
  createdAt: new Date(i.createdAt),
  updatedAt: new Date(i.updatedAt),
}));

const mockExpenses: any[] = readDataFile("expenses.json", []).map((e: any) => ({
  ...e,
  date: new Date(e.date),
  createdAt: new Date(e.createdAt),
  updatedAt: new Date(e.updatedAt),
}));

const mockEmiHistory: any[] = readDataFile("emi_history.json", []).map((h: any) => ({
  ...h,
  dueDate: new Date(h.dueDate),
  paidDate: h.paidDate ? new Date(h.paidDate) : null,
  createdAt: new Date(h.createdAt),
  updatedAt: new Date(h.updatedAt),
}));

const mockMonthlySummary: any[] = readDataFile("monthly_summary.json", []).map((s: any) => ({
  ...s,
  createdAt: new Date(s.createdAt),
  updatedAt: new Date(s.updatedAt),
}));

function saveLoans() {
  writeDataFile("loans.json", mockLoans);
}

function saveIncome() {
  writeDataFile("income.json", mockIncome);
}

function saveExpenses() {
  writeDataFile("expenses.json", mockExpenses);
}

function saveEmiHistory() {
  writeDataFile("emi_history.json", mockEmiHistory);
}

function saveMonthlySummary() {
  writeDataFile("monthly_summary.json", mockMonthlySummary);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available. Bypassing.");
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
    return {
      id: 1,
      openId,
      name: "Demo User",
      email: "demo@example.com",
      loginMethod: "mock",
      role: "admin" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date()
    };
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ LOANS QUERIES ============

export async function getUserLoans(userId: number) {
  const db = await getDb();
  if (!db) return mockLoans;
  return await db.select().from(loans).where(eq(loans.userId, userId));
}

export async function getLoanById(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    return mockLoans.find(l => l.id === loanId) || null;
  }
  const result = await db.select().from(loans).where(and(eq(loans.id, loanId), eq(loans.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createLoan(data: typeof loans.$inferInsert) {
  const db = await getDb();
  if (!db) {
    const newLoan = {
      ...data,
      id: mockLoans.length > 0 ? Math.max(...mockLoans.map(l => l.id)) + 1 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockLoans.push(newLoan);
    saveLoans();
    return { insertId: newLoan.id };
  }
  const result = await db.insert(loans).values(data);
  return result;
}

export async function updateLoan(loanId: number, userId: number, data: Partial<typeof loans.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    const loan = mockLoans.find(l => l.id === loanId);
    if (loan) {
      Object.assign(loan, data);
      loan.updatedAt = new Date();
      saveLoans();
    }
    return { affectedRows: 1 };
  }
  return await db.update(loans).set(data).where(and(eq(loans.id, loanId), eq(loans.userId, userId)));
}

export async function deleteLoan(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    const index = mockLoans.findIndex(l => l.id === loanId);
    if (index !== -1) {
      mockLoans.splice(index, 1);
      saveLoans();
    }
    return { affectedRows: 1 };
  }
  return await db.delete(loans).where(and(eq(loans.id, loanId), eq(loans.userId, userId)));
}

// ============ INCOME QUERIES ============

export async function getUserIncome(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return mockIncome;
  return await db.select().from(income).where(eq(income.userId, userId));
}

export async function createIncome(data: typeof income.$inferInsert) {
  const db = await getDb();
  if (!db) {
    const newIncome = {
      ...data,
      id: mockIncome.length > 0 ? Math.max(...mockIncome.map(i => i.id)) + 1 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockIncome.push(newIncome);
    saveIncome();
    return { insertId: newIncome.id };
  }
  return await db.insert(income).values(data);
}

export async function updateIncome(incomeId: number, userId: number, data: Partial<typeof income.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    const item = mockIncome.find(i => i.id === incomeId);
    if (item) {
      Object.assign(item, data);
      item.updatedAt = new Date();
      saveIncome();
    }
    return { affectedRows: 1 };
  }
  return await db.update(income).set(data).where(and(eq(income.id, incomeId), eq(income.userId, userId)));
}

export async function deleteIncome(incomeId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    const index = mockIncome.findIndex(i => i.id === incomeId);
    if (index !== -1) {
      mockIncome.splice(index, 1);
      saveIncome();
    }
    return { affectedRows: 1 };
  }
  return await db.delete(income).where(and(eq(income.id, incomeId), eq(income.userId, userId)));
}

// ============ EXPENSES QUERIES ============

export async function getUserExpenses(userId: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return mockExpenses;
  return await db.select().from(expenses).where(eq(expenses.userId, userId));
}

export async function createExpense(data: typeof expenses.$inferInsert) {
  const db = await getDb();
  if (!db) {
    const newExpense = {
      ...data,
      id: mockExpenses.length > 0 ? Math.max(...mockExpenses.map(e => e.id)) + 1 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockExpenses.push(newExpense);
    saveExpenses();
    return { insertId: newExpense.id };
  }
  return await db.insert(expenses).values(data);
}

export async function updateExpense(expenseId: number, userId: number, data: Partial<typeof expenses.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    const item = mockExpenses.find(e => e.id === expenseId);
    if (item) {
      Object.assign(item, data);
      item.updatedAt = new Date();
      saveExpenses();
    }
    return { affectedRows: 1 };
  }
  return await db.update(expenses).set(data).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
}

export async function deleteExpense(expenseId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    const index = mockExpenses.findIndex(e => e.id === expenseId);
    if (index !== -1) {
      mockExpenses.splice(index, 1);
      saveExpenses();
    }
    return { affectedRows: 1 };
  }
  return await db.delete(expenses).where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));
}

// ============ EMI HISTORY QUERIES ============

export async function createEmiHistory(data: typeof emiHistory.$inferInsert) {
  const db = await getDb();
  if (!db) {
    const newHistory = {
      ...data,
      id: mockEmiHistory.length > 0 ? Math.max(...mockEmiHistory.map(h => h.id)) + 1 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockEmiHistory.push(newHistory);
    saveEmiHistory();
    return { insertId: newHistory.id };
  }
  return await db.insert(emiHistory).values(data);
}

export async function getEmiHistoryByLoan(loanId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    return mockEmiHistory.filter(h => h.loanId === loanId && h.userId === userId);
  }
  return await db.select().from(emiHistory).where(and(eq(emiHistory.loanId, loanId), eq(emiHistory.userId, userId)));
}

export async function getUserEmiHistory(userId: number) {
  const db = await getDb();
  if (!db) return mockEmiHistory;
  return await db.select().from(emiHistory).where(eq(emiHistory.userId, userId));
}

export async function upsertEmiHistory(
  userId: number,
  loanId: number,
  dueDate: Date,
  data: Partial<typeof emiHistory.$inferInsert>
) {
  const db = await getDb();
  if (!db) {
    const existingIndex = mockEmiHistory.findIndex(
      h =>
        h.userId === userId &&
        h.loanId === loanId &&
        new Date(h.dueDate).toISOString().split('T')[0] === new Date(dueDate).toISOString().split('T')[0]
    );

    if (existingIndex !== -1) {
      Object.assign(mockEmiHistory[existingIndex], data);
      mockEmiHistory[existingIndex].updatedAt = new Date();
    } else {
      mockEmiHistory.push({
        id: mockEmiHistory.length > 0 ? Math.max(...mockEmiHistory.map(h => h.id)) + 1 : 1,
        userId,
        loanId,
        dueDate: new Date(dueDate),
        amount: data.amount || "0",
        status: data.status || "pending",
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    saveEmiHistory();
    return { affectedRows: 1 };
  }

  // Check if an entry already exists for this loan and due date
  const existing = await db
    .select()
    .from(emiHistory)
    .where(
      and(
        eq(emiHistory.userId, userId),
        eq(emiHistory.loanId, loanId),
        eq(emiHistory.dueDate, dueDate)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return await db
      .update(emiHistory)
      .set(data)
      .where(eq(emiHistory.id, existing[0].id));
  } else {
    return await db.insert(emiHistory).values({
      userId,
      loanId,
      dueDate,
      amount: data.amount || "0",
      status: data.status || "pending",
      paidDate: data.paidDate || null,
    });
  }
}

export async function deleteEmiHistory(userId: number, loanId: number, dueDate: Date) {
  const db = await getDb();
  if (!db) {
    const index = mockEmiHistory.findIndex(
      h =>
        h.userId === userId &&
        h.loanId === loanId &&
        new Date(h.dueDate).toISOString().split('T')[0] === new Date(dueDate).toISOString().split('T')[0]
    );
    if (index !== -1) {
      mockEmiHistory.splice(index, 1);
      saveEmiHistory();
    }
    return { affectedRows: 1 };
  }
  return await db
    .delete(emiHistory)
    .where(
      and(
        eq(emiHistory.userId, userId),
        eq(emiHistory.loanId, loanId),
        eq(emiHistory.dueDate, dueDate)
      )
    );
}

// ============ MONTHLY SUMMARY QUERIES ============

export async function getMonthlySummary(userId: number, month: string) {
  const db = await getDb();
  if (!db) {
    return mockMonthlySummary.find(s => s.month === month) || null;
  }
  const result = await db.select().from(monthlySummary).where(and(eq(monthlySummary.userId, userId), eq(monthlySummary.month, month))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createMonthlySummary(data: typeof monthlySummary.$inferInsert) {
  const db = await getDb();
  if (!db) {
    const newSummary = {
      ...data,
      id: mockMonthlySummary.length > 0 ? Math.max(...mockMonthlySummary.map(s => s.id)) + 1 : 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockMonthlySummary.push(newSummary);
    saveMonthlySummary();
    return { insertId: newSummary.id };
  }
  return await db.insert(monthlySummary).values(data);
}

export async function updateMonthlySummary(userId: number, month: string, data: Partial<typeof monthlySummary.$inferInsert>) {
  const db = await getDb();
  if (!db) {
    const s = mockMonthlySummary.find(s => s.month === month);
    if (s) {
      Object.assign(s, data);
      s.updatedAt = new Date();
      saveMonthlySummary();
    }
    return { affectedRows: 1 };
  }
  return await db.update(monthlySummary).set(data).where(and(eq(monthlySummary.userId, userId), eq(monthlySummary.month, month)));
}
