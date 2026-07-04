import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, CreditCard, Target, Calendar, CheckCircle, Clock, XCircle, AlertTriangle, AlertCircle } from "lucide-react";
import { calculateMonthlyEMITotals, getTotalOutstandingEMI, generateDecoratedEMISchedule, calculatePaymentStats } from "@shared/emiCalculator";
import type { LoanData } from "@shared/emiCalculator";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: summary, isLoading: summaryLoading } = trpc.dashboard.summary.useQuery();
  const { data: loans, isLoading: loansLoading } = trpc.loans.list.useQuery();
  const { data: emiHistory, isLoading: historyLoading } = trpc.emi.list.useQuery();
  const { data: monthlyBreakdown } = trpc.dashboard.monthlyBreakdown.useQuery();

  const [accountBalanceInput, setAccountBalanceInput] = useState(() => {
    return localStorage.getItem("manus-account-balance") || "0";
  });

  const handleBalanceChange = (val: string) => {
    setAccountBalanceInput(val);
    localStorage.setItem("manus-account-balance", val);
  };

  if (summaryLoading || loansLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  // Convert loans to LoanData format for calculator
  const loanData: LoanData[] = (loans || []).map(loan => ({
    id: loan.id,
    name: loan.name,
    monthlyEMI: loan.monthlyEMI,
    remainingEMIs: loan.remainingEMIs,
    dueDate: loan.dueDate,
    closesIn: loan.closesIn,
  }));

  // Prepare chart data
  const expensesByCategory = loans?.reduce((acc: Record<string, number>, loan) => {
    acc[loan.name] = parseFloat(loan.monthlyEMI as any);
    return acc;
  }, {}) || {};

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const colors = [
    "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
    "#ec4899", "#06b6d4", "#14b8a6", "#f97316", "#6366f1"
  ];

  // Monthly trend data
  const monthlyTrendData = loans?.map(loan => ({
    name: loan.name,
    emi: parseFloat(loan.monthlyEMI as any),
  })) || [];

  // Calculate accurate EMI using shared calculator
  const monthlyEMIData = calculateMonthlyEMITotals(loanData);
  const totalOutstandingEMI = getTotalOutstandingEMI(loanData);

  // Calculate current month total EMI
  const currentMonthStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    year: "numeric"
  });
  const currentMonthEMIEntry = monthlyEMIData.find(entry => entry.month === currentMonthStr);
  const currentMonthEMIDue = currentMonthEMIEntry 
    ? currentMonthEMIEntry.totalEMI 
    : (monthlyEMIData[0]?.totalEMI || 0);

  // Calculate payment status decorated data
  const decoratedSchedule = generateDecoratedEMISchedule(loanData, emiHistory || []);
  const paymentStats = calculatePaymentStats(decoratedSchedule);

  const balance = parseFloat(accountBalanceInput) || 0;

  // Filter current month EMIs
  const currentMonthSchedule = decoratedSchedule.find(entry => entry.month === currentMonthStr) || decoratedSchedule[0];
  
  const currentMonthEMIs = currentMonthSchedule 
    ? [...currentMonthSchedule.loans].sort((a, b) => a.dueDateStr.localeCompare(b.dueDateStr))
    : [];

  // Calculate running balance and coverage
  let runningBalance = balance;
  const emiCoverageList = currentMonthEMIs.map(emi => {
    const isPaid = emi.status === "paid";
    let requiredAfterThis = 0;
    let isCovered = true;
    
    if (!isPaid) {
      runningBalance -= emi.emiAmount;
      if (runningBalance < 0) {
        isCovered = false;
        requiredAfterThis = Math.abs(runningBalance);
      }
    }
    
    return {
      ...emi,
      runningBalance,
      isCovered,
      requiredAfterThis,
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Financial Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name || "User"}. Here's your financial overview.</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Monthly EMI Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{Math.round(currentMonthEMIDue).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">From {loans?.filter(l => l.status === 'active').length} active loans</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{totalOutstandingEMI.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all loans</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{summary?.totalIncome?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Net Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary?.netBalance && summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{summary?.netBalance?.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Income - EMI - Expenses</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Balance Analysis */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3 bg-muted/40 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Account Balance & EMI Coverage Analysis ({currentMonthSchedule?.month})
              </CardTitle>
              <CardDescription>Enter your bank balance to analyze upcoming EMI coverages sorted by loan due dates</CardDescription>
            </div>
            {/* Input field */}
            <div className="flex items-center gap-2 max-w-xs">
              <label htmlFor="accountBalance" className="text-xs font-semibold text-muted-foreground shrink-0">Account Balance (₹):</label>
              <Input
                id="accountBalance"
                type="number"
                value={accountBalanceInput}
                onChange={(e) => handleBalanceChange(e.target.value)}
                placeholder="Enter balance..."
                className="h-9 w-36 font-semibold"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {emiCoverageList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coverage Timeline List */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">EMI Coverage Schedule</p>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {emiCoverageList.map((emi, index) => {
                    const isPaid = emi.status === "paid";
                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                          isPaid 
                            ? "bg-muted/40 border-border opacity-75" 
                            : emi.isCovered 
                              ? "bg-green-50/50 border-green-200" 
                              : "bg-red-50/50 border-red-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{emi.name}</span>
                            {isPaid ? (
                              <Badge className="bg-green-100 text-green-800 border-none text-[10px] h-4 px-1.5 hover:bg-green-100">Paid</Badge>
                            ) : emi.isCovered ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] h-4 px-1.5 hover:bg-emerald-100">Covered</Badge>
                            ) : (
                              <Badge className="bg-rose-100 text-rose-800 border-none text-[10px] h-4 px-1.5 hover:bg-rose-100">Shortfall</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Due: {new Date(emi.dueDateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })} ({emi.dueDate})</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold text-foreground">₹{emi.emiAmount.toLocaleString()}</p>
                          {!isPaid && (
                            <p className={`text-[11px] font-medium mt-0.5 ${emi.isCovered ? "text-green-700" : "text-red-600"}`}>
                              {emi.isCovered 
                                ? `Bal: ₹${Math.round(emi.runningBalance).toLocaleString()}` 
                                : `Need ₹${Math.round(emi.requiredAfterThis).toLocaleString()} more`
                              }
                            </p>
                          )}
                          {isPaid && (
                            <p className="text-[11px] text-muted-foreground/60 mt-0.5">Paid on {emi.paidDate ? new Date(emi.paidDate).toLocaleDateString() : "N/A"}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="p-4 bg-muted/40 rounded-xl border flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-foreground text-sm mb-3">Coverage Analysis Summary</h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Initial Balance:</span>
                      <span className="font-semibold text-foreground">₹{balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Unpaid EMIs:</span>
                      <span className="font-semibold text-foreground">
                        ₹{emiCoverageList.filter(e => e.status !== "paid").reduce((sum, e) => sum + e.emiAmount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Ending Balance:</span>
                      <span className={`font-bold ${runningBalance >= 0 ? "text-green-700" : "text-red-600"}`}>
                        ₹{Math.round(runningBalance).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  {runningBalance >= 0 ? (
                    <div className="flex items-start gap-2.5 text-green-800 bg-green-50 p-3 rounded-lg border border-green-200">
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs">All EMIs Covered</p>
                        <p className="text-[11px] text-green-700 mt-0.5">Your current account balance is sufficient to cover all upcoming EMIs for this month in order of due dates.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 text-red-800 bg-red-50 p-3 rounded-lg border border-red-200">
                      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-xs">Funds Required</p>
                        <p className="text-[11px] text-red-700 mt-0.5">You will have a shortfall of <strong>₹{Math.round(Math.abs(runningBalance)).toLocaleString()}</strong> this month. Arrange additional funds before the due dates shown in red.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No EMIs scheduled for this month.</p>
          )}
        </CardContent>
      </Card>

      {/* EMI Payments Health overview card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              EMI Payment Health Summary
            </CardTitle>
            <CardDescription>Visual stats of on-time vs late payments and current payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-muted/40 rounded-lg border text-center">
                <div className="text-sm font-medium text-muted-foreground">Paid EMIs</div>
                <div className="text-2xl font-bold text-blue-600 mt-1">{paymentStats.paidCount} / {paymentStats.totalEmis}</div>
                <div className="text-xs text-muted-foreground mt-1">{Math.round(paymentStats.paidRate)}% complete</div>
              </div>
              <div className="p-4 bg-muted/40 rounded-lg border text-center">
                <div className="text-sm font-medium text-muted-foreground">On-Time Rate</div>
                <div className="text-2xl font-bold text-green-600 mt-1">{Math.round(paymentStats.onTimeRate)}%</div>
                <div className="text-xs text-muted-foreground mt-1">{paymentStats.onTimeCount} on-time payments</div>
              </div>
              <div className={`p-4 rounded-lg border text-center ${paymentStats.overdueCount > 0 ? "bg-red-50 border-red-200" : "bg-muted/40"}`}>
                <div className="text-sm font-medium text-muted-foreground">Overdue EMIs</div>
                <div className={`text-2xl font-bold mt-1 ${paymentStats.overdueCount > 0 ? "text-red-600" : "text-foreground"}`}>{paymentStats.overdueCount}</div>
                <div className="text-xs text-muted-foreground mt-1">Requires attention</div>
              </div>
            </div>
            {paymentStats.overdueCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-4 text-red-800 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>You have <strong>{paymentStats.overdueCount}</strong> overdue EMI payments. Please check the EMI Timeline or Payments page to log them.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>On-Time Analytics</CardTitle>
            <CardDescription>Distribution of logged payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-green-700">On-Time Payments</span>
                <span>{paymentStats.onTimeCount} ({Math.round(paymentStats.onTimeRate)}%)</span>
              </div>
              <div className="w-full bg-muted/60 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${paymentStats.onTimeRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-amber-700">Late Payments</span>
                <span>{paymentStats.lateCount} ({Math.round(paymentStats.lateRate)}%)</span>
              </div>
              <div className="w-full bg-muted/60 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${paymentStats.lateRate}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-foreground">Remaining Future EMIs</span>
                <span>{paymentStats.pendingCount}</span>
              </div>
              <div className="w-full bg-muted/60 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${paymentStats.totalEmis > 0 ? (paymentStats.pendingCount / paymentStats.totalEmis) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EMI Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>EMI Distribution by Loan</CardTitle>
            <CardDescription>Monthly EMI breakdown across all loans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ₹${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly EMI Trend */}
        <Card>
          <CardHeader>
            <CardTitle>EMI Amount by Loan</CardTitle>
            <CardDescription>Monthly EMI for each active loan</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Bar dataKey="emi" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Loans Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
          <CardDescription>{loans?.filter(l => l.status === "active").length} loans are currently active</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loans?.filter(l => l.status === "active").map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-foreground">{loan.name}</p>
                  <p className="text-sm text-muted-foreground">Due on {loan.dueDate} of month • Closes in {loan.closesIn}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">₹{parseFloat(loan.monthlyEMI as any).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{loan.remainingEMIs} EMIs left</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
