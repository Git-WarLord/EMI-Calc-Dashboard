/**
 * Shared EMI Schedule Calculator
 * This utility generates accurate month-by-month EMI schedules for all loans
 * Used by all pages to ensure data consistency
 */

export interface LoanData {
  id: number;
  name: string;
  monthlyEMI: number | string;
  remainingEMIs: number;
  dueDate: string; // e.g., "5th", "9th", "1st"
  closesIn: string; // e.g., "Nov 2025"
}

export interface MonthlyEMIEntry {
  month: string; // e.g., "Jul 2025"
  sortKey: string; // e.g., "2025-07" for sorting
  date: Date;
  loans: Array<{
    id: number;
    name: string;
    emiAmount: number;
    dueDate: string;
    isLastEMI: boolean;
  }>;
  totalEMI: number;
  loanCount: number;
}

/**
 * Parse a month string like "Jul 2025" into month index (0-11) and year
 */
export function parseMonthString(monthStr: string): { month: number; year: number } {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = monthStr.trim().split(/\s+/);
  
  if (parts.length < 2) {
    throw new Error(`Invalid month format: ${monthStr}`);
  }
  
  const monthName = parts[0];
  const year = parseInt(parts[1]);
  const month = monthNames.indexOf(monthName);
  
  if (month === -1) {
    throw new Error(`Invalid month name: ${monthName}`);
  }
  
  if (isNaN(year)) {
    throw new Error(`Invalid year: ${parts[1]}`);
  }
  
  return { month, year };
}

/**
 * Format month index and year into a string like "Jul 2025"
 */
