import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { AlertCircle } from "lucide-react";
import { calculateMonthlyEMITotals, getTotalOutstandingEMI } from "@shared/emiCalculator";
import type { LoanData } from "@shared/emiCalculator";

export default function MonthlyBreakdown() {
  const { data: loans, isLoading: loansLoading } = trpc.loans.list.useQuery();
  const { data: expenses, isLoading: expensesLoading } = trpc.expenses.list.useQuery();

  if (loansLoading || expensesLoading) {
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

  // Calculate accurate monthly EMI using shared calculator
  const monthlyEMIData = calculateMonthlyEMITotals(loanData);

  // Build monthly breakdown with expenses
  const monthlyBreakdown = monthlyEMIData.map(emiEntry => {
    const monthExpenses = (expenses || []).filter(exp => {
      const expDate = new Date(exp.date);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const expMonth = `${monthNames[expDate.getMonth()]} ${expDate.getFullYear()}`;
      return expMonth === emiEntry.month;
    });

    const totalExpenses = monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount as any), 0);

    return {
      ...emiEntry,
      totalExpenses,
      totalRequired: emiEntry.totalEMI + totalExpenses,
      expenseCount: monthExpenses.length,
    };
  });

  // Prepare chart data
  const chartData = monthlyBreakdown.map(item => ({
    month: item.month.split(' ')[0],
    EMI: item.totalEMI,
    Expenses: item.totalExpenses,
    Total: item.totalRequired,
  }));

  const totalEMI = getTotalOutstandingEMI(loanData);
  const totalExpenses = monthlyBreakdown.reduce((sum, m) => sum + m.totalExpenses, 0);
  const totalRequired = totalEMI + totalExpenses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monthly Breakdown</h1>
        <p className="text-muted-foreground mt-1">Total EMI and expenses required each month - real-time data</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Total EMI</p>
              <p className="text-3xl font-bold text-red-600 mt-2">₹{totalEMI.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Total Expenses</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">₹{totalExpenses.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Total Required</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{totalRequired.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground font-medium">Months Tracked</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{monthlyBreakdown.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <>
          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly EMI vs Expenses</CardTitle>
              <CardDescription>Comparison of EMI and expenses for each month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="EMI" fill="#ef4444" />
                  <Bar dataKey="Expenses" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart for Total Required */}
          <Card>
            <CardHeader>
              <CardTitle>Total Amount Required Per Month</CardTitle>
              <CardDescription>Combined EMI + Expenses trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Monthly Breakdown</CardTitle>
          <CardDescription>Month-by-month EMI, expenses, and total required amount</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Total EMI</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Expenses</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Total Required</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Expense Count</th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((monthData, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/40">
                    <td className="py-3 px-4 font-medium text-foreground">{monthData.month}</td>
                    <td className="text-right py-3 px-4 font-semibold text-red-600">
                      ₹{monthData.totalEMI.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold text-orange-600">
                      ₹{monthData.totalExpenses.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 font-bold text-blue-600">
                      ₹{monthData.totalRequired.toLocaleString()}
                    </td>
                    <td className="text-center py-3 px-4">
                      {monthData.expenseCount > 0 ? (
                        <Badge variant="secondary">{monthData.expenseCount}</Badge>
                      ) : (
                        <span className="text-muted-foreground/60">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary & Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Total Outflow:</strong> You need ₹{totalRequired.toLocaleString()} across {monthlyBreakdown.length} months to cover all EMIs and expenses.
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-900">
                <strong>EMI Portion:</strong> ₹{totalEMI.toLocaleString()} ({Math.round((totalEMI / totalRequired) * 100)}%) goes towards loan EMIs.
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-900">
                <strong>Expense Portion:</strong> ₹{totalExpenses.toLocaleString()} ({Math.round((totalExpenses / totalRequired) * 100)}%) goes towards expenses.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">
                <strong>Average Monthly:</strong> ₹{Math.round(totalRequired / monthlyBreakdown.length).toLocaleString()} per month on average.
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-900">
                <strong>Real-Time Sync:</strong> All data updates automatically when you modify loans, add expenses, or change income.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
