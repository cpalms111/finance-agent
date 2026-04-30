import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Plus, TrendingUp, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function IncomeOrganizer() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>();
  const [formData, setFormData] = useState({
    amount: "",
    source: "",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
    accountId: undefined as number | undefined,
  });

  // Fetch accounts
  const { data: accounts = [] } = trpc.accounts.list.useQuery();

  const currentMonth = format(new Date(), "yyyy-MM");
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(new Date());

  // Fetch income records
  const { data: incomeRecords = [], refetch } = trpc.income.list.useQuery({
    startDate,
    endDate,
  });

  // Mutations
  const createMutation = trpc.income.create.useMutation({
    onSuccess: () => {
      toast.success("Income recorded");
      refetch();
      setFormData({ amount: "", source: "", date: format(new Date(), "yyyy-MM-dd"), notes: "", accountId: undefined });
      setIsAddOpen(false);
    },
    onError: () => toast.error("Failed to record income"),
  });

  const deleteMutation = trpc.income.delete.useMutation({
    onSuccess: () => {
      toast.success("Income record deleted");
      refetch();
    },
    onError: () => toast.error("Failed to delete income record"),
  });

  const handleAddIncome = () => {
    if (!formData.amount) {
      toast.error("Please enter an amount");
      return;
    }

    createMutation.mutate({
      amount: formData.amount,
      source: formData.source || undefined,
      date: new Date(formData.date),
      description: formData.notes || undefined,
      accountId: formData.accountId,
    });
  };

  const handleDeleteIncome = (id: number) => {
    if (confirm("Are you sure you want to delete this income record?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Calculate statistics
  const totalIncome = incomeRecords.reduce((sum, rec) => sum + parseFloat(rec.amount), 0);
  const averageIncome = incomeRecords.length > 0 ? totalIncome / incomeRecords.length : 0;
  const incomeVariance = incomeRecords.length > 1
    ? Math.sqrt(
        incomeRecords.reduce((sum, rec) => sum + Math.pow(parseFloat(rec.amount) - averageIncome, 2), 0) /
          incomeRecords.length
      )
    : 0;

  // Group by source
  const incomeBySource = incomeRecords.reduce((acc: Record<string, number>, rec) => {
    const source = rec.source || "Other";
    acc[source] = (acc[source] || 0) + parseFloat(rec.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Income Organizer</h1>
          <p className="text-muted-foreground">Track and manage your variable income</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Log Income
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Income</DialogTitle>
              <DialogDescription>Record a new income entry</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Amount ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Source</label>
                <Input
                  placeholder="e.g., Freelance, Gig work, Bonus"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  placeholder="Optional details"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              {accounts.length > 0 && (
                <div>
                  <label className="text-sm font-medium">Account (Optional)</label>
                  <select
                    value={formData.accountId?.toString() || ""}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  >
                    <option value="">No Account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id.toString()}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <Button onClick={handleAddIncome} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Recording..." : "Record Income"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Income Variability</CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${incomeVariance.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Standard deviation</p>
          </CardContent>
        </Card>
      </div>

      {/* Income by Source */}
      {Object.keys(incomeBySource).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Income by Source</CardTitle>
            <CardDescription>Distribution of income streams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(incomeBySource).map(([source, amount]) => (
                <div key={source} className="flex justify-between items-center pb-2 border-b last:border-0">
                  <span className="font-medium">{source}</span>
                  <span className="text-lg font-semibold">${(amount as number).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Income Records */}
      <Card>
        <CardHeader>
          <CardTitle>Income Records</CardTitle>
          <CardDescription>{incomeRecords.length} transaction(s) this month</CardDescription>
        </CardHeader>
        <CardContent>
          {incomeRecords.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No income recorded this month</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium">Date</th>
                    <th className="text-left py-3 px-4 font-medium">Source</th>
                    <th className="text-left py-3 px-4 font-medium">Notes</th>
                    <th className="text-right py-3 px-4 font-medium">Amount</th>
                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{format(new Date(record.date), "MMM dd, yyyy")}</td>
                      <td className="py-3 px-4">{record.source || "-"}</td>
                      <td className="py-3 px-4">{record.description || "-"}</td>
                      <td className="py-3 px-4 text-right font-semibold text-green-600">
                        +${parseFloat(record.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteIncome(record.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidance for Variable Income */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Tips for Managing Variable Income</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-3 text-sm">
          <div>
            <strong>1. Track All Sources:</strong> Log every income stream to understand your total earning potential and patterns.
          </div>
          <div>
            <strong>2. Calculate Average Income:</strong> Use your average income (${averageIncome.toFixed(2)}) as your baseline for budgeting, not your best month.
          </div>
          <div>
            <strong>3. Build a Buffer:</strong> Set aside 20-30% of income in a separate account for lean months to smooth out income fluctuations.
          </div>
          <div>
            <strong>4. Plan for Taxes:</strong> If self-employed, set aside 25-30% of income for quarterly taxes and annual obligations.
          </div>
          <div>
            <strong>5. Adjust Budgets Seasonally:</strong> Account for seasonal income variations and adjust your spending accordingly.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