export function formatMonthString(month: number, year: number): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month]} ${year}`;
}

/**
 * Calculate the starting month for a loan by working backward from closing month
 * Returns the month when the first EMI is due
 */
export function calculateStartingMonth(
  closingMonth: number,
  closingYear: number,
  remainingEMIs: number
): { month: number; year: number } {
  let month = closingMonth;
  let year = closingYear;

  // Go back (remainingEMIs - 1) months to find the first EMI month
  for (let i = 0; i < remainingEMIs - 1; i++) {
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }

  return { month, year };
}

/**
 * Generate accurate month-by-month EMI schedule for a single loan
 */
export function generateLoanEMISchedule(loan: LoanData): MonthlyEMIEntry[] {
  const monthlyEntries: MonthlyEMIEntry[] = [];
  const monthlyData: Record<string, MonthlyEMIEntry> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  try {
    const { month: closingMonth, year: closingYear } = parseMonthString(loan.closesIn);
    const { month: startMonth, year: startYear } = calculateStartingMonth(
      closingMonth,
      closingYear,
      loan.remainingEMIs
    );

    const monthlyEMI = typeof loan.monthlyEMI === 'string' 
      ? parseFloat(loan.monthlyEMI) 
      : loan.monthlyEMI;

    let currentMonth = startMonth;
    let currentYear = startYear;

    // Generate EMI entries for each remaining month
    for (let i = 0; i < loan.remainingEMIs; i++) {
      const monthName = monthNames[currentMonth];
      const monthKey = `${monthName} ${currentYear}`;
      const sortKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const date = new Date(currentYear, currentMonth, 1);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          sortKey: sortKey,
          date: date,
          loans: [],
          totalEMI: 0,
          loanCount: 0,
        };
      }

      monthlyData[monthKey].loans.push({
        id: loan.id,
        name: loan.name,
        emiAmount: monthlyEMI,
        dueDate: loan.dueDate,
        isLastEMI: i === loan.remainingEMIs - 1,
      });

      monthlyData[monthKey].totalEMI += monthlyEMI;
      monthlyData[monthKey].loanCount += 1;

      // Move to next month
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    // Convert to array and sort by date
    return Object.values(monthlyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  } catch (error) {
    console.error(`Error generating EMI schedule for loan ${loan.name}:`, error);
    return [];
  }
}

/**
 * Merge multiple loan EMI schedules into a single consolidated monthly view
 */
export function mergeEMISchedules(loanSchedules: MonthlyEMIEntry[][]): MonthlyEMIEntry[] {
  const monthlyData: Record<string, MonthlyEMIEntry> = {};

  // Flatten and merge all loan schedules
  loanSchedules.forEach(schedule => {
    schedule.forEach(entry => {
      if (!monthlyData[entry.month]) {
        monthlyData[entry.month] = {
          month: entry.month,
          sortKey: entry.sortKey,
          date: entry.date,
          loans: [],
          totalEMI: 0,
          loanCount: 0,
        };
      }

      monthlyData[entry.month].loans.push(...entry.loans);
      monthlyData[entry.month].totalEMI += entry.totalEMI;
      monthlyData[entry.month].loanCount += entry.loanCount;
    });
  });

  // Sort by date
  return Object.values(monthlyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

/**
 * Calculate accurate monthly EMI totals for all loans
 */
export function calculateMonthlyEMITotals(loans: LoanData[]): MonthlyEMIEntry[] {
  if (!loans || loans.length === 0) {
    return [];
  }

  // Generate schedule for each loan
  const loanSchedules = loans.map(loan => generateLoanEMISchedule(loan));

  // Merge all schedules
  return mergeEMISchedules(loanSchedules);
}

/**
 * Get total EMI for a specific month
 */
export function getMonthlyEMITotal(loans: LoanData[], month: string): number {
  const schedule = calculateMonthlyEMITotals(loans);
  const monthEntry = schedule.find(entry => entry.month === month);
  return monthEntry ? monthEntry.totalEMI : 0;
}

/**
 * Get all active EMI months
 */
export function getEMIMonths(loans: LoanData[]): string[] {
  const schedule = calculateMonthlyEMITotals(loans);
  return schedule.map(entry => entry.month);
}

/**
 * Calculate total outstanding EMI across all months
 */
export function getTotalOutstandingEMI(loans: LoanData[]): number {
  const schedule = calculateMonthlyEMITotals(loans);
  return schedule.reduce((sum, entry) => sum + entry.totalEMI, 0);
}

/**
 * Calculate average monthly EMI
 */
export function getAverageMonthlyEMI(loans: LoanData[]): number {
  const schedule = calculateMonthlyEMITotals(loans);
  if (schedule.length === 0) return 0;
  return getTotalOutstandingEMI(loans) / schedule.length;
}

/**
 * Get the debt-free date (last EMI month)
 */
export function getDebtFreeDate(loans: LoanData[]): string | null {
  const schedule = calculateMonthlyEMITotals(loans);
  if (schedule.length === 0) return null;
  return schedule[schedule.length - 1].month;
}

export interface DecoratedEMI {
  loanId: number;
  name: string;
  emiAmount: number;
  dueDate: string;      // e.g. "5th"
  dueDateObject: Date;  // actual due date
  dueDateStr: string;   // e.g. "2026-07-05"
  isLastEMI: boolean;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: Date | null;
  paidDateStr?: string | null;
  emiHistoryId?: number;
}

export interface DecoratedMonthlyEMIEntry {
  month: string; // e.g. "Jul 2025"
  sortKey: string; // e.g. "2025-07"
  date: Date;
  loans: DecoratedEMI[];
  totalEMI: number;
  paidEMI: number;
  pendingEMI: number;
  overdueEMI: number;
  loanCount: number;
}

export interface PaymentStats {
  totalEmis: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  onTimeCount: number;
  lateCount: number;
  onTimeRate: number; // percentage of paid EMIs that were on time
  lateRate: number;   // percentage of paid EMIs that were late
  paidRate: number;   // percentage of total EMIs that are paid
}

export function getDueDateDay(dueDateStr: string): number {
  const match = String(dueDateStr).match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

export function formatDateToYYYYMMDD(date: Date | string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateDecoratedEMISchedule(
  loans: LoanData[],
  history: Array<{ id: number; loanId: number; dueDate: string | Date; paidDate: string | Date | null; status: string; amount: string | number }>
): DecoratedMonthlyEMIEntry[] {
  const monthlyData: Record<string, DecoratedMonthlyEMIEntry> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Format today's date in YYYY-MM-DD
  const today = new Date();
  const todayStr = formatDateToYYYYMMDD(today);

  // Create a map of history entries by loanId and formatted dueDateStr
  const historyMap: Record<string, typeof history[0]> = {};
  history.forEach(h => {
    const key = `${h.loanId}_${formatDateToYYYYMMDD(h.dueDate)}`;
    historyMap[key] = h;
  });

  loans.forEach(loan => {
    try {
      const { month: closingMonth, year: closingYear } = parseMonthString(loan.closesIn);
      const { month: startMonth, year: startYear } = calculateStartingMonth(
        closingMonth,
        closingYear,
        loan.remainingEMIs
      );

      const monthlyEMI = typeof loan.monthlyEMI === 'string' 
        ? parseFloat(loan.monthlyEMI) 
        : loan.monthlyEMI;

      const dueDay = getDueDateDay(loan.dueDate);

      let currentMonth = startMonth;
      let currentYear = startYear;

      for (let i = 0; i < loan.remainingEMIs; i++) {
        const monthName = monthNames[currentMonth];
        const monthKey = `${monthName} ${currentYear}`;
        const sortKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        const monthDate = new Date(currentYear, currentMonth, 1);
        
        // Exact due date
        const dueDateObject = new Date(currentYear, currentMonth, dueDay);
        const dueDateStr = formatDateToYYYYMMDD(dueDateObject);

        // Find status
        const historyKey = `${loan.id}_${dueDateStr}`;
        const historyItem = historyMap[historyKey];

        let status: 'paid' | 'pending' | 'overdue' = 'pending';
        let paidDate: Date | null = null;
        let paidDateStr: string | null = null;
        let emiHistoryId: number | undefined = undefined;

        if (historyItem) {
          emiHistoryId = historyItem.id;
          status = historyItem.status as 'paid' | 'pending' | 'overdue';
          if (historyItem.paidDate) {
            paidDate = new Date(historyItem.paidDate);
            paidDateStr = formatDateToYYYYMMDD(historyItem.paidDate);
          }
        } else {
          // If no history, calculate dynamic status based on due date vs today
          if (dueDateStr < todayStr) {
            status = 'overdue';
          } else {
            status = 'pending';
          }
        }

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthKey,
            sortKey: sortKey,
            date: monthDate,
            loans: [],
            totalEMI: 0,
            paidEMI: 0,
            pendingEMI: 0,
            overdueEMI: 0,
            loanCount: 0,
          };
        }

        const decoratedEmi: DecoratedEMI = {
          loanId: loan.id,
          name: loan.name,
          emiAmount: monthlyEMI,
          dueDate: loan.dueDate,
          dueDateObject,
          dueDateStr,
          isLastEMI: i === loan.remainingEMIs - 1,
          status,
          paidDate,
          paidDateStr,
          emiHistoryId,
        };

        monthlyData[monthKey].loans.push(decoratedEmi);
        monthlyData[monthKey].totalEMI += monthlyEMI;
        monthlyData[monthKey].loanCount += 1;

        if (status === 'paid') {
          monthlyData[monthKey].paidEMI += monthlyEMI;
        } else if (status === 'overdue') {
          monthlyData[monthKey].overdueEMI += monthlyEMI;
        } else {
          monthlyData[monthKey].pendingEMI += monthlyEMI;
        }

        // Move to next month
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
      }
    } catch (e) {
      console.error(`Error generating decorated schedule for loan ${loan.name}:`, e);
    }
  });

  return Object.values(monthlyData).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export function calculatePaymentStats(schedule: DecoratedMonthlyEMIEntry[]): PaymentStats {
  let totalEmis = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;
  let onTimeCount = 0;
  let lateCount = 0;

  schedule.forEach(month => {
    month.loans.forEach(emi => {
      totalEmis++;
      if (emi.status === 'paid') {
        paidCount++;
        if (emi.paidDateStr && emi.dueDateStr) {
          if (emi.paidDateStr <= emi.dueDateStr) {
            onTimeCount++;
          } else {
            lateCount++;
          }
        } else {
          onTimeCount++;
        }
      } else if (emi.status === 'overdue') {
        overdueCount++;
      } else {
        pendingCount++;
      }
    });
  });

  const paidRate = totalEmis > 0 ? (paidCount / totalEmis) * 100 : 0;
  const onTimeRate = paidCount > 0 ? (onTimeCount / paidCount) * 100 : 0;
  const lateRate = paidCount > 0 ? (lateCount / paidCount) * 100 : 0;

  return {
    totalEmis,
    paidCount,
    pendingCount,
    overdueCount,
    onTimeCount,
    lateCount,
    onTimeRate,
    lateRate,
    paidRate,
  };
}
