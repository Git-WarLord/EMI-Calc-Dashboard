import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, DollarSign } from "lucide-react";

const INCOME_CATEGORIES = ["Salary", "Freelance", "Bonus", "Investment", "Other"];

export default function Income() {
  const { data: incomeEntries, isLoading, refetch } = trpc.income.list.useQuery();
  const createIncome = trpc.income.create.useMutation();
  const updateIncome = trpc.income.update.useMutation();
  const deleteIncome = trpc.income.delete.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category: "Salary",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleOpenDialog = (income?: any) => {
    if (income) {
      setEditingIncome(income);
      const date = new Date(income.date);
      setFormData({
        category: income.category,
        amount: income.amount,
        date: date.toISOString().split("T")[0],
        notes: income.notes || "",
      });
    } else {
      setEditingIncome(null);
      setFormData({
        category: "Salary",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    }
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingIncome) {
        await updateIncome.mutateAsync({
          id: editingIncome.id,
          ...formData,
        });
        toast.success("Income updated successfully");
      } else {
        await createIncome.mutateAsync(formData);
        toast.success("Income added successfully");
      }
      setIsOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save income");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteIncome.mutateAsync({ id: deleteId });
      toast.success("Income deleted successfully");
      setDeleteId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete income");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  const totalIncome = incomeEntries?.reduce((sum, inc) => sum + parseFloat(inc.amount as any), 0) || 0;
  const incomeByCategory = incomeEntries?.reduce((acc: Record<string, number>, inc) => {
    acc[inc.category] = (acc[inc.category] || 0) + parseFloat(inc.amount as any);
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Income Management</h1>
          <p className="text-gray-600 mt-1">Track all your income sources</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIncome ? "Edit Income" : "Add Income"}</DialogTitle>
              <DialogDescription>
                {editingIncome ? "Update your income details" : "Record a new income entry"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {INCOME_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Add notes..."
                />
              </div>
              <Button type="submit" className="w-full" disabled={createIncome.isPending || updateIncome.isPending}>
                {editingIncome ? "Update Income" : "Add Income"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalIncome.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{incomeEntries?.length || 0} entries</p>
          </CardContent>
        </Card>

        {Object.entries(incomeByCategory).map(([category, amount]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">₹{(amount as number).toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Income List */}
      <Card>
        <CardHeader>
          <CardTitle>Income Entries</CardTitle>
          <CardDescription>All recorded income sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {incomeEntries && incomeEntries.length > 0 ? (
              incomeEntries.map((income) => (
                <div key={income.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{income.category}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(income.date).toLocaleDateString()} {income.notes && `• ${income.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-green-600">₹{parseFloat(income.amount as any).toLocaleString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(income)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(income.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">No income entries yet. Add one to get started!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Income</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this income entry? This action cannot be undone.
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
    </div>
  );
}
