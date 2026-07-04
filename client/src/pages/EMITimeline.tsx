import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Calendar, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  generateDecoratedEMISchedule,
  getTotalOutstandingEMI,
  getAverageMonthlyEMI,
  formatDateToYYYYMMDD
} from "@shared/emiCalculator";
import type { LoanData, DecoratedEMI } from "@shared/emiCalculator";

export default function EMITimeline() {
  const { data: loans, isLoading: loansLoading } = trpc.loans.list.useQuery();
  const { data: emiHistory, isLoading: historyLoading, refetch } = trpc.emi.list.useQuery();
  const markPaid = trpc.emi.markPaid.useMutation();
  const markUnpaid = trpc.emi.markUnpaid.useMutation();

  const [selectedEmi, setSelectedEmi] = useState<DecoratedEMI | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [payAmount, setPayAmount] = useState("");

  if (loansLoading || historyLoading) {
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

  // Calculate accurate monthly EMI using shared calculator decorated with payment statuses
  const monthlyEMIData = generateDecoratedEMISchedule(loanData, emiHistory || []);
  const totalEMI = getTotalOutstandingEMI(loanData);
  const avgMonthlyEMI = getAverageMonthlyEMI(loanData);

  const handleOpenPayModal = (emi: DecoratedEMI) => {
    setSelectedEmi(emi);
    setPayAmount(emi.emiAmount.toString());
    setPaidDate(formatDateToYYYYMMDD(new Date()));
    setIsPayModalOpen(true);
  };

  const handleMarkPaidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmi) return;

    try {
      await markPaid.mutateAsync({
        loanId: selectedEmi.loanId,
        dueDate: selectedEmi.dueDateStr,
        paidDate: paidDate,
        amount: parseFloat(payAmount),
      });
      toast.success(`Marked ${selectedEmi.name} as Paid!`);
      setIsPayModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment");
    }
  };

  const handleMarkUnpaid = async (emi: DecoratedEMI) => {
    try {
      await markUnpaid.mutateAsync({
        loanId: emi.loanId,
        dueDate: emi.dueDateStr,
      });
      toast.success(`Reverted payment for ${emi.name}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to revert payment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">EMI Timeline</h1>
        <p className="text-muted-foreground mt-1">Accurate month-by-month EMI schedule showing payment statuses and outflow tracker.</p>
      </div>

      {/* Timeline View */}
      <div className="space-y-4">
        {monthlyEMIData.length > 0 ? (
          monthlyEMIData.map((monthData, idx) => (
            <Card key={idx} className="border-l-4 border-l-blue-600">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{monthData.month}</h3>
                      <p className="text-sm text-muted-foreground">
                        {monthData.loanCount} EMI(s) due •{" "}
                        <span className="text-green-600 font-medium">₹{monthData.paidEMI.toLocaleString()} Paid</span>
                        {monthData.overdueEMI > 0 && (
                          <span className="text-red-600 font-medium ml-2">• ₹{monthData.overdueEMI.toLocaleString()} Overdue</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-red-600 font-mono">₹{monthData.totalEMI.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">Total needed</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {monthData.loans.map((loanEntry, loanIdx) => {
                    const isPaid = loanEntry.status === "paid";
                    const isOverdue = loanEntry.status === "overdue";
                    
                    return (
                      <div key={`${loanEntry.loanId}-${loanIdx}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-transparent rounded-lg border border-border gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{loanEntry.name}</p>
                            {isPaid ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50 text-xs">
                                Paid
                              </Badge>
                            ) : isOverdue ? (
                              <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50 text-xs">
                                Overdue
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50 text-xs">
                                Pending
                              </Badge>
                            )}
                            {loanEntry.isLastEMI && (
                              <Badge className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50 text-xs">
                                Final EMI
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Due on {loanEntry.dueDate} of the month ({new Date(loanEntry.dueDateStr).toLocaleDateString()})
                            {isPaid && loanEntry.paidDate && (
                              <span className="text-xs text-muted-foreground block sm:inline sm:ml-2">
                                • Paid on {new Date(loanEntry.paidDate).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <p className="font-bold text-foreground">₹{loanEntry.emiAmount.toLocaleString()}</p>
                          {isPaid ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkUnpaid(loanEntry)}
                              className="text-red-600 border-red-100 hover:bg-red-50 h-8 text-xs"
                              disabled={markUnpaid.isPending}
                            >
                              Unpay
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPayModal(loanEntry)}
                              className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                              disabled={markPaid.isPending}
                            >
                              Pay
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground/60 mx-auto mb-4" />
                <p className="text-muted-foreground">No loans to display</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Stats */}
      {monthlyEMIData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Timeline Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium">Total Months</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{monthlyEMIData.length}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-900 font-medium">Total EMI Outflow</p>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  ₹{totalEMI.toLocaleString()}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-900 font-medium">Average Monthly EMI</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₹{Math.round(avgMonthlyEMI).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pay EMI Dialog Modal */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark EMI as Paid</DialogTitle>
            <DialogDescription>
              Record the payment details for <strong>{selectedEmi?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkPaidSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="timelineDueDateField">Due Date</Label>
                <Input
                  id="timelineDueDateField"
                  value={selectedEmi ? new Date(selectedEmi.dueDateStr).toLocaleDateString() : ""}
                  disabled
                  className="bg-muted/40 text-muted-foreground"
                />
              </div>

              <div>
                <Label htmlFor="timelineAmountField">EMI Amount (₹)</Label>
                <Input
                  id="timelineAmountField"
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="timelinePaidDateField">Payment Date</Label>
                <Input
                  id="timelinePaidDateField"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPayModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={markPaid.isPending}
              >
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Monthly Breakdown Table */}
      {monthlyEMIData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Breakdown</CardTitle>
            <CardDescription>Quick reference for all months and their EMI amounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Month</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">EMIs Due</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyEMIData.map((monthData, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/40">
                      <td className="py-3 px-4 font-medium text-foreground">{monthData.month}</td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary">{monthData.loanCount}</Badge>
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-red-600">
                        ₹{monthData.totalEMI.toLocaleString()}
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
          <CardTitle>Planning Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Real-Time Updates:</strong> This timeline automatically updates whenever you modify loan details. All amounts reflect your current loan data.
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-900">
                <strong>Budget Accordingly:</strong> Ensure your monthly income covers the total EMI amount plus your regular expenses.
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-900">
                <strong>Early Payoff:</strong> Paying extra EMIs in months with lower totals can help you become debt-free sooner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
