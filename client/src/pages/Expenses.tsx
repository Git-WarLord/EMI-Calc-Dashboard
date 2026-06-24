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
import { Plus, Trash2, Edit2, TrendingDown } from "lucide-react";

const EXPENSE_CATEGORIES = ["Food", "Transport", "Utilities", "Entertainment", "Healthcare", "Shopping", "Other"];

export default function Expenses() {
  const { data: expenseEntries, isLoading, refetch } = trpc.expenses.list.useQuery();
  const createExpense = trpc.expenses.create.useMutation();
  const updateExpense = trpc.expenses.update.useMutation();
  const deleteExpense = trpc.expenses.delete.useMutation();

  const [isOpen, setIsOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [formData, setFormData] = useState({
    category: "Food",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleOpenDialog = (expense?: any) => {
    if (expense) {
      setEditingExpense(expense);
      const date = new Date(expense.date);
      setFormData({
        category: expense.category,
        amount: expense.amount,
        date: date.toISOString().split("T")[0],
        notes: expense.notes || "",
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category: "Food",
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
      if (editingExpense) {
        await updateExpense.mutateAsync({
          id: editingExpense.id,
          ...formData,
        });
        toast.success("Expense updated successfully");
      } else {
        await createExpense.mutateAsync(formData);
        toast.success("Expense added successfully");
      }
      setIsOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save expense");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteExpense.mutateAsync({ id: deleteId });
      toast.success("Expense deleted successfully");
      setDeleteId(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete expense");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  const totalExpenses = expenseEntries?.reduce((sum, exp) => sum + parseFloat(exp.amount as any), 0) || 0;
  const expenseByCategory = expenseEntries?.reduce((acc: Record<string, number>, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount as any);
    return acc;
  }, {}) || {};

  const filteredExpenses = filterCategory === "All" 
    ? expenseEntries 
    : expenseEntries?.filter(exp => exp.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Tracking</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your daily expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
              <DialogDescription>
                {editingExpense ? "Update your expense details" : "Record a new expense"}
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
                  {EXPENSE_CATEGORIES.map(cat => (
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
              <Button type="submit" className="w-full" disabled={createExpense.isPending || updateExpense.isPending}>
                {editingExpense ? "Update Expense" : "Add Expense"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">{expenseEntries?.length || 0} entries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{Object.keys(expenseByCategory).length}</div>
            <p className="text-xs text-gray-500 mt-1">Expense categories used</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
          <CardDescription>Breakdown of your spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(expenseByCategory).map(([category, amount]) => (
              <div key={category} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{category}</p>
                <p className="text-lg font-semibold text-gray-900">₹{(amount as number).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filter and List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Entries</CardTitle>
          <CardDescription>All recorded expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="filter" className="text-sm">Filter by Category</Label>
            <select
              id="filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
            >
              <option value="All">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filteredExpenses && filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{expense.category}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(expense.date).toLocaleDateString()} {expense.notes && `• ${expense.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-red-600">₹{parseFloat(expense.amount as any).toLocaleString()}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(expense)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(expense.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center py-8 text-gray-500">No expenses recorded yet. Add one to get started!</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
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
