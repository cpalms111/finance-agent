import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { format, formatDistance } from "date-fns";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";

export default function SavingsGoals() {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    description: "",
  });

  // Fetch goals
  const { data: goals = [], refetch } = trpc.savingsGoals.list.useQuery();

  // Mutations
  const createMutation = trpc.savingsGoals.create.useMutation({
    onSuccess: () => {
      toast.success("Savings goal created");
      refetch();
      setFormData({ name: "", targetAmount: "", deadline: "", description: "" });
      setIsAddOpen(false);
    },
    onError: () => toast.error("Failed to create goal"),
  });

  const updateMutation = trpc.savingsGoals.update.useMutation({
    onSuccess: () => {
      toast.success("Goal updated");
      refetch();
    },
    onError: () => toast.error("Failed to update goal"),
  });

  const handleCreateGoal = () => {
    if (!formData.name || !formData.targetAmount) {
      toast.error("Please fill in required fields");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      targetAmount: formData.targetAmount,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      description: formData.description || undefined,
    });
  };

  const handleUpdateProgress = (goalId: number, newAmount: string) => {
    updateMutation.mutate({
      id: goalId,
      currentAmount: newAmount,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground">Track your financial targets</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
              <DialogDescription>Set a new savings target</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Goal Name *</label>
                <Input
                  placeholder="e.g., Emergency Fund"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Amount ($) *</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Date</label>
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional notes"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateGoal} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Goal"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No savings goals yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const percentage = (parseFloat(goal.currentAmount) / parseFloat(goal.targetAmount)) * 100;
            const daysRemaining = goal.deadline
              ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    {goal.name}
                  </CardTitle>
                  {goal.description && <CardDescription>{goal.description}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="font-semibold">{Math.min(percentage, 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="mt-2 text-sm text-muted-foreground">
                      ${parseFloat(goal.currentAmount).toFixed(2)} of ${parseFloat(goal.targetAmount).toFixed(2)}
                    </div>
                  </div>

                  {goal.deadline && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Target Date: </span>
                      <span className="font-medium">{format(new Date(goal.deadline), "MMM dd, yyyy")}</span>
                      {daysRemaining !== null && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {daysRemaining > 0 ? `${daysRemaining} days remaining` : "Deadline passed"}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t">
                    <label className="text-sm font-medium">Update Progress</label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Current amount"
                        defaultValue={goal.currentAmount}
                        id={`goal-${goal.id}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          const input = document.getElementById(`goal-${goal.id}`) as HTMLInputElement;
                          if (input && input.value) {
                            handleUpdateProgress(goal.id, input.value);
                          }
                        }}
                        disabled={updateMutation.isPending}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Goals Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Target</span>
                <span className="font-semibold">
                  ${goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total Saved</span>
                <span className="font-semibold">
                  ${goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="font-semibold">
                  {(
                    (goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0) /
                      goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0)) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
