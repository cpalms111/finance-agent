import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "./Dashboard";
import ExpenseHistory from "./ExpenseHistory";
import BudgetTracker from "./BudgetTracker";
import SavingsGoals from "./SavingsGoals";
import IncomeOrganizer from "./IncomeOrganizer";
import FinancialAdvisor from "./FinancialAdvisor";
import DataExport from "./DataExport";
import SavingsRoadmap from "./SavingsRoadmap";
import BankImport from "./BankImport";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-white mb-4">Finance Agent</h1>
          <p className="text-slate-300 mb-8 text-lg">Take control of your finances with AI-powered insights and personalized guidance.</p>
          <Button asChild size="lg" className="w-full">
            <a href={getLoginUrl()}>
              Sign in with Manus
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Render dashboard with navigation
  const navItems = [
    { label: "Dashboard", path: "/" },
    { label: "Expenses", path: "/expenses" },
    { label: "Import Bank", path: "/import" },
    { label: "Budgets", path: "/budgets" },
    { label: "Savings Goals", path: "/savings" },
    { label: "Roadmap", path: "/roadmap" },
    { label: "Income", path: "/income" },
    { label: "AI Advisor", path: "/advisor" },
    { label: "Export", path: "/export" },
  ];

  const renderContent = () => {
    switch (location) {
      case "/":
        return <Dashboard />;
      case "/expenses":
        return <ExpenseHistory />;
      case "/import":
        return <BankImport />;
      case "/budgets":
        return <BudgetTracker />;
      case "/savings":
        return <SavingsGoals />;
      case "/roadmap":
        return <SavingsRoadmap />;
      case "/income":
        return <IncomeOrganizer />;
      case "/advisor":
        return <FinancialAdvisor />;
      case "/export":
        return <DataExport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <DashboardLayout navItems={navItems}>
      {renderContent()}
    </DashboardLayout>
  );
}
