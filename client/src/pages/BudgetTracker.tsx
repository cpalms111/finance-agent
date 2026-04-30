import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = ["food", "transport", "utilities", "entertainment", "healthcare", "shopping", "other"];

export default function BudgetTracker() {
  const currentMonth = format(new Date(), "yyyy-MM");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: "food",
    limit: "",
  });

  // Fetch budgets and expenses
  const { data: budgets = [], refetch: refetchBudgets } = trpc.budgets.list.useQuery({ month: currentMonth });
  const { data: expenses = [] } = trpc.expenses.list.useQuery({
    startDate: new Date(currentMonth + "-01"),
    endDate: new Date(currentMonth + "-31"),
  });

  // Mutation
  const setBudgetMutation = trpc.budgets.set.useMutation({
    onSuccess: () => {
      toast.success("Budget updated");
      refetchBudgets();
      setFormData({ category: "food", limit: "" });
      setIsAddOpen(false);
    },
    onError: () => toast.error("Failed to set budget"),
  });

  const deleteBudgetMutation = trpc.budgets.delete.useMutation({
    onSuccess: () => {
      toast.success("Budget deleted");
      refetchBudgets();
    },
    onError: () => toast.error("Failed to delete budget"),
  });

  const handleDeleteBudget = (id: number) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      deleteBudgetMutation.mutate({ id });
    }
  };

  const handleSetBudget = () => {
    if (!formData.limit) {
      toast.error("Please enter a budget limit");
      return;
    }

    setBudgetMutation.mutate({
      category: formData.category,
      limit: formData.limit,
      month: currentMonth,
    });
  };

  // Calculate spending by category
  const expensesByCategory = expenses.reduce((acc: Record<string, number>, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});

  // Get budget details with spending
  const budgetDetails = budgets.map((budget) => ({
    ...budget,
    spent: expensesByCategory[budget.category] || 0,
    percentage: ((expensesByCategory[budget.category] || 0) / parseFloat(budget.limit)) * 100,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Budget Tracker</h1>
          <p className="text-muted-foreground">Set and monitor your monthly budgets</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Budget Limit</DialogTitle>
              <DialogDescription>Set a monthly budget for a spending category</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Monthly Limit ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                />
              </div>
              <Button onClick={handleSetBudget} className="w-full" disabled={setBudgetMutation.isPending}>
                {setBudgetMutation.isPending ? "Setting..." : "Set Budget"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Cards */}
      <div className="space-y-4">
        {budgetDetails.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No budgets set yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          budgetDetails.map((budget) => (
            <Card key={budget.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="capitalize">{budget.category}</CardTitle>
                    <CardDescription>
                      ${budget.spent.toFixed(2)} of ${parseFloat(budget.limit).toFixed(2)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{Math.min(budget.percentage, 100).toFixed(0)}%</div>
                      <p className="text-xs text-muted-foreground">
                        {budget.percentage > 100 ? "Over budget" : "Remaining"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBudget(budget.id)}
                      disabled={deleteBudgetMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={Math.min(budget.percentage, 100)}
                  className="h-2"
                />
                <div className="mt-3 text-xs text-muted-foreground">
                  {budget.percentage > 100
                    ? `Over by $${(budget.spent - parseFloat(budget.limit)).toFixed(2)}`
                    : `$${(parseFloat(budget.limit) - budget.spent).toFixed(2)} remaining`}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Budget Summary */}
      {budgetDetails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Budget Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Budgeted</span>
                <span className="font-semibold">
                  ${budgetDetails.reduce((sum, b) => sum + parseFloat(b.limit), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="font-semibold">
                  ${budgetDetails.reduce((sum, b) => sum + b.spent, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-medium">Budget Status</span>
                <span className={`font-semibold ${budgetDetails.some(b => b.percentage > 100) ? "text-red-600" : "text-green-600"}`}>
                  {budgetDetails.some(b => b.percentage > 100) ? "Over budget" : "On track"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
