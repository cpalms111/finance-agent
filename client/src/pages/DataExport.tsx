import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { Download, FileText, Sheet } from "lucide-react";
import { toast } from "sonner";

export default function DataExport() {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch all data
  const { data: expenses = [] } = trpc.expenses.list.useQuery({});
  const { data: income = [] } = trpc.income.list.useQuery({});
  const { data: budgets = [] } = trpc.budgets.list.useQuery({});
  const { data: goals = [] } = trpc.savingsGoals.list.useQuery();

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      // Create CSV content
      let csv = "Finance Agent Export Report\n";
      csv += `Generated: ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\n\n`;

      // Expenses
      csv += "EXPENSES\n";
      csv += "Date,Category,Amount,Description\n";
      expenses.forEach((exp) => {
        csv += `${format(new Date(exp.date), "yyyy-MM-dd")},${exp.category},${exp.amount},"${exp.description || ""}"\n`;
      });

      csv += "\n\nINCOME\n";
      csv += "Date,Source,Amount,Notes\n";
      income.forEach((inc) => {
        csv += `${format(new Date(inc.date), "yyyy-MM-dd")},${inc.source || ""},${inc.amount},"${inc.notes || ""}"\n`;
      });

      csv += "\n\nBUDGETS\n";
      csv += "Category,Limit\n";
      budgets.forEach((budget) => {
        csv += `${budget.category},${budget.limit}\n`;
      });

      csv += "\n\nSAVINGS GOALS\n";
      csv += "Name,Target Amount,Current Amount,Deadline,Description\n";
      goals.forEach((goal) => {
        csv += `${goal.name},${goal.targetAmount},${goal.currentAmount},"${goal.deadline ? format(new Date(goal.deadline), "yyyy-MM-dd") : ""}","${goal.description || ""}"\n`;
      });

      // Create blob and download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("CSV exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      // Create a simple HTML report
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      const netSavings = totalIncome - totalExpenses;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Finance Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; }
            h2 { color: #666; margin-top: 30px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
            .metric { padding: 15px; background: #f5f5f5; border-radius: 8px; }
            .metric-label { font-size: 12px; color: #666; }
            .metric-value { font-size: 24px; font-weight: bold; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #f5f5f5; font-weight: bold; }
            .footer { margin-top: 40px; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <h1>Finance Agent Report</h1>
          <p>Generated: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm:ss")}</p>

          <div class="summary">
            <div class="metric">
              <div class="metric-label">Total Income</div>
              <div class="metric-value">$${totalIncome.toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Total Expenses</div>
              <div class="metric-value">$${totalExpenses.toFixed(2)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Net Savings</div>
              <div class="metric-value" style="color: ${netSavings >= 0 ? '#10b981' : '#ef4444'}">$${netSavings.toFixed(2)}</div>
            </div>
          </div>

          <h2>Recent Expenses</h2>
          <table>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Description</th>
            </tr>
            ${expenses.slice(0, 20).map((exp) => `
              <tr>
                <td>${format(new Date(exp.date), "MMM dd, yyyy")}</td>
                <td>${exp.category}</td>
                <td>$${parseFloat(exp.amount).toFixed(2)}</td>
                <td>${exp.description || "-"}</td>
              </tr>
            `).join("")}
          </table>

          <h2>Savings Goals</h2>
          <table>
            <tr>
              <th>Goal</th>
              <th>Target</th>
              <th>Current</th>
              <th>Progress</th>
            </tr>
            ${goals.map((goal) => {
              const progress = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
              return `
                <tr>
                  <td>${goal.name}</td>
                  <td>$${parseFloat(goal.targetAmount).toFixed(2)}</td>
                  <td>$${parseFloat(goal.currentAmount).toFixed(2)}</td>
                  <td>${Math.min(progress, 100).toFixed(0)}%</td>
                </tr>
              `;
            }).join("")}
          </table>

          <div class="footer">
            <p>This report was automatically generated by Finance Agent.</p>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-report-${format(new Date(), "yyyy-MM-dd")}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Export</h1>
        <p className="text-muted-foreground">Download your financial data and reports</p>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sheet className="h-6 w-6 text-blue-600" />
              <CardTitle>Export as CSV</CardTitle>
            </div>
            <CardDescription>Download all your financial data in spreadsheet format</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Includes:</p>
              <ul className="list-disc list-inside">
                <li>{expenses.length} expense records</li>
                <li>{income.length} income records</li>
                <li>{budgets.length} budget categories</li>
                <li>{goals.length} savings goals</li>
              </ul>
            </div>
            <Button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="w-full gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* PDF Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-red-600" />
              <CardTitle>Export as Report</CardTitle>
            </div>
            <CardDescription>Generate a formatted financial report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Includes:</p>
              <ul className="list-disc list-inside">
                <li>Financial summary metrics</li>
                <li>Recent expense details</li>
                <li>Savings goals progress</li>
                <li>Professional formatting</li>
              </ul>
            </div>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="w-full gap-2"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Data Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Expenses</p>
              <p className="text-2xl font-bold">{expenses.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Income Records</p>
              <p className="text-2xl font-bold">{income.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Budgets</p>
              <p className="text-2xl font-bold">{budgets.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Goals</p>
              <p className="text-2xl font-bold">{goals.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">About Your Data</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2 text-sm">
          <p>Your financial data is securely stored and encrypted. Exports are created locally in your browser and are not stored on our servers.</p>
          <p>You can export your data at any time to create backups or analyze your finances in external tools.</p>
        </CardContent>
      </Card>
    </div>
  );
}
