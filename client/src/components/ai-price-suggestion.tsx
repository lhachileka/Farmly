import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface PriceSuggestionProps {
  commodity: string;
  category: string;
  location: string;
  onPriceSelect?: (price: number) => void;
}

interface SuggestionData {
  suggestedPrice: number;
  priceRange: { min: number; max: number };
  marketTrend: "rising" | "falling" | "stable";
  demandLevel: "high" | "medium" | "low";
  reasoning: string;
}

export function AIPriceSuggestion({
  commodity,
  category,
  location,
  onPriceSelect,
}: PriceSuggestionProps) {
  const [suggestion, setSuggestion] = useState<SuggestionData | null>(null);

  const suggestionMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        commodity,
        category,
        location,
      });
      const res = await apiRequest("GET", `/api/ai/price-suggestion?${params}`);
      return res.json();
    },
    onSuccess: (data) => {
      setSuggestion(data);
    },
  });

  const canFetch = commodity && category && location;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "falling":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDemandBadge = (demandLevel: string) => {
    const colors = {
      high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      low: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[demandLevel as keyof typeof colors] || colors.medium}`}>
        {demandLevel} demand
      </span>
    );
  };

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Price Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!suggestion ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Get AI-powered price suggestions based on current market data and trends.
            </p>
            <Button
              data-testid="button-get-price-suggestion"
              variant="outline"
              size="sm"
              onClick={() => suggestionMutation.mutate()}
              disabled={!canFetch || suggestionMutation.isPending}
              className="w-full"
            >
              {suggestionMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing market...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Price Suggestion
                </>
              )}
            </Button>
            {!canFetch && (
              <p className="text-xs text-muted-foreground text-center">
                Fill in product name, category, and location first
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Suggested Price</span>
              <span className="text-lg font-bold text-primary">
                K{suggestion.suggestedPrice?.toLocaleString() || 0}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Range: K{suggestion.priceRange?.min?.toLocaleString() || 0} - K{suggestion.priceRange?.max?.toLocaleString() || 0}</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(suggestion.marketTrend || "stable")}
                <span className="capitalize">{suggestion.marketTrend || "stable"}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              {getDemandBadge(suggestion.demandLevel || "medium")}
            </div>

            <p className="text-xs text-muted-foreground border-t pt-2">
              {suggestion.reasoning}
            </p>

            {onPriceSelect && (
              <Button
                data-testid="button-use-suggested-price"
                size="sm"
                onClick={() => onPriceSelect(suggestion.suggestedPrice)}
                className="w-full"
              >
                Use Suggested Price
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
