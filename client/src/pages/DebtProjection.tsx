import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar, TrendingDown, CheckCircle, Flame, ArrowRight, ShieldCheck, Zap, Info } from "lucide-react";
import { parseMonthString, calculateStartingMonth, formatMonthString } from "@shared/emiCalculator";
import type { LoanData } from "@shared/emiCalculator";

interface SimLoan {
  id: number;
  name: string;
  monthlyEMI: number;
  remainingBalance: number;
  remainingEMIs: number;
  startMonth: number;
  startYear: number;
  startSortKey: string;
  dueDate: string;
  paidOffMonth: string | null;
}

function simulatePayoff(
  loans: LoanData[],
  extraPayment: number,
  strategy: "standard" | "snowball" | "avalanche"
) {
  if (!loans || loans.length === 0) {
    return {
      projectionData: [],
      monthsToPayoff: 0,
      finalMonth: "",
      loanPayoffMilestones: [],
    };
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Initialize simulation state for each loan
  const simLoans: SimLoan[] = loans.map(loan => {
    const monthlyEMI = typeof loan.monthlyEMI === 'string' ? parseFloat(loan.monthlyEMI) : loan.monthlyEMI;
    const remainingBalance = monthlyEMI * loan.remainingEMIs;
    
    // Calculate start month and year
    const { month: closingMonth, year: closingYear } = parseMonthString(loan.closesIn);
    const { month: startMonth, year: startYear } = calculateStartingMonth(
      closingMonth,
      closingYear,
      loan.remainingEMIs
    );

    return {
      id: loan.id,
      name: loan.name,
      monthlyEMI,
      remainingBalance,
      remainingEMIs: loan.remainingEMIs,
      startMonth,
      startYear,
      startSortKey: `${startYear}-${String(startMonth).padStart(2, '0')}`,
      dueDate: loan.dueDate,
      paidOffMonth: null,
    };
  });

  // Find the earliest starting date among all active loans
  let minYear = Infinity;
  let minMonth = Infinity;
  simLoans.forEach(loan => {
    if (loan.startYear < minYear) {
      minYear = loan.startYear;
      minMonth = loan.startMonth;
    } else if (loan.startYear === minYear && loan.startMonth < minMonth) {
      minMonth = loan.startMonth;
    }
  });

  if (minYear === Infinity) {
    const now = new Date();
    minYear = now.getFullYear();
    minMonth = now.getMonth();
  }

  let currentMonth = minMonth;
  let currentYear = minYear;

  const projectionData: any[] = [];
  let monthCount = 0;
  const maxMonths = 120; // safety limit to prevent infinite loops

  while (monthCount < maxMonths) {
    const monthName = monthNames[currentMonth];
    const monthStr = `${monthName} ${currentYear}`;
    const sortKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Identify which loans are active this month (started and still have balance)
    const activeLoans = simLoans.filter(loan => {
      const isStarted = sortKey.localeCompare(loan.startSortKey) >= 0;
      return isStarted && loan.remainingBalance > 0;
    });

    if (activeLoans.length === 0) {
      // If there are no more active loans, and no loans left to start in the future, we are done
      const hasFutureLoans = simLoans.some(loan => sortKey.localeCompare(loan.startSortKey) < 0);
      if (!hasFutureLoans) {
        break;
      }
      
      // Otherwise, record the month and move forward
      projectionData.push({
        month: monthName,
        monthFull: monthStr,
        sortKey,
        emiPaid: 0,
        minPaid: 0,
        extraPaid: 0,
        remainingDebt: Math.round(simLoans.reduce((sum, l) => sum + l.remainingBalance, 0)),
        loansActive: 0,
      });

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      monthCount++;
      continue;
    }

    // 1. Pay minimum EMIs on all active loans
    let totalMinimumPaidThisMonth = 0;
    const loansPaidDetails = activeLoans.map(loan => {
      const minDue = Math.min(loan.remainingBalance, loan.monthlyEMI);
      loan.remainingBalance -= minDue;
      totalMinimumPaidThisMonth += minDue;
      
      if (loan.remainingBalance <= 0 && !loan.paidOffMonth) {
        loan.paidOffMonth = monthStr;
      }

      return {
        id: loan.id,
        name: loan.name,
        minPaid: minDue,
        extraPaid: 0,
      };
    });

    // 2. Calculate extra funds available this month
    // Standard strategy doesn't roll over EMIs or allow extra payments
    let extraRemaining = strategy === "standard" ? 0 : extraPayment;
    let rolledOverEMI = 0;

    if (strategy !== "standard") {
      // For Snowball/Avalanche, any loan that has started but is now paid off rolls over its EMI capacity
      simLoans.forEach(loan => {
        const hasStarted = sortKey.localeCompare(loan.startSortKey) >= 0;
        if (hasStarted && loan.remainingBalance <= 0) {
          const detail = loansPaidDetails.find(d => d.id === loan.id);
          const minPaidThisMonth = detail ? detail.minPaid : 0;
          rolledOverEMI += (loan.monthlyEMI - minPaidThisMonth);
        }
      });
    }

    let totalExtraPool = extraRemaining + rolledOverEMI;
    let totalExtraPaidThisMonth = 0;

    // Apply extra payment to targets sequentially
    while (totalExtraPool > 0) {
      const loansWithBalance = activeLoans.filter(l => l.remainingBalance > 0);
      if (loansWithBalance.length === 0) break;

      let targetLoan: SimLoan | null = null;
      if (strategy === "snowball") {
        // Smallest remaining balance first
        targetLoan = loansWithBalance.reduce((minL, l) => l.remainingBalance < minL.remainingBalance ? l : minL, loansWithBalance[0]);
      } else {
        // Avalanche: Highest monthly EMI first
        targetLoan = loansWithBalance.reduce((maxL, l) => l.monthlyEMI > maxL.monthlyEMI ? l : maxL, loansWithBalance[0]);
      }

      if (!targetLoan) break;

      const extraApplied = Math.min(targetLoan.remainingBalance, totalExtraPool);
      targetLoan.remainingBalance -= extraApplied;
      totalExtraPool -= extraApplied;
      totalExtraPaidThisMonth += extraApplied;

      const detail = loansPaidDetails.find(d => d.id === targetLoan.id);
      if (detail) {
        detail.extraPaid += extraApplied;
      }

      if (targetLoan.remainingBalance <= 0 && !targetLoan.paidOffMonth) {
        targetLoan.paidOffMonth = monthStr;
      }
    }

    const totalPaidThisMonth = totalMinimumPaidThisMonth + totalExtraPaidThisMonth;
    const remainingDebt = simLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

    projectionData.push({
      month: monthName,
      monthFull: monthStr,
      sortKey,
      emiPaid: totalPaidThisMonth,
      minPaid: totalMinimumPaidThisMonth,
      extraPaid: totalExtraPaidThisMonth,
      remainingDebt: Math.round(remainingDebt),
      loansActive: simLoans.filter(l => l.remainingBalance > 0).length,
    });

    if (simLoans.every(l => l.remainingBalance <= 0)) {
      break;
    }

    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    monthCount++;
  }

  // Extract milestones (loan paid off months)
  const loanPayoffMilestones = simLoans
    .filter(l => l.paidOffMonth !== null)
    .map(l => ({
      name: l.name,
      paidOffMonth: l.paidOffMonth!,
      monthlyEMI: l.monthlyEMI,
    }))
    .sort((a, b) => {
      // Parse months for sorting milestones
      const aDate = parseMonthString(a.paidOffMonth);
      const bDate = parseMonthString(b.paidOffMonth);
      return (aDate.year * 12 + aDate.month) - (bDate.year * 12 + bDate.month);
    });

  const finalMonth = projectionData[projectionData.length - 1]?.monthFull || "";

  return {
    projectionData,
    monthsToPayoff: projectionData.length,
    finalMonth,
    loanPayoffMilestones,
  };
}

export default function DebtProjection() {
  const { data: loans, isLoading } = trpc.loans.list.useQuery();
  const [extraPayment, setExtraPayment] = useState<number>(5000);
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("snowball");

  // Convert loans to LoanData format
  const loanData: LoanData[] = useMemo(() => {
    return (loans || []).map(loan => ({
      id: loan.id,
      name: loan.name,
      monthlyEMI: loan.monthlyEMI,
      remainingEMIs: loan.remainingEMIs,
      dueDate: loan.dueDate,
      closesIn: loan.closesIn,
    }));
  }, [loans]);

  // Standard simulation (no extra payment)
  const standardSimulation = useMemo(() => {
    return simulatePayoff(loanData, 0, "standard");
  }, [loanData]);

  // Simulated payoff based on user inputs
  const simulatedPayoff = useMemo(() => {
    return simulatePayoff(loanData, extraPayment, strategy);
  }, [loanData, extraPayment, strategy]);

  // Combined chart data for comparative visualization
  const combinedChartData = useMemo(() => {
    const stdData = standardSimulation.projectionData;
    const simData = simulatedPayoff.projectionData;
    
    // Find union of all sort keys
    const allSortKeys = Array.from(
      new Set([...stdData.map(d => d.sortKey), ...simData.map(d => d.sortKey)])
    ).sort();

    return allSortKeys.map(key => {
      const stdMonth = stdData.find(d => d.sortKey === key);
      const simMonth = simData.find(d => d.sortKey === key);
      
      const parts = key.split('-');
      const year = parts[0];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = monthNames[parseInt(parts[1], 10)];

      return {
        month: monthName,
        year: year,
        monthFull: `${monthName} ${year}`,
        standardDebt: stdMonth ? stdMonth.remainingDebt : 0,
        simulatedDebt: simMonth ? simMonth.remainingDebt : 0,
      };
    });
  }, [standardSimulation, simulatedPayoff]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  const totalOutstandingEMI = loanData.reduce(
    (sum, loan) => sum + (typeof loan.monthlyEMI === 'string' ? parseFloat(loan.monthlyEMI) : loan.monthlyEMI) * loan.remainingEMIs,
    0
  );

  const monthsSaved = Math.max(0, standardSimulation.monthsToPayoff - simulatedPayoff.monthsToPayoff);
  const percentAccelerated = standardSimulation.monthsToPayoff > 0
    ? Math.round((monthsSaved / standardSimulation.monthsToPayoff) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Interactive Debt Payoff Simulator</h1>
        <p className="text-muted-foreground mt-1">Accelerate your journey to becoming debt-free by simulating extra payments</p>
      </div>

      {/* Simulator Controls */}
      <Card className="border border-border/80 shadow-md">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
            Simulator Controls
          </CardTitle>
          <CardDescription>Adjust your strategy and extra monthly payment to see standard vs. simulated debt progress</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Slider and Strategy Selector */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-foreground">Extra Monthly Payment</label>
                  <span className="text-xl font-bold text-primary">₹{extraPayment.toLocaleString()}</span>
                </div>
                <div className="py-2">
                  <Slider
                    defaultValue={[extraPayment]}
                    value={[extraPayment]}
                    onValueChange={(val) => setExtraPayment(val[0])}
                    min={0}
                    max={50000}
                    step={1000}
                    className="cursor-pointer"
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹0 (Standard)</span>
                  <span>₹10,000</span>
                  <span>₹25,000</span>
                  <span>₹50,000</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Repayment Strategy</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStrategy("snowball")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all ${
                      strategy === "snowball"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Flame className="w-5 h-5 mb-1.5" />
                    <span className="font-semibold text-sm">Debt Snowball</span>
                    <span className="text-xs opacity-85 mt-0.5">Smallest balance first</span>
                  </button>
                  <button
                    onClick={() => setStrategy("avalanche")}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-all ${
                      strategy === "avalanche"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:bg-accent/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Zap className="w-5 h-5 mb-1.5" />
                    <span className="font-semibold text-sm">Debt Avalanche</span>
                    <span className="text-xs opacity-85 mt-0.5">Highest EMI first</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Strategy Explanation */}
            <div className="bg-muted/40 border border-border/40 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <Info className="w-4 h-4 text-blue-500" />
                Strategy Reference
              </h3>
              {strategy === "snowball" ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Debt Snowball</strong> prioritizes paying off your smallest outstanding loans first.
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Extra payment is targeted fully toward the smallest loan.</li>
                    <li>When a loan is paid off, its entire EMI amount is rolled over to pay off the next smallest loan.</li>
                    <li>Provides quick psychological wins to boost motivation.</li>
                  </ul>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Debt Avalanche</strong> prioritizes paying off loans that consume the largest portion of monthly cash flow.
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Extra payment is targeted fully toward the loan with the highest monthly EMI.</li>
                    <li>Frees up maximum monthly cash flow as early as possible.</li>
                    <li>Highly efficient for minimizing outstanding loan quantities quickly.</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/50 shadow-sm bg-card text-card-foreground">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Total Current Debt</p>
              <p className="text-3xl font-extrabold text-foreground mt-1.5">₹{totalOutstandingEMI.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">Across all {loanData.length} loans</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card text-card-foreground">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Debt-Free Date</p>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <span className="text-sm text-muted-foreground line-through">{standardSimulation.finalMonth}</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{simulatedPayoff.finalMonth || "N/A"}</span>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                {monthsSaved > 0 ? `Accelerated by ${monthsSaved} months!` : "No acceleration"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-card text-card-foreground">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Payoff Duration</p>
              <div className="flex items-center justify-center gap-1.5 mt-1.5">
                <span className="text-sm text-muted-foreground line-through">{standardSimulation.monthsToPayoff}m</span>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-2xl font-bold text-primary">{simulatedPayoff.monthsToPayoff} months</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {percentAccelerated > 0 ? `${percentAccelerated}% faster payoff!` : "Standard payment schedule"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 shadow-sm bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Time Savings
              </p>
              <p className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1.5">
                {monthsSaved} Months
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Saved from debt obligation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payoff Timeline Chart */}
      <Card className="border border-border/50 shadow-sm bg-card text-card-foreground">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Debt Payoff Trajectory</CardTitle>
          <CardDescription>Comparison of remaining outstanding balance over time between standard and simulated strategies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="month" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" tickFormatter={(value: any) => `₹${(Number(value) / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-card)",
                    borderColor: "var(--color-border)",
                    borderRadius: "0.5rem",
                    color: "var(--color-foreground)",
                  }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="standardDebt"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Standard Schedule"
                />
                <Line
                  type="monotone"
                  dataKey="simulatedDebt"
                  stroke="#10b981"
                  strokeWidth={3}
                  activeDot={{ r: 6 }}
                  name={`${strategy === "snowball" ? "Snowball" : "Avalanche"} Plan (+₹${extraPayment.toLocaleString()})`}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones Road Map */}
        <Card className="lg:col-span-1 border border-border/50 shadow-sm bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Payoff Road Map</CardTitle>
            <CardDescription>Estimated order and month when each loan is fully paid off under current simulation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
              {simulatedPayoff.loanPayoffMilestones.map((milestone, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline dot */}
                  <span className="absolute -left-6 top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-green-500 bg-background text-[10px] text-green-500 font-bold shadow-xs">
                    ✓
                  </span>
                  <div>
                    <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 mb-1">
                      {milestone.paidOffMonth}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">{milestone.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Frees up ₹{parseFloat(milestone.monthlyEMI as any).toLocaleString()}/mo</p>
                  </div>
                </div>
              ))}
              {simulatedPayoff.loanPayoffMilestones.length === 0 && (
                <p className="text-sm text-muted-foreground">No active loans simulated.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Simulated Timeline Table */}
        <Card className="lg:col-span-2 border border-border/50 shadow-sm bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-lg text-foreground">Month-by-Month Plan</CardTitle>
            <CardDescription>Detailed payment allocations and remaining balance for each simulated month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto pr-1">
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 sticky top-0">
                    <th className="py-2.5 px-3 font-semibold text-muted-foreground">Month</th>
                    <th className="py-2.5 px-3 text-center font-semibold text-muted-foreground">Active Loans</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-muted-foreground">Min Paid</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-muted-foreground">Extra Paid</th>
                    <th className="py-2.5 px-3 text-right font-semibold text-muted-foreground">Remaining Debt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {simulatedPayoff.projectionData.map((data, idx) => (
                    <tr key={idx} className="hover:bg-muted/10">
                      <td className="py-2.5 px-3 font-medium text-foreground">{data.monthFull}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="secondary" className="font-semibold px-2 py-0.5">
                          {data.loansActive}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">₹{data.minPaid.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-green-600 dark:text-green-400 font-semibold">₹{data.extraPaid.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-foreground font-bold">₹{data.remainingDebt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
