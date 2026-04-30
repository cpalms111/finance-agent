import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { parseWellsFargoCSV, type WellsFargoRow } from "@/lib/wellsFargoParser";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const EXPENSE_CATEGORIES = [
  "vehicle_fuel",
  "business_supplies",
  "marketing",
  "subcontractors",
  "food_personal",
  "subscriptions",
  "home_family",
  "tax_savings",
  "other",
];

interface Transaction {
  date: string;
  description: string;
  amount: string;
  category?: string;
  type?: 'expense' | 'income' | 'transfer';
  isIncome?: boolean;
}

export default function BankImport() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Fetch accounts
  const { data: accounts = [] } = trpc.accounts.list.useQuery();

  const categorizeTransactionsMutation = trpc.bankImport.categorizeTransactions.useMutation({
    onError: (error) => {
      const message = error.message || "Failed to categorize transactions";
      setError(message);
      toast.error(message);
    },
  });
  const saveMerchantRuleMutation = trpc.bankImport.saveMerchantRule.useMutation();
  const importTransactionsMutation = trpc.bankImport.importTransactions.useMutation({
    onSuccess: () => {
      toast.success("Transactions imported successfully!");
      setLocation("/expenses");
    },
    onError: (error) => {
      const message = error.message || "Failed to import transactions";
      setError(message);
      toast.error(message);
    },
  });

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const text = await file.text();
      
      // Parse Wells Fargo CSV format
      const wellsFargoRows = parseWellsFargoCSV(text);
      
      // Separate into expenses and income
      const expenses: Transaction[] = [];
      const incomeTransactions: Transaction[] = [];
      
      for (const row of wellsFargoRows) {
        const transaction: Transaction = {
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          isIncome: row.isIncome,
        };
        
        if (row.type === 'income' || row.isIncome) {
          incomeTransactions.push(transaction);
        } else {
          expenses.push(transaction);
        }
      }

      // Categorize expenses using AI
      let categorizedExpenses: Transaction[] = [];
      if (expenses.length > 0) {
        const categorized = await categorizeTransactionsMutation.mutateAsync({
          transactions: expenses.map(tx => ({ date: tx.date, description: tx.description, amount: tx.amount })),
        });
        categorizedExpenses = categorized as Transaction[];
      }

      // Combine all transactions
      const allTransactions = [...categorizedExpenses, ...incomeTransactions];
      
      if (allTransactions.length === 0) {
        throw new Error("No valid transactions found in CSV");
      }

      setTransactions(allTransactions);
      setSelectedTransactions(new Set(allTransactions.map((_: any, i: number) => i)));
      setStep("review");
      toast.success(`Parsed ${allTransactions.length} transactions (${categorizedExpenses.length} expenses, ${incomeTransactions.length} income)`);
    } catch (error: any) {
      const message = error?.message || "Failed to parse CSV file";
      setError(message);
      toast.error(message);
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCategoryChange = (index: number, newCategory: string) => {
    const updated = [...transactions];
    const oldCategory = updated[index].category;
    updated[index].category = newCategory;
    setTransactions(updated);

    // Save merchant rule
    const merchantKeyword = updated[index].description.split(" ")[0];
    if (merchantKeyword && oldCategory !== newCategory) {
      saveMerchantRuleMutation.mutate({
        merchantKeyword,
        category: newCategory,
      });
    }
  };

  const toggleTransaction = (index: number) => {
    const updated = new Set(selectedTransactions);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setSelectedTransactions(updated);
  };

  const toggleAllTransactions = () => {
    if (selectedTransactions.size === transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(transactions.map((_, i) => i)));
    }
  };

  const handleImport = async () => {
    if (!selectedAccount) {
      toast.error("Please select an account to import transactions to");
      return;
    }

    const toImport = transactions
      .filter((_, i) => selectedTransactions.has(i))
      .map(tx => ({
        ...tx,
        category: tx.category || "other",
        accountId: selectedAccount,
      }));
    if (toImport.length === 0) {
      toast.error("Please select at least one transaction to import");
      return;
    }

    await importTransactionsMutation.mutateAsync(toImport as any);
  };

  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>No Accounts Found</CardTitle>
            <CardDescription>You need to create at least one account before importing transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Bank import requires an account to link imported transactions to. Please create an account first.</p>
            <Button onClick={() => setLocation("/accounts")}>Go to Accounts</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Import Bank Statement</h1>
          <p className="text-muted-foreground mt-2">
            Upload a CSV file from your bank to automatically categorize and import transactions
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Import Error</CardTitle>
            </CardHeader>
            <CardContent className="text-red-800">
              <p>{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setError(null)}
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Supports Wells Fargo and generic bank CSV formats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleFileUpload(file);
              }}
            >
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">Drag and drop your CSV file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
              </label>
            </div>

            {isProcessing && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing CSV...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Review Transactions</h1>
        <p className="text-muted-foreground mt-2">
          Review and adjust categories before importing
        </p>
      </div>

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Account</CardTitle>
            <CardDescription>Choose which account to import these transactions to</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedAccount?.toString() || ""} onValueChange={(value) => setSelectedAccount(value ? parseInt(value) : undefined)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Transactions ({transactions.length})</CardTitle>
              <CardDescription>
                {selectedTransactions.size} selected for import
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={toggleAllTransactions}
            >
              {selectedTransactions.size === transactions.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 w-8">
                    <Checkbox
                      checked={selectedTransactions.size === transactions.length}
                      onCheckedChange={toggleAllTransactions}
                    />
                  </th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-right py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Category</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={selectedTransactions.has(idx)}
                        onCheckedChange={() => toggleTransaction(idx)}
                      />
                    </td>
                    <td className="py-3 px-4">{tx.date}</td>
                    <td className="py-3 px-4">{tx.description}</td>
                    <td className="py-3 px-4 text-right font-semibold">${parseFloat(tx.amount).toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Select value={tx.category} onValueChange={(val) => handleCategoryChange(idx, val)}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload");
                setTransactions([]);
                setSelectedTransactions(new Set());
              }}
            >
              Back
            </Button>
            <Button
              onClick={handleImport}
              disabled={importTransactionsMutation.isPending || selectedTransactions.size === 0}
            >
              {importTransactionsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {selectedTransactions.size} Transactions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
