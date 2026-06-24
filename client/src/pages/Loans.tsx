import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, TrendingDown, History, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  generateDecoratedEMISchedule,
  formatDateToYYYYMMDD
} from "@shared/emiCalculator";
import type { LoanData, DecoratedEMI } from "@shared/emiCalculator";

export default function Loans() {
  const { data: loans, isLoading: loansLoading, refetch } = trpc.loans.list.useQuery();
  const { data: emiHistory, isLoading: historyLoading, refetch: refetchEmi } = trpc.emi.list.useQuery();
  
  const createLoan = trpc.loans.create.useMutation();
  const updateLoan = trpc.loans.update.useMutation();
  const deleteLoan = trpc.loans.delete.useMutation();
  const markPaid = trpc.emi.markPaid.useMutation();
  const markUnpaid = trpc.emi.markUnpaid.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedLoanId, setExpandedLoanId] = useState<number | null>(null);
  const [selectedEmi, setSelectedEmi] = useState<DecoratedEMI | null>(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(formatDateToYYYYMMDD(new Date()));
  const [payAmount, setPayAmount] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    monthlyEMI: "",
    remainingEMIs: "",
    totalRemaining: "",
    dueDate: "",
    closesIn: "",
    extraLoan: "",
  });

  const handleOpenDialog = (loan?: any) => {
    if (loan) {
      setEditingLoan(loan);
      setFormData({
        name: loan.name,
        monthlyEMI: loan.monthlyEMI,
        remainingEMIs: loan.remainingEMIs.toString(),
        totalRemaining: loan.totalRemaining,
        dueDate: loan.dueDate,
        closesIn: loan.closesIn,
        extraLoan: loan.extraLoan ? loan.extraLoan.toString() : "0",
      });
    } else {
      setEditingLoan(null);
      setFormData({
        name: "",
        monthlyEMI: "",
        remainingEMIs: "",
        totalRemaining: "",
        dueDate: "",
        closesIn: "",
        extraLoan: "",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const extraLoanVal = formData.extraLoan ? parseFloat(formData.extraLoan) : 0;
      if (editingLoan) {
        await updateLoan.mutateAsync({
          id: editingLoan.id,
          name: formData.name,
          monthlyEMI: formData.monthlyEMI,
          remainingEMIs: parseInt(formData.remainingEMIs),
          totalRemaining: formData.totalRemaining,
          dueDate: formData.dueDate,
          closesIn: formData.closesIn,
          extraLoan: extraLoanVal,
        });
        toast.success("Loan updated successfully");
      } else {
        await createLoan.mutateAsync({
          name: formData.name,
          monthlyEMI: formData.monthlyEMI,
          remainingEMIs: parseInt(formData.remainingEMIs),
          totalRemaining: formData.totalRemaining,
          dueDate: formData.dueDate,
          closesIn: formData.closesIn,
          extraLoan: extraLoanVal,
        });
        toast.success("Loan added successfully");
      }
      setIsOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save loan");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLoan.mutateAsync({ id: deleteId });
      toast.success("Loan deleted successfully");
      setDeleteId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete loan");
    }
  };

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
      toast.success(`Marked as Paid!`);
      setIsPayModalOpen(false);
      refetchEmi();
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
      toast.success(`Reverted payment`);
      refetchEmi();
    } catch (error: any) {
      toast.error(error.message || "Failed to revert payment");
    }
  };

  if (loansLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  // Convert loans to LoanData format
  const loanDataList: LoanData[] = (loans || []).map(loan => ({
    id: loan.id,
    name: loan.name,
    monthlyEMI: loan.monthlyEMI,
    remainingEMIs: loan.remainingEMIs,
    dueDate: loan.dueDate,
    closesIn: loan.closesIn,
  }));

  // Generate full decorated schedule with status from database emiHistory records
  const decoratedSchedule = generateDecoratedEMISchedule(loanDataList, emiHistory || []);

  const getLoanEmis = (loanId: number) => {
    const emis: DecoratedEMI[] = [];
    decoratedSchedule.forEach(month => {
      month.loans.forEach(emi => {
        if (emi.loanId === loanId) {
          emis.push(emi);
        }
      });
    });
    return emis.sort((a, b) => a.dueDateStr.localeCompare(b.dueDateStr));
  };

  const closedLoans = loans?.filter(l => l.status === "closed") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loan Management</h1>
          <p className="text-gray-600 mt-1">Manage and track all your loans</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLoan ? "Edit Loan" : "Add New Loan"}</DialogTitle>
              <DialogDescription>
                {editingLoan ? "Update the loan details" : "Enter the details of your new loan"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Loan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Home Loan"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyEMI">Monthly EMI</Label>
                  <Input
                    id="monthlyEMI"
                    type="number"
                    value={formData.monthlyEMI}
                    onChange={(e) => setFormData({ ...formData, monthlyEMI: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="remainingEMIs">Remaining EMIs</Label>
                  <Input
                    id="remainingEMIs"
                    type="number"
                    value={formData.remainingEMIs}
                    onChange={(e) => setFormData({ ...formData, remainingEMIs: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalRemaining">Total Remaining Amount</Label>
                  <Input
                    id="totalRemaining"
                    type="number"
                    value={formData.totalRemaining}
                    onChange={(e) => setFormData({ ...formData, totalRemaining: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="extraLoan">Extra Loan Amount (₹)</Label>
                  <Input
                    id="extraLoan"
                    type="number"
                    value={formData.extraLoan}
                    onChange={(e) => setFormData({ ...formData, extraLoan: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date (e.g., 5th)</Label>
                  <Input
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    placeholder="5th"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="closesIn">Closes In (e.g., Nov 2025)</Label>
                  <Input
                    id="closesIn"
                    value={formData.closesIn}
                    onChange={(e) => setFormData({ ...formData, closesIn: e.target.value })}
                    placeholder="Nov 2025"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createLoan.isPending || updateLoan.isPending}>
                {editingLoan ? "Update Loan" : "Add Loan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Loans */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Loans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loans?.filter(l => l.status === "active").map((loan) => {
            const loanEmis = getLoanEmis(loan.id);
            const paidCount = loanEmis.filter(e => e.status === "paid").length;
            const isExpanded = expandedLoanId === loan.id;

            return (
              <Card key={loan.id} className="hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{loan.name}</CardTitle>
                      <CardDescription>Due on {loan.dueDate} of month</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(loan)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(loan.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly EMI</span>
                      <span className="font-semibold text-gray-900">₹{parseFloat(loan.monthlyEMI as any).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remaining EMIs</span>
                      <span className="font-semibold text-gray-900">{loan.remainingEMIs}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Outstanding</span>
                      <span className="font-semibold text-gray-900">₹{parseFloat(loan.totalRemaining as any).toLocaleString()}</span>
                    </div>
                    {loan.extraLoan && parseFloat(loan.extraLoan) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Extra Loan</span>
                        <span className="font-semibold text-amber-600">₹{parseFloat(loan.extraLoan as any).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Payment Status</span>
                        <span className="text-gray-900 font-medium">{paidCount} / {loanEmis.length} Paid</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${loanEmis.length > 0 ? (paidCount / loanEmis.length) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 pt-2">
                      Closes in {loan.closesIn}
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full flex items-center gap-2 h-9 text-xs"
                      onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                    >
                      <History className="w-3.5 h-3.5" />
                      {isExpanded ? "Hide Payment History" : "View Payment History"}
                    </Button>

                    {isExpanded && (
                      <div className="mt-3 space-y-2 border-t pt-3 max-h-60 overflow-y-auto pr-1">
                        {loanEmis.length > 0 ? (
                          loanEmis.map((emi, emiIdx) => {
                            const isEmiPaid = emi.status === "paid";
                            const isEmiOverdue = emi.status === "overdue";
                            const emiDateStr = new Date(emi.dueDateStr).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric"
                            });

                            return (
                              <div key={emiIdx} className="flex items-center justify-between p-2 bg-gray-50 rounded border text-xs gap-2">
                                <div>
                                  <p className="font-medium text-gray-900">{emiDateStr}</p>
                                  {isEmiPaid && emi.paidDate && (
                                    <p className="text-[10px] text-gray-500">Paid: {new Date(emi.paidDate).toLocaleDateString()}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {isEmiPaid ? (
                                    <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100 text-[10px] py-0 px-1">
                                      Paid
                                    </Badge>
                                  ) : isEmiOverdue ? (
                                    <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100 text-[10px] py-0 px-1">
                                      Overdue
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-[10px] py-0 px-1">
                                      Pending
                                    </Badge>
                                  )}

                                  {isEmiPaid ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkUnpaid(emi)}
                                      className="text-red-500 hover:bg-red-50 h-6 px-1.5 text-[10px]"
                                      disabled={markUnpaid.isPending}
                                    >
                                      Unpay
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenPayModal(emi)}
                                      className="text-blue-600 hover:bg-blue-50 h-6 px-1.5 text-[10px]"
                                      disabled={markPaid.isPending}
                                    >
                                      Pay
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-center text-xs text-gray-500 py-2">No payments scheduled</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Closed Loans */}
      {closedLoans.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Closed Loans</h2>
          <div className="space-y-2">
            {closedLoans.map((loan) => (
              <div key={loan.id} className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingDown className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">{loan.name}</p>
                    <p className="text-sm text-gray-600">Closed in {loan.closesIn}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-green-600">Paid Off ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay EMI Dialog Modal */}
      <Dialog open={isPayModalOpen} onOpenChange={setIsPayModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark EMI as Paid</DialogTitle>
            <DialogDescription>
              Record payment details for <strong>{selectedEmi?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkPaidSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="loansDueDateField">Due Date</Label>
                <Input
                  id="loansDueDateField"
                  value={selectedEmi ? new Date(selectedEmi.dueDateStr).toLocaleDateString() : ""}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="loansAmountField">EMI Amount (₹)</Label>
                <Input
                  id="loansAmountField"
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="loansPaidDateField">Payment Date</Label>
                <Input
                  id="loansPaidDateField"
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
