import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { DollarSign, TrendingUp, Target, AlertCircle } from "lucide-react";

export default function Dashboard() {
  const currentMonth = format(new Date(), "yyyy-MM");
  const startDate = startOfMonth(new Date());
  const endDate = endOfMonth(new Date());

  // Fetch expenses for current month
  const { data: expenses = [] } = trpc.expenses.list.useQuery({
    startDate,
    endDate,
  });

  // Fetch budgets for current month
  const { data: budgets = [] } = trpc.budgets.list.useQuery({
    month: currentMonth,
  });

  // Fetch income for current month
  const { data: income = [] } = trpc.income.list.useQuery({
    startDate,
    endDate,
  });

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const totalIncome = income.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
  const netSavings = totalIncome - totalExpenses;

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc: Record<string, number>, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});

  const categoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: amount,
  }));

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        {/* Total Expenses Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        {/* Net Savings Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netSavings >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${netSavings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Income - Expenses</p>
          </CardContent>
        </Card>

        {/* Budget Status Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{budgets.length}</div>
            <p className="text-xs text-muted-foreground">Categories tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        {categoryData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Distribution of spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Budget vs Actual */}
        {budgets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual</CardTitle>
              <CardDescription>Spending against limits</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={budgets.map((budget) => ({
                    name: budget.category.charAt(0).toUpperCase() + budget.category.slice(1),
                    budget: parseFloat(budget.limit),
                    actual: expensesByCategory[budget.category] || 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" />
                  <Bar dataKey="actual" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average Daily Spending</span>
              <span className="font-semibold">${(totalExpenses / 30).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Savings Rate</span>
              <span className="font-semibold">{totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Number of Transactions</span>
              <span className="font-semibold">{expenses.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
