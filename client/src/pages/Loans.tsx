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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, TrendingDown, History, CheckCircle, Clock, XCircle, Search, ArrowUpDown, Calculator, Play, Pause, AlertCircle } from "lucide-react";
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

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"dueDate" | "name" | "emiDesc" | "emiAsc" | "balDesc" | "balAsc">("dueDate");

  // Calculator helper state
  const [useCalc, setUseCalc] = useState(false);
  const [calcPrincipal, setCalcPrincipal] = useState("");
  const [calcInterest, setCalcInterest] = useState("");
  const [calcTenure, setCalcTenure] = useState("");

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
    setUseCalc(false);
    setCalcPrincipal("");
    setCalcInterest("");
    setCalcTenure("");

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

  const handleCalcChange = (p: string, i: string, t: string) => {
    setCalcPrincipal(p);
    setCalcInterest(i);
    setCalcTenure(t);

    const principalVal = parseFloat(p) || 0;
    const interestVal = parseFloat(i) || 0;
    const tenureVal = parseInt(t, 10) || 0;

    if (tenureVal > 0 && principalVal > 0) {
      let emi = 0;
      if (interestVal > 0) {
        const r = interestVal / 12 / 100;
        emi = (principalVal * r * Math.pow(1 + r, tenureVal)) / (Math.pow(1 + r, tenureVal) - 1);
      } else {
        emi = principalVal / tenureVal;
      }

      // Calculate closesIn month based on current month + tenure
      const baseDate = new Date(2026, 6, 1); // standard July 2026 start date
      baseDate.setMonth(baseDate.getMonth() + tenureVal);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const closesInVal = `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()}`;

      setFormData(prev => ({
        ...prev,
        monthlyEMI: Math.round(emi).toString(),
        remainingEMIs: tenureVal.toString(),
        totalRemaining: Math.round(emi * tenureVal).toString(),
        closesIn: closesInVal,
      }));
    }
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

  const handleUpdateStatus = async (loanId: number, newStatus: "active" | "paused" | "closed") => {
    try {
      await updateLoan.mutateAsync({
        id: loanId,
        status: newStatus
      });
      toast.success(`Loan status updated to ${newStatus}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
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

  // Filter and sort function
  const getFilteredAndSortedLoans = (loanList: any[]) => {
    if (!loanList) return [];
    let filtered = loanList.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "dueDate") {
        const getNum = (s: string) => parseInt(s.match(/\d+/)?.[0] || "0", 10);
        return getNum(a.dueDate) - getNum(b.dueDate);
      }
      if (sortBy === "emiDesc") {
        return parseFloat(b.monthlyEMI) - parseFloat(a.monthlyEMI);
      }
      if (sortBy === "emiAsc") {
        return parseFloat(a.monthlyEMI) - parseFloat(b.monthlyEMI);
      }
      if (sortBy === "balDesc") {
        return parseFloat(b.totalRemaining) - parseFloat(a.totalRemaining);
      }
      if (sortBy === "balAsc") {
        return parseFloat(a.totalRemaining) - parseFloat(b.totalRemaining);
      }
      return 0;
    });
  };

  const activeLoans = getFilteredAndSortedLoans(loans?.filter(l => l.status === "active") || []);
  const pausedLoans = getFilteredAndSortedLoans(loans?.filter(l => l.status === "paused") || []);
  const closedLoans = getFilteredAndSortedLoans(loans?.filter(l => l.status === "closed") || []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loan Management</h1>
          <p className="text-muted-foreground mt-1">Manage and track your loans, calculations, and payment records</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2 shadow-sm">
              <Plus className="w-4 h-4" />
              Add Loan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLoan ? "Edit Loan Details" : "Add New Loan"}</DialogTitle>
              <DialogDescription>
                {editingLoan ? "Update the parameters of this loan record" : "Enter loan details or use the built-in EMI helper"}
              </DialogDescription>
            </DialogHeader>

            {/* EMI Helper Accordion/Section */}
            <div className="border border-border/80 rounded-lg p-3 bg-muted/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">EMI Calculator Helper</span>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-[11px]" 
                  onClick={() => setUseCalc(!useCalc)}
                >
                  {useCalc ? "Disable Helper" : "Enable Helper"}
                </Button>
              </div>

              {useCalc && (
                <div className="grid grid-cols-3 gap-3 pt-1 animate-fadeIn duration-200">
                  <div>
                    <Label htmlFor="calcPrincipal" className="text-[10px] uppercase font-bold text-muted-foreground">Principal (₹)</Label>
                    <Input
                      id="calcPrincipal"
                      type="number"
                      value={calcPrincipal}
                      onChange={(e) => handleCalcChange(e.target.value, calcInterest, calcTenure)}
                      placeholder="e.g. 50000"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calcInterest" className="text-[10px] uppercase font-bold text-muted-foreground">Interest Rate (%)</Label>
                    <Input
                      id="calcInterest"
                      type="number"
                      value={calcInterest}
                      onChange={(e) => handleCalcChange(calcPrincipal, e.target.value, calcTenure)}
                      placeholder="e.g. 12"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="calcTenure" className="text-[10px] uppercase font-bold text-muted-foreground">Tenure (Months)</Label>
                    <Input
                      id="calcTenure"
                      type="number"
                      value={calcTenure}
                      onChange={(e) => handleCalcChange(calcPrincipal, calcInterest, e.target.value)}
                      placeholder="e.g. 12"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div>
                <Label htmlFor="name" className="text-xs font-semibold">Loan Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Kotak Credit Card"
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyEMI" className="text-xs font-semibold">Monthly EMI (₹)</Label>
                  <Input
                    id="monthlyEMI"
                    type="number"
                    value={formData.monthlyEMI}
                    onChange={(e) => setFormData({ ...formData, monthlyEMI: e.target.value })}
                    placeholder="0"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="remainingEMIs" className="text-xs font-semibold">Remaining EMIs</Label>
                  <Input
                    id="remainingEMIs"
                    type="number"
                    value={formData.remainingEMIs}
                    onChange={(e) => setFormData({ ...formData, remainingEMIs: e.target.value })}
                    placeholder="0"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalRemaining" className="text-xs font-semibold">Total Remaining (₹)</Label>
                  <Input
                    id="totalRemaining"
                    type="number"
                    value={formData.totalRemaining}
                    onChange={(e) => setFormData({ ...formData, totalRemaining: e.target.value })}
                    placeholder="0"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="extraLoan" className="text-xs font-semibold">Extra Loan Portion (₹)</Label>
                  <Input
                    id="extraLoan"
                    type="number"
                    value={formData.extraLoan}
                    onChange={(e) => setFormData({ ...formData, extraLoan: e.target.value })}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate" className="text-xs font-semibold">Due Date (e.g., 5th)</Label>
                  <Input
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    placeholder="5th"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="closesIn" className="text-xs font-semibold">Closes In (e.g., Nov 2025)</Label>
                  <Input
                    id="closesIn"
                    value={formData.closesIn}
                    onChange={(e) => setFormData({ ...formData, closesIn: e.target.value })}
                    placeholder="Nov 2025"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full mt-2" disabled={createLoan.isPending || updateLoan.isPending}>
                {editingLoan ? "Update Loan" : "Add Loan"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Sort Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search loans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 w-full"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="flex h-9 w-full md:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            <option value="dueDate">Due Date (1st-31st)</option>
            <option value="name">Name (A-Z)</option>
            <option value="emiDesc">EMI (High to Low)</option>
            <option value="emiAsc">EMI (Low to High)</option>
            <option value="balDesc">Balance (High to Low)</option>
            <option value="balAsc">Balance (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3 mb-6 bg-muted/50 p-1 border rounded-lg">
          <TabsTrigger value="active" className="font-semibold text-sm">Active ({activeLoans.length})</TabsTrigger>
          <TabsTrigger value="paused" className="font-semibold text-sm">Paused ({pausedLoans.length})</TabsTrigger>
          <TabsTrigger value="closed" className="font-semibold text-sm">Closed ({closedLoans.length})</TabsTrigger>
        </TabsList>

        {/* Active Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeLoans.length === 0 ? (
            <Card className="border border-dashed border-border/80">
              <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground/60" />
                <p className="font-semibold text-sm">No active loans found</p>
                <p className="text-xs">Adjust your search filter or click "Add Loan" to create one.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeLoans.map((loan) => {
                const loanEmis = getLoanEmis(loan.id);
                const paidCount = loanEmis.filter(e => e.status === "paid").length;
                const isExpanded = expandedLoanId === loan.id;

                return (
                  <Card key={loan.id} className="hover:shadow-md border border-border/50 transition-all duration-300 flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-bold text-foreground">{loan.name}</CardTitle>
                          <CardDescription className="text-xs">Due on {loan.dueDate} of month</CardDescription>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenDialog(loan)}
                            title="Edit Loan"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateStatus(loan.id, "paused")}
                            title="Pause Loan"
                          >
                            <Pause className="w-3.5 h-3.5 text-yellow-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateStatus(loan.id, "closed")}
                            title="Close Loan"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setDeleteId(loan.id)}
                            title="Delete Loan"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Monthly EMI</span>
                          <span className="font-semibold text-foreground">₹{parseFloat(loan.monthlyEMI as any).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Remaining EMIs</span>
                          <span className="font-semibold text-foreground">{loan.remainingEMIs}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Total Outstanding</span>
                          <span className="font-semibold text-foreground">₹{parseFloat(loan.totalRemaining as any).toLocaleString()}</span>
                        </div>
                        {loan.extraLoan && parseFloat(loan.extraLoan) > 0 && (
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Extra Loan</span>
                            <span className="font-semibold text-amber-600">₹{parseFloat(loan.extraLoan as any).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-border/40">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground">Payment Status</span>
                            <span className="text-foreground font-semibold">{paidCount} / {loanEmis.length} Paid</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${loanEmis.length > 0 ? (paidCount / loanEmis.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-[11px] font-semibold text-green-600 dark:text-green-400 bg-green-500/10 dark:bg-green-500/5 px-2 py-0.5 rounded-full w-max mt-2">
                          Closes in {loan.closesIn}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/40 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full flex items-center gap-2 h-8 text-[11px]"
                          onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                        >
                          <History className="w-3.5 h-3.5" />
                          {isExpanded ? "Hide Payment History" : "View Payment History"}
                        </Button>

                        {isExpanded && (
                          <div className="mt-3 space-y-2 border-t border-border/40 pt-3 max-h-48 overflow-y-auto pr-1">
                            {loanEmis.length > 0 ? (
                              loanEmis.map((emi, emiIdx) => {
                                const isEmiPaid = emi.status === "paid";
                                const isEmiOverdue = emi.status === "overdue";
                                const emiDateStr = new Date(emi.dueDateStr).toLocaleDateString("en-US", {
                                  month: "short",
                                  year: "numeric"
                                });

                                return (
                                  <div key={emiIdx} className="flex items-center justify-between p-2 bg-muted/40 rounded border border-border/50 text-[11px] gap-2">
                                    <div>
                                      <p className="font-semibold text-foreground">{emiDateStr}</p>
                                      {isEmiPaid && emi.paidDate && (
                                        <p className="text-[10px] text-muted-foreground">Paid: {new Date(emi.paidDate).toLocaleDateString()}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isEmiPaid ? (
                                        <Badge className="bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800/40 hover:bg-green-100 text-[10px] py-0 px-1.5 font-semibold">
                                          Paid
                                        </Badge>
                                      ) : isEmiOverdue ? (
                                        <Badge className="bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800/40 hover:bg-red-100 text-[10px] py-0 px-1.5 font-semibold">
                                          Overdue
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/40 hover:bg-yellow-100 text-[10px] py-0 px-1.5 font-semibold">
                                          Pending
                                        </Badge>
                                      )}

                                      {isEmiPaid ? (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleMarkUnpaid(emi)}
                                          className="text-red-500 hover:bg-red-500/10 h-6 px-1.5 text-[10px]"
                                          disabled={markUnpaid.isPending}
                                        >
                                          Unpay
                                        </Button>
                                      ) : (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => handleOpenPayModal(emi)}
                                          className="text-blue-600 hover:bg-blue-500/10 h-6 px-1.5 text-[10px]"
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
                              <p className="text-center text-[10px] text-muted-foreground py-2">No payments scheduled</p>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Paused Tab */}
        <TabsContent value="paused" className="space-y-4">
          {pausedLoans.length === 0 ? (
            <Card className="border border-dashed border-border/80">
              <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground/60" />
                <p className="font-semibold text-sm">No paused loans found</p>
                <p className="text-xs">Any loans you pause will be displayed here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pausedLoans.map((loan) => {
                const loanEmis = getLoanEmis(loan.id);
                const paidCount = loanEmis.filter(e => e.status === "paid").length;

                return (
                  <Card key={loan.id} className="opacity-90 border border-border/50 bg-muted/20 flex flex-col justify-between">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg font-bold text-foreground">{loan.name}</CardTitle>
                            <Badge variant="outline" className="text-[10px] font-semibold text-yellow-600 border-yellow-500/35 bg-yellow-500/5">Paused</Badge>
                          </div>
                          <CardDescription className="text-xs">Paused (Due {loan.dueDate})</CardDescription>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateStatus(loan.id, "active")}
                            title="Resume Loan"
                          >
                            <Play className="w-3.5 h-3.5 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleUpdateStatus(loan.id, "closed")}
                            title="Close Loan"
                          >
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setDeleteId(loan.id)}
                            title="Delete Loan"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Monthly EMI</span>
                          <span className="font-semibold text-foreground">₹{parseFloat(loan.monthlyEMI as any).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Remaining EMIs</span>
                          <span className="font-semibold text-foreground">{loan.remainingEMIs}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Total Outstanding</span>
                          <span className="font-semibold text-foreground">₹{parseFloat(loan.totalRemaining as any).toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Closed Tab */}
        <TabsContent value="closed" className="space-y-4">
          {closedLoans.length === 0 ? (
            <Card className="border border-dashed border-border/80">
              <CardContent className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-8 h-8 text-muted-foreground/60" />
                <p className="font-semibold text-sm">No closed loans found</p>
                <p className="text-xs">Once a loan is fully paid off or manually closed, it will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {closedLoans.map((loan) => (
                <div key={loan.id} className="p-4 bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 dark:border-green-500/10 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{loan.name}</p>
                      <p className="text-xs text-muted-foreground">Closed in {loan.closesIn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">Paid Off ✓</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2.5 text-xs text-blue-600 hover:bg-blue-500/10"
                      onClick={() => handleUpdateStatus(loan.id, "active")}
                    >
                      Reopen
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setDeleteId(loan.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this loan? This will delete all associated EMI logs permanently. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end pt-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
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
                <Label htmlFor="loansDueDateField" className="text-xs font-semibold">Due Date</Label>
                <Input
                  id="loansDueDateField"
                  value={selectedEmi ? new Date(selectedEmi.dueDateStr).toLocaleDateString() : ""}
                  disabled
                  className="bg-muted/40 text-muted-foreground mt-1"
                />
              </div>

              <div>
                <Label htmlFor="loansAmountField" className="text-xs font-semibold">EMI Amount (₹)</Label>
                <Input
                  id="loansAmountField"
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="loansPaidDateField" className="text-xs font-semibold">Payment Date</Label>
                <Input
                  id="loansPaidDateField"
                  type="date"
                  value={paidDate}
                  onChange={(e) => setPaidDate(e.target.value)}
                  required
                  className="mt-1"
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
