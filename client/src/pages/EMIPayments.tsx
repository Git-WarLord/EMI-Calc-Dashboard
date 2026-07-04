import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Info,
  TrendingUp,
  Percent
} from "lucide-react";
import {
  generateDecoratedEMISchedule,
  calculatePaymentStats,
  formatDateToYYYYMMDD
} from "@shared/emiCalculator";
import type { LoanData, DecoratedEMI } from "@shared/emiCalculator";

export default function EMIPayments() {
  const { data: loans, isLoading: loansLoading } = trpc.loans.list.useQuery();
  const { data: emiHistory, isLoading: historyLoading, refetch } = trpc.emi.list.useQuery();
  const markPaid = trpc.emi.markPaid.useMutation();
  const markUnpaid = trpc.emi.markUnpaid.useMutation();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");
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

  // Format loans to LoanData for the scheduler
  const loanData: LoanData[] = (loans || []).map(loan => ({
    id: loan.id,
    name: loan.name,
    monthlyEMI: loan.monthlyEMI,
    remainingEMIs: loan.remainingEMIs,
    dueDate: loan.dueDate,
    closesIn: loan.closesIn,
  }));

  // Generate full schedule with status decorated from database emiHistory records
  const decoratedSchedule = generateDecoratedEMISchedule(loanData, emiHistory || []);

  // Extract flat list of all EMIs across all months
  const allEmis: DecoratedEMI[] = [];
  decoratedSchedule.forEach(monthEntry => {
    monthEntry.loans.forEach(emi => {
      allEmis.push({
        ...emi,
        // Carry the month name along for rendering in list
        dueDateStr: emi.dueDateStr,
      });
    });
  });

  // Calculate statistics
  const stats = calculatePaymentStats(decoratedSchedule);

  // Filter EMIs
  const filteredEmis = allEmis.filter(emi => {
    const matchesSearch = emi.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || emi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Sort EMIs: pending/overdue first, sorted by due date; paid last, sorted by due date desc
  const sortedEmis = [...filteredEmis].sort((a, b) => {
    // Sort primarily by date
    return a.dueDateStr.localeCompare(b.dueDateStr);
  });

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
      toast.success(`Marked EMI for ${selectedEmi.name} as Paid!`);
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
        <h1 className="text-3xl font-bold text-foreground">EMI Payments & History</h1>
        <p className="text-muted-foreground mt-1">Track payments, log paid EMIs, and view payment on-time analytics.</p>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* On-Time Rate */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              On-Time Payment Rate
              <Percent className="w-4 h-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-foreground">
                {Math.round(stats.onTimeRate)}%
              </span>
              <span className="text-xs text-muted-foreground">on-time</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.onTimeCount} of {stats.paidCount} paid EMIs on-time
            </p>
            <div className="w-full bg-muted/60 rounded-full h-1.5 mt-2">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.onTimeRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Paid EMIs */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Paid EMIs
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-foreground">{stats.paidCount}</span>
              <span className="text-xs text-muted-foreground">/ {stats.totalEmis} total</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(stats.paidRate)}% completion progress
            </p>
            <div className="w-full bg-muted/60 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.paidRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending EMIs */}
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Pending EMIs
              <Clock className="w-4 h-4 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-foreground text-yellow-600">
                {stats.pendingCount}
              </span>
              <span className="text-xs text-muted-foreground">upcoming</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting due dates in future months
            </p>
            <div className="w-full bg-muted/60 rounded-full h-1.5 mt-2">
              <div
                className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalEmis > 0 ? (stats.pendingCount / stats.totalEmis) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Overdue EMIs */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              Overdue EMIs
              <XCircle className="w-4 h-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span className={`text-2xl font-bold ${stats.overdueCount > 0 ? "text-red-600 animate-pulse" : "text-foreground"}`}>
                {stats.overdueCount}
              </span>
              <span className="text-xs text-muted-foreground">unpaid past due</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires immediate action
            </p>
            <div className="w-full bg-muted/60 rounded-full h-1.5 mt-2">
              <div
                className="bg-red-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.totalEmis > 0 ? (stats.overdueCount / stats.totalEmis) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and List */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>EMI Payment Schedule</CardTitle>
              <CardDescription>View, search, filter, and log payments for all EMIs</CardDescription>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  placeholder="Search loans..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-48 md:w-60 h-9"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-muted/40 border rounded-lg p-1">
                <Filter className="w-3.5 h-3.5 text-muted-foreground/60 ml-1.5" />
                <select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.target.value)}
                  className="bg-transparent border-0 text-sm focus:ring-0 cursor-pointer pr-8 py-0.5"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-3 px-6">Loan Name</th>
                  <th className="py-3 px-6">Due Date</th>
                  <th className="py-3 px-6 text-right">Amount</th>
                  <th className="py-3 px-6 text-center">Status</th>
                  <th className="py-3 px-6">Payment Info</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedEmis.length > 0 ? (
                  sortedEmis.map((emi, idx) => {
                    const isPaid = emi.status === "paid";
                    const isOverdue = emi.status === "overdue";
                    const formattedDueDate = new Date(emi.dueDateStr).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="py-4 px-6 font-semibold text-foreground">{emi.name}</td>
                        <td className="py-4 px-6 text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4 text-muted-foreground/60" />
                            {formattedDueDate}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-foreground">
                          ₹{emi.emiAmount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {isPaid ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-50">
                              Paid
                            </Badge>
                          ) : isOverdue ? (
                            <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
                              Overdue
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground">
                          {isPaid ? (
                            <div className="text-xs">
                              <span className="font-medium text-foreground">Paid on: </span>
                              {emi.paidDate ? new Date(emi.paidDate).toLocaleDateString() : "N/A"}
                              {emi.paidDateStr && emi.dueDateStr && (
                                <span className={`ml-2 font-semibold ${emi.paidDateStr <= emi.dueDateStr ? "text-green-600" : "text-amber-600"}`}>
                                  ({emi.paidDateStr <= emi.dueDateStr ? "On-Time" : "Late"})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">Not Paid Yet</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {isPaid ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkUnpaid(emi)}
                              className="text-red-600 border-red-100 hover:bg-red-50 h-8"
                              disabled={markUnpaid.isPending}
                            >
                              Mark Unpaid
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPayModal(emi)}
                              className="bg-blue-600 hover:bg-blue-700 text-white h-8"
                            >
                              Mark as Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">
                      <Info className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      No EMIs match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
                <Label htmlFor="dueDateField">Due Date</Label>
                <Input
                  id="dueDateField"
                  value={selectedEmi ? new Date(selectedEmi.dueDateStr).toLocaleDateString() : ""}
                  disabled
                  className="bg-muted/40 text-muted-foreground"
                />
              </div>

              <div>
                <Label htmlFor="amountField">EMI Amount (₹)</Label>
                <Input
                  id="amountField"
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="paidDateField">Payment Date</Label>
                <Input
                  id="paidDateField"
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
    </div>
  );
}
