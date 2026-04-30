import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle2, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface RoadmapMilestone {
  month: number;
  targetAmount: number;
  monthlyContribution: number;
  description: string;
}

interface SavingsRoadmap {
  goalId: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  monthsToGoal: number;
  monthlyContribution: number;
  assumptions: string[];
  milestones: RoadmapMilestone[];
  feasible: boolean;
  reasoning: string;
}

export default function SavingsRoadmap() {
  const [roadmaps, setRoadmaps] = useState<SavingsRoadmap[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch data
  const { data: goals = [] } = trpc.savingsGoals.list.useQuery();
  const { data: expenses = [] } = trpc.expenses.list.useQuery({});
  const { data: income = [] } = trpc.income.list.useQuery({});

  const handleGenerateRoadmap = async () => {
    if (goals.length === 0) {
      toast.error("Please create at least one savings goal first");
      return;
    }

    setIsGenerating(true);
    try {
      // Calculate financial metrics
      const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);
      const monthlyAvailable = totalIncome - totalExpenses;

      // Generate roadmaps for each goal
      const newRoadmaps: SavingsRoadmap[] = goals.map((goal) => {
        const targetAmount = parseFloat(goal.targetAmount);
        const currentAmount = parseFloat(goal.currentAmount);
        const remainingAmount = targetAmount - currentAmount;

        // Calculate months needed if saving all available funds
        const monthsNeeded = monthlyAvailable > 0 ? Math.ceil(remainingAmount / monthlyAvailable) : 999;

        // Generate milestones
        const milestones: RoadmapMilestone[] = [];
        let currentSaved = currentAmount;

        for (let i = 1; i <= Math.min(monthsNeeded, 12); i++) {
          const monthlyContribution = monthlyAvailable > 0 ? monthlyAvailable : 0;
          currentSaved += monthlyContribution;

          milestones.push({
            month: i,
            targetAmount: Math.min(currentSaved, targetAmount),
            monthlyContribution,
            description: `Month ${i}: Save $${monthlyContribution.toFixed(2)} → Total: $${Math.min(currentSaved, targetAmount).toFixed(2)}`,
          });

          if (currentSaved >= targetAmount) break;
        }

        const feasible = monthlyAvailable > 0 && monthsNeeded <= 60;

        return {
          goalId: goal.id,
          goalName: goal.name,
          targetAmount,
          currentAmount,
          monthsToGoal: monthsNeeded,
          monthlyContribution: monthlyAvailable,
          assumptions: [
            `Monthly income: $${totalIncome.toFixed(2)}`,
            `Monthly expenses: $${totalExpenses.toFixed(2)}`,
            `Available to save: $${monthlyAvailable.toFixed(2)}`,
            `Current progress: $${currentAmount.toFixed(2)} of $${targetAmount.toFixed(2)}`,
          ],
          milestones,
          feasible,
          reasoning: feasible
            ? `Based on your current financial situation, you can reach this goal in approximately ${monthsNeeded} months by saving $${monthlyAvailable.toFixed(2)} per month.`
            : monthlyAvailable <= 0
              ? "Your current expenses exceed your income. Consider reducing expenses or increasing income to make progress on this goal."
              : `This goal would take ${monthsNeeded} months to achieve, which is longer than recommended. Consider adjusting your goal amount or finding ways to increase your savings rate.`,
        };
      });

      setRoadmaps(newRoadmaps);
      toast.success("Roadmaps generated successfully");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to generate roadmaps");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Savings Roadmap</h1>
        <p className="text-muted-foreground">Personalized plans to reach your savings goals</p>
      </div>

      {/* Generate Button */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Your Roadmap</CardTitle>
          <CardDescription>Create personalized savings plans based on your financial situation</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerateRoadmap}
            disabled={isGenerating || goals.length === 0}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Target className="mr-2 h-4 w-4" />
                Generate Roadmaps
              </>
            )}
          </Button>
          {goals.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2">Create a savings goal first to generate a roadmap</p>
          )}
        </CardContent>
      </Card>

      {/* Roadmaps */}
      {roadmaps.length > 0 && (
        <div className="space-y-6">
          {roadmaps.map((roadmap) => (
            <Card key={roadmap.goalId} className={roadmap.feasible ? "border-green-200" : "border-amber-200"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {roadmap.feasible ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Target className="h-5 w-5 text-amber-600" />
                      )}
                      {roadmap.goalName}
                    </CardTitle>
                    <CardDescription>{roadmap.reasoning}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Timeline</div>
                    <div className="text-2xl font-bold">{roadmap.monthsToGoal} months</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted p-3 rounded">
                    <p className="text-xs text-muted-foreground">Target Amount</p>
                    <p className="text-lg font-bold">${roadmap.targetAmount.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-xs text-muted-foreground">Current Saved</p>
                    <p className="text-lg font-bold">${roadmap.currentAmount.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-3 rounded">
                    <p className="text-xs text-muted-foreground">Monthly Save</p>
                    <p className="text-lg font-bold">${roadmap.monthlyContribution.toFixed(2)}</p>
                  </div>
                </div>

                {/* Assumptions */}
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Assumptions</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {roadmap.assumptions.map((assumption, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-primary">•</span>
                        {assumption}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Milestones */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm">Monthly Milestones</h4>
                  <div className="space-y-2">
                    {roadmap.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-center gap-3 pb-2 border-b last:border-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">M{milestone.month}</span>
                        </div>
                        <div className="flex-grow">
                          <p className="text-sm font-medium">{milestone.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">${milestone.targetAmount.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">
                            {((milestone.targetAmount / roadmap.targetAmount) * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className={`p-3 rounded text-sm ${roadmap.feasible ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}>
                  {roadmap.feasible ? (
                    <>
                      <p className="font-semibold mb-1">✓ Goal is achievable</p>
                      <p>Follow the monthly milestones above to reach your goal on schedule.</p>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold mb-1">⚠ Goal requires adjustment</p>
                      <p>Consider increasing your income or reducing expenses to accelerate progress toward this goal.</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {roadmaps.length === 0 && !isGenerating && goals.length > 0 && (
        <Card className="bg-slate-50">
          <CardContent className="py-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Click "Generate Roadmaps" to create personalized savings plans</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
