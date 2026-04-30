import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function FinancialAdvisor() {
  const [decision, setDecision] = useState("");
  const [analysis, setAnalysis] = useState<{
    verdict: "wise" | "unwise" | "neutral";
    reasoning: string;
    risks: string[];
    benefits: string[];
    recommendations: string[];
  } | null>(null);

  const analyzeMutation = trpc.advisor.analyze.useMutation({
    onSuccess: (result) => {
      setAnalysis(result);
    },
    onError: () => {
      toast.error("Failed to analyze decision. Please try again.");
    },
  });

  const handleAnalyze = () => {
    if (!decision.trim()) {
      toast.error("Please describe a financial decision");
      return;
    }

    analyzeMutation.mutate({ decision });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Advisor</h1>
        <p className="text-muted-foreground">Get AI-powered insights on your financial decisions</p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Decision</CardTitle>
          <CardDescription>Tell us about a financial decision you're considering</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Example: I'm thinking about taking out a $5,000 personal loan to pay for a vacation. I have $2,000 in savings and make $3,000/month. My current expenses are about $2,500/month."
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <Button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !decision.trim()}
            className="w-full"
            size="lg"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Get Analysis"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Verdict Card */}
          <Card
            className={`border-2 ${
              analysis.verdict === "wise"
                ? "border-green-200 bg-green-50"
                : analysis.verdict === "unwise"
                  ? "border-red-200 bg-red-50"
                  : "border-amber-200 bg-amber-50"
            }`}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                {analysis.verdict === "wise" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : analysis.verdict === "unwise" ? (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <HelpCircle className="h-6 w-6 text-amber-600" />
                )}
                <div>
                  <CardTitle
                    className={
                      analysis.verdict === "wise"
                        ? "text-green-900"
                        : analysis.verdict === "unwise"
                          ? "text-red-900"
                          : "text-amber-900"
                    }
                  >
                    {analysis.verdict === "wise"
                      ? "This appears to be a wise decision"
                      : analysis.verdict === "unwise"
                        ? "This decision carries significant risks"
                        : "This decision requires careful consideration"}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent
              className={
                analysis.verdict === "wise"
                  ? "text-green-800"
                  : analysis.verdict === "unwise"
                    ? "text-red-800"
                    : "text-amber-800"
              }
            >
              <p>{analysis.reasoning}</p>
            </CardContent>
          </Card>

          {/* Benefits */}
          {analysis.benefits.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Potential Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-700">Potential Risks</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.risks.map((risk, idx) => (
                    <li key={idx} className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-700">Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2 list-decimal list-inside">
                  {analysis.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Clear Button */}
          <Button
            variant="outline"
            onClick={() => {
              setAnalysis(null);
              setDecision("");
            }}
            className="w-full"
          >
            Analyze Another Decision
          </Button>
        </div>
      )}

      {/* Example Decisions */}
      {!analysis && (
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="text-sm">Example Decisions to Analyze</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">Try asking about:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Taking on debt (loans, credit cards)</li>
              <li>Making large purchases</li>
              <li>Investment opportunities</li>
              <li>Career changes affecting income</li>
              <li>Starting a side business</li>
              <li>Refinancing existing debt</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
