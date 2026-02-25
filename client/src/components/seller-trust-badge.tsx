import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, ShieldCheck, ShieldAlert, Star, TrendingUp, Award } from "lucide-react";
import { gradesApi } from "@/lib/api";

interface SellerTrustBadgeProps {
  sellerId: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export function SellerTrustBadge({ sellerId, showDetails = false, size = "md" }: SellerTrustBadgeProps) {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/grades/trust", sellerId],
    queryFn: () => gradesApi.getSellerTrustMetrics(sellerId),
    enabled: !!sellerId,
  });

  if (isLoading || !metrics) {
    return null;
  }

  const trustScore = metrics.trustScore || 50;
  const accuracyRate = metrics.gradeAccuracyRate ? parseFloat(metrics.gradeAccuracyRate) * 100 : 0;
  const totalDeliveries = metrics.totalDeliveries || 0;

  const getTrustLevel = () => {
    if (trustScore >= 80) return { level: "Trusted", color: "bg-green-500", icon: ShieldCheck };
    if (trustScore >= 50) return { level: "Standard", color: "bg-yellow-500", icon: Shield };
    return { level: "Caution", color: "bg-red-500", icon: ShieldAlert };
  };

  const { level, color, icon: TrustIcon } = getTrustLevel();

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };

  const iconSize = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`${color} text-white ${sizeClasses[size]} cursor-help`}>
              <TrustIcon className={`${iconSize[size]} mr-1`} />
              {level}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-2">
              <div className="font-semibold">Seller Trust Score: {trustScore}/100</div>
              <div className="text-sm">
                <div>Grade Accuracy: {accuracyRate.toFixed(0)}%</div>
                <div>Deliveries: {totalDeliveries}</div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrustIcon className={`h-5 w-5 ${trustScore >= 80 ? "text-green-500" : trustScore >= 50 ? "text-yellow-500" : "text-red-500"}`} />
          <span className="font-semibold">Seller Trust</span>
        </div>
        <Badge className={`${color} text-white`}>{level}</Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Trust Score</span>
          <span className="font-medium">{trustScore}/100</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              trustScore >= 80 ? "bg-green-500" : trustScore >= 50 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${trustScore}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-bold">{totalDeliveries}</div>
          <div className="text-xs text-muted-foreground">Deliveries</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-bold">{accuracyRate.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">Accuracy</div>
        </div>
        <div className="p-2 bg-muted/50 rounded">
          <div className="text-lg font-bold">{metrics.gradeMatchCount || 0}</div>
          <div className="text-xs text-muted-foreground">Matches</div>
        </div>
      </div>

      {metrics.isContractEligible && (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <Award className="h-4 w-4" />
          <span>Eligible for contracts</span>
        </div>
      )}

      {!metrics.isSubscriptionVisible && (
        <div className="flex items-center gap-2 text-sm text-red-500">
          <ShieldAlert className="h-4 w-4" />
          <span>Hidden from subscriptions (low trust)</span>
        </div>
      )}
    </div>
  );
}
