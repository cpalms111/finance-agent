import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { format } from "date-fns";

export default function MonthlySummaries() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Get current month in YYYY-MM format
  const currentMonth = format(new Date(), "yyyy-MM");

  // Fetch all summaries
  const { data: summaries = [], refetch } = trpc.monthlySummaries.list.useQuery();

  // Generate summary mutation
  const generateMutation = trpc.monthlySummaries.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Summary generated for ${data.month}`);
      setSelectedMonth(data.month);
      refetch();
      setIsGenerating(false);
    },
    onError: () => {
      toast.error("Failed to generate summary");
      setIsGenerating(false);
    },
  });

  const handleGenerateSummary = async (month: string) => {
    setIsGenerating(true);
    await generateMutation.mutateAsync({ month });
  };

  const selectedSummary = summaries.find((s) => s.month === selectedMonth);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Monthly Financial Summaries</h1>
        <p className="text-muted-foreground mt-2">
          AI-generated insights into your monthly spending patterns and financial health
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Summary List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Summaries</CardTitle>
            <CardDescription>Select a month to view</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Generate current month button */}
            <Button
              variant={selectedMonth === currentMonth ? "default" : "outline"}
              className="w-full justify-start"
              onClick={() => handleGenerateSummary(currentMonth)}
              disabled={isGenerating}
            >
              {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {currentMonth} (Current)
            </Button>

            {/* Past summaries */}
            {summaries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No summaries yet. Generate one to get started!
              </p>
            ) : (
              summaries.map((summary) => (
                <Button
                  key={summary.month}
                  variant={selectedMonth === summary.month ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedMonth(summary.month)}
                >
                  {summary.month}
                </Button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Summary Details */}
        <div className="lg:col-span-2 space-y-4">
          {selectedMonth ? (
            selectedSummary ? (
              <>
                {/* Financial Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ${parseFloat(selectedSummary.totalIncome || "0").toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        ${parseFloat(selectedSummary.totalExpenses || "0").toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${parseFloat(selectedSummary.savingsAmount || "0") >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ${parseFloat(selectedSummary.savingsAmount || "0").toFixed(2)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Analysis</CardTitle>
                    <CardDescription>AI-generated insights and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <Streamdown>{selectedSummary.summary}</Streamdown>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">No summary available for {selectedMonth}</p>
                    <Button onClick={() => handleGenerateSummary(selectedMonth)} disabled={isGenerating}>
                      {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Generate Summary
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">Select a month to view or generate a summary</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            • Monthly summaries are AI-generated based on your actual income, expenses, and budget performance
          </p>
          <p>
            • Each summary includes spending patterns, budget highlights, and personalized recommendations
          </p>
          <p>
            • Summaries are generated on-demand and stored for future reference
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
