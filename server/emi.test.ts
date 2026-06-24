import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database queries to run in-memory for testing
vi.mock("./db", () => {
  const mockEmiHistory: any[] = [];
  return {
    getUserEmiHistory: vi.fn(async (userId: number) => {
      return mockEmiHistory.filter(e => e.userId === userId);
    }),
    upsertEmiHistory: vi.fn(async (userId: number, loanId: number, dueDate: Date, data: any) => {
      const existingIdx = mockEmiHistory.findIndex(
        e => e.userId === userId && e.loanId === loanId && e.dueDate.getTime() === dueDate.getTime()
      );
      if (existingIdx > -1) {
        mockEmiHistory[existingIdx] = {
          ...mockEmiHistory[existingIdx],
          ...data,
          dueDate,
        };
      } else {
        mockEmiHistory.push({
          id: mockEmiHistory.length + 1,
          userId,
          loanId,
          dueDate,
          amount: data.amount || "0",
          status: data.status || "pending",
          paidDate: data.paidDate || null,
        });
      }
      return { success: true };
    }),
    deleteEmiHistory: vi.fn(async (userId: number, loanId: number, dueDate: Date) => {
      const idx = mockEmiHistory.findIndex(
        e => e.userId === userId && e.loanId === loanId && e.dueDate.getTime() === dueDate.getTime()
      );
      if (idx > -1) {
        mockEmiHistory.splice(idx, 1);
      }
      return { success: true };
    }),
  };
});

function createAuthContext(): TrpcContext {
  const user = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("emi procedures", () => {
  it("allows marking an EMI as paid and unpaid", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const dueDateStr = "2026-07-09";

    // 1. Initial list verification
    let list = await caller.emi.list();
    const matchingInitial = list.filter(
      e => e.loanId === 1 && new Date(e.dueDate).toISOString().startsWith("2026-07-09")
    );
    expect(matchingInitial.length).toBe(0);

    // 2. Mark Paid
    await caller.emi.markPaid({
      loanId: 1,
      dueDate: dueDateStr,
      paidDate: "2026-07-08",
      amount: 4125,
    });

    // 3. Verify it was marked paid
    list = await caller.emi.list();
    const paidEntry = list.find(
      e => e.loanId === 1 && new Date(e.dueDate).toISOString().startsWith("2026-07-09")
    );
    expect(paidEntry).toBeDefined();
    expect(paidEntry?.status).toBe("paid");
    expect(parseFloat(paidEntry?.amount as any)).toBe(4125);

    // 4. Mark Unpaid
    await caller.emi.markUnpaid({
      loanId: 1,
      dueDate: dueDateStr,
    });

    // 5. Verify it was deleted/marked unpaid
    list = await caller.emi.list();
    const matchingFinal = list.filter(
      e => e.loanId === 1 && new Date(e.dueDate).toISOString().startsWith("2026-07-09")
    );
    expect(matchingFinal.length).toBe(0);
  });
});
