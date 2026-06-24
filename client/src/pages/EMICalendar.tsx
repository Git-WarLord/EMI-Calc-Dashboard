import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle } from "lucide-react";

export default function EMICalendar() {
  const { data: loans, isLoading } = trpc.loans.list.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  // Group loans by due date
  const dueDateGroups: Record<string, any> = {};

  if (loans && loans.length > 0) {
    loans.forEach(loan => {
      const dueDate = String(loan.dueDate);
      if (!dueDateGroups[dueDate]) {
        dueDateGroups[dueDate] = {
          dueDate: loan.dueDate,
          loans: [],
          totalEMI: 0,
        };
      }
      dueDateGroups[dueDate].loans.push(loan);
      dueDateGroups[dueDate].totalEMI += parseFloat(loan.monthlyEMI as any);
    });
  }

  // Sort by due date
  const sortedDueDates = Object.values(dueDateGroups)
    .sort((a: any, b: any) => {
      const dayA = parseInt(String(a.dueDate).match(/^(\d+)/)?.[1] || "1", 10);
      const dayB = parseInt(String(b.dueDate).match(/^(\d+)/)?.[1] || "1", 10);
      return dayA - dayB;
    });

  // Get day name
  const getDayName = (dueDateStr: string) => {
    const day = parseInt(String(dueDateStr).match(/^(\d+)/)?.[1] || "1", 10);
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    // Create a date object for the current month with the given day
    const d = new Date(2026, 6, day);
    return days[d.getDay()];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">EMI Calendar</h1>
        <p className="text-gray-600 mt-1">Date-wise EMI schedule - when each loan is due</p>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedDueDates.length > 0 ? (
          sortedDueDates.map((dateGroup: any, idx: number) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dateGroup.dueDate}
                        <span className="text-sm text-gray-500 ml-2">
                          ({getDayName(dateGroup.dueDate)})
                        </span>
                      </h3>
                      <p className="text-sm text-gray-600">of every month</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">₹{dateGroup.totalEMI.toLocaleString()}</div>
                    <p className="text-xs text-gray-500">{dateGroup.loans.length} loan(s)</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {dateGroup.loans.map((loan: any) => (
                    <div key={loan.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{loan.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 text-sm">
                          ₹{parseFloat(loan.monthlyEMI as any).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{loan.remainingEMIs} EMI(s)</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-2">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No loans to display</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Monthly Calendar Overview */}
      {sortedDueDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly EMI Calendar</CardTitle>
            <CardDescription>Quick reference for all EMI due dates in a month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Day</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">Total EMI</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Loans</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDueDates.map((dateGroup: any, idx: number) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{dateGroup.dueDate}</td>
                      <td className="py-3 px-4 text-gray-600">{getDayName(dateGroup.dueDate)}</td>
                      <td className="text-right py-3 px-4 font-semibold text-red-600">
                        ₹{dateGroup.totalEMI.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {dateGroup.loans.map((loan: any) => (
                            <Badge key={loan.id} variant="secondary" className="text-xs">
                              {loan.name}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tips for Managing EMI Due Dates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Pro Tip:</strong> Mark these dates on your calendar to ensure you never miss an EMI payment.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">
                <strong>Plan Ahead:</strong> Keep enough balance in your account before the due date to cover all EMIs.
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-900">
                <strong>Consolidate:</strong> If multiple EMIs fall on the same date, ensure you have sufficient funds for all of them.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
