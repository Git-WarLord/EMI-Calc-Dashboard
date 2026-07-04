import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { calculateMonthlyEMITotals } from "@shared/emiCalculator";
import type { LoanData } from "@shared/emiCalculator";

export default function MonthlySummary() {
  const { data: loans, isLoading: loansLoading } = trpc.loans.list.useQuery();
  const { data: incomeEntries } = trpc.income.list.useQuery();
  const { data: expenseEntries } = trpc.expenses.list.useQuery();

  if (loansLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  // Convert loans to LoanData format
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

  // Initialize monthlyData with EMI entries
  const monthlyData: Record<string, any> = {};
  
  monthlyEMIData.forEach(entry => {
    monthlyData[entry.month] = {
      month: entry.month,
      emi: entry.totalEMI,
      income: 0,
      expenses: 0,
    };
  });

  // Add income data
  incomeEntries?.forEach(inc => {
    const date = new Date(inc.date);
    const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthlyData[month]) {
      monthlyData[month] = { month, emi: 0, income: 0, expenses: 0 };
    }
    monthlyData[month].income += parseFloat(inc.amount as any);
  });

  // Add expense data
  expenseEntries?.forEach(exp => {
    const date = new Date(exp.date);
    const month = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthlyData[month]) {
      monthlyData[month] = { month, emi: 0, income: 0, expenses: 0 };
    }
    monthlyData[month].expenses += parseFloat(exp.amount as any);
  });

  // Convert to array and sort
  const chartData = Object.values(monthlyData)
    .map((m: any) => ({
      ...m,
      balance: m.income - m.emi - m.expenses,
    }))
    .sort((a: any, b: any) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      const aSortKey = `${aYear}-${String(monthNames.indexOf(aMonth)).padStart(2, '0')}`;
      const bSortKey = `${bYear}-${String(monthNames.indexOf(bMonth)).padStart(2, '0')}`;
      return aSortKey.localeCompare(bSortKey);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monthly Summary</h1>
        <p className="text-muted-foreground mt-1">View your monthly income, EMI, expenses, and balance</p>
      </div>

      {/* Monthly Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
          <CardDescription>Income, EMI, and expenses by month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip formatter={(value) => `₹${value}`} />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Income" />
              <Bar dataKey="emi" fill="#ef4444" name="EMI" />
              <Bar dataKey="expenses" fill="#f59e0b" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Detailed view of each month's finances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Month</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Income</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">EMI</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Expenses</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Balance</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/40">
                    <td className="py-3 px-4 text-foreground font-medium">{row.month}</td>
                    <td className="text-right py-3 px-4 text-green-600 font-semibold">₹{row.income.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-red-600 font-semibold">₹{row.emi.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-orange-600 font-semibold">₹{row.expenses.toLocaleString()}</td>
                    <td className={`text-right py-3 px-4 font-semibold ${row.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{row.balance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{chartData.reduce((sum, m) => sum + m.income, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total EMI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{chartData.reduce((sum, m) => sum + m.emi, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ₹{chartData.reduce((sum, m) => sum + m.expenses, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${chartData.reduce((sum, m) => sum + m.balance, 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{chartData.reduce((sum, m) => sum + m.balance, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
