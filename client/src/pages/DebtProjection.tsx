import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Calendar, TrendingDown, CheckCircle } from "lucide-react";
import { calculateMonthlyEMITotals, getTotalOutstandingEMI, getDebtFreeDate } from "@shared/emiCalculator";
import type { LoanData } from "@shared/emiCalculator";

export default function DebtProjection() {
  const { data: loans, isLoading } = trpc.loans.list.useQuery();

  if (isLoading) {
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
  const totalOutstandingEMI = getTotalOutstandingEMI(loanData);
  const debtFreeMonth = getDebtFreeDate(loanData);

  // Calculate debt payoff projection
  let projectionData: any[] = [];
  let cumulativeDebt = totalOutstandingEMI;

  if (monthlyEMIData.length > 0) {
    projectionData = monthlyEMIData.map((monthData, idx) => {
      cumulativeDebt -= monthData.totalEMI;
      return {
        month: monthData.month.split(' ')[0], // Just the month name for chart
        monthFull: monthData.month,
        emiPaid: monthData.totalEMI,
        remainingDebt: Math.max(0, cumulativeDebt),
        loansActive: monthData.loanCount,
      };
    });
  }

  const totalMonthlyPayment = monthlyEMIData.length > 0 
    ? totalOutstandingEMI / monthlyEMIData.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Debt Payoff Projection</h1>
        <p className="text-gray-600 mt-1">Your path to becoming debt-free</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">Current Total Debt</p>
              <p className="text-3xl font-bold text-red-600 mt-2">₹{totalOutstandingEMI.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">Average Monthly Payment</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">₹{Math.round(totalMonthlyPayment).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">Payoff Timeline</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{monthlyEMIData.length} months</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 font-medium">Debt-Free Date</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{debtFreeMonth || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debt Payoff Chart */}
      {projectionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Debt Payoff Timeline</CardTitle>
            <CardDescription>Your remaining debt over time as you pay off loans</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `₹${value.toLocaleString()}`}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="remainingDebt" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  dot={{ fill: '#ef4444' }}
                  name="Remaining Debt"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Monthly Payment & Active Loans */}
      {projectionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly EMI & Active Loans</CardTitle>
            <CardDescription>EMI amount and number of active loans each month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value) => typeof value === 'number' ? `₹${value.toLocaleString()}` : value}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="emiPaid" fill="#3b82f6" name="EMI Amount" />
                <Bar yAxisId="right" dataKey="loansActive" fill="#f59e0b" name="Active Loans" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Projection Details Table */}
      {projectionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Projection</CardTitle>
            <CardDescription>Month-by-month breakdown of your debt payoff journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Month</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-900">Active Loans</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">EMI Payment</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Remaining Debt</th>
                  </tr>
                </thead>
                <tbody>
                  {projectionData.map((data, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{data.monthFull}</td>
                      <td className="text-center py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {data.loansActive}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-blue-600">
                        ₹{data.emiPaid.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-red-600">
                        ₹{data.remainingDebt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary & Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Your Debt Payoff Journey</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-900">
                <strong>Current Debt:</strong> You owe ₹{totalOutstandingEMI.toLocaleString()} across {loans?.filter(l => l.status === 'active').length} active loans.
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Monthly Payment:</strong> You'll pay an average of ₹{Math.round(totalMonthlyPayment).toLocaleString()} per month.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <strong>Debt-Free Date:</strong> {debtFreeMonth ? `You'll be debt-free by ${debtFreeMonth}!` : 'Loading...'}
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-900">
                <strong>Real-Time Updates:</strong> This projection updates automatically whenever you modify loans or add new EMIs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips to Accelerate Debt Payoff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>1. Pay Extra in High-EMI Months:</strong> In months with lower EMI totals, consider paying extra on high-interest loans to reduce overall debt faster.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>2. Refinance High-Interest Loans:</strong> Look for opportunities to refinance expensive loans at lower interest rates.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>3. Increase Your Income:</strong> Even small increases in monthly income can significantly reduce your payoff timeline.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900">
                <strong>4. Reduce Expenses:</strong> Cut unnecessary expenses to free up more money for debt repayment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
