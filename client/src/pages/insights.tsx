import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  MapPin, 
  AlertTriangle, 
  ArrowUpRight,
  Info,
  Loader2,
  Lock,
  Truck,
  FileText,
  Bell,
  BarChart3,
  Zap,
  Crown,
  Star
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { insightsApi, MarketInsight } from "@/lib/api";
import { format } from "date-fns";

const TIER_LABELS: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  starter: { name: "Starter", icon: <Star className="h-4 w-4" />, color: "bg-gray-100 text-gray-700" },
  growth: { name: "Growth", icon: <TrendingUp className="h-4 w-4" />, color: "bg-blue-100 text-blue-700" },
  professional: { name: "Professional", icon: <Zap className="h-4 w-4" />, color: "bg-purple-100 text-purple-700" },
  enterprise: { name: "Enterprise", icon: <Crown className="h-4 w-4" />, color: "bg-amber-100 text-amber-700" },
};

const INSIGHT_CATEGORIES = [
  { id: "market", label: "Market Intelligence", icon: BarChart3, description: "Pricing trends, demand signals, and market opportunities" },
  { id: "transport", label: "Transport Intelligence", icon: Truck, description: "Logistics insights, route optimization, and cost analysis" },
  { id: "contracts", label: "Contract Insights", icon: FileText, description: "Agreement analytics, renewal alerts, and performance metrics" },
  { id: "actions", label: "Action Feed", icon: Bell, description: "Personalized recommendations and urgent alerts" },
];

const REGIONAL_PRICES = [
  { region: "Lusaka", commodity: "Maize", price: 70, trend: "up" },
  { region: "Ndola", commodity: "Maize", price: 72, trend: "up" },
  { region: "Kitwe", commodity: "Maize", price: 68, trend: "stable" },
  { region: "Livingstone", commodity: "Maize", price: 65, trend: "down" },
];

const TIER_ORDER = ['starter', 'growth', 'professional', 'enterprise'];

function isTierLocked(requiredTier: string, userTier: string): boolean {
  const userTierIndex = TIER_ORDER.indexOf(userTier);
  const requiredTierIndex = TIER_ORDER.indexOf(requiredTier);
  return requiredTierIndex > userTierIndex;
}

function InsightCard({ insight, userTier }: { insight: MarketInsight; userTier: string }) {
  const isLocked = insight.isLocked ?? isTierLocked(insight.requiredTier, userTier);
  const tierInfo = TIER_LABELS[insight.requiredTier] || TIER_LABELS.starter;
  
  const confidenceColors = {
    low: "bg-gray-100 text-gray-600",
    medium: "bg-blue-100 text-blue-600",
    high: "bg-green-100 text-green-600",
  };
  
  const urgencyBorder = insight.urgencyScore >= 70 
    ? "border-l-red-500" 
    : insight.urgencyScore >= 40 
    ? "border-l-amber-500" 
    : "border-l-blue-500";

  return (
    <Card className={`border-l-4 ${urgencyBorder} transition-all hover:shadow-md ${isLocked ? 'opacity-75' : ''}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg">{insight.title}</h3>
            {isLocked && <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
          <div className="flex gap-2">
            <Badge className={confidenceColors[insight.confidence]}>
              {insight.confidence}
            </Badge>
            <Badge variant="outline" className={tierInfo.color}>
              {tierInfo.icon}
              <span className="ml-1">{tierInfo.name}</span>
            </Badge>
          </div>
        </div>
        
        {isLocked ? (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Upgrade to {tierInfo.name} tier to unlock this insight
            </p>
            <Button size="sm" variant="secondary">
              Upgrade Now
            </Button>
          </div>
        ) : (
          <>
            <p className="text-muted-foreground text-sm mb-3">{insight.summary}</p>
            
            {insight.financialImpact && (
              <div className="bg-green-50 dark:bg-green-950/30 rounded-md p-2 mb-3">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Potential Impact: {insight.financialImpact}
                </span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3">
              {insight.relatedLocation && (
                <Badge variant="outline" className="gap-1">
                  <MapPin className="h-3 w-3" /> {insight.relatedLocation}
                </Badge>
              )}
              {insight.urgencyScore >= 70 && (
                <Badge className="bg-red-100 text-red-700 gap-1">
                  <AlertTriangle className="h-3 w-3" /> Urgent
                </Badge>
              )}
            </div>
            
            {insight.actionLabel && (
              <div className="flex gap-2">
                <Button size="sm" className="h-8">
                  {insight.actionLabel}
                </Button>
                <Button size="sm" variant="outline" className="h-8">
                  Learn More
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InsightsSection({ 
  category, 
  insights, 
  userTier,
  isLoading 
}: { 
  category: typeof INSIGHT_CATEGORIES[0];
  insights: MarketInsight[];
  userTier: string;
  isLoading: boolean;
}) {
  const filteredInsights = insights.filter(i => i.category === category.id);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (filteredInsights.length === 0) {
    return (
      <div className="text-center py-12">
        <category.icon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-medium text-lg mb-2">No {category.label} Available</h3>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {category.description}. Check back soon for new insights tailored to your business.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4">
      {filteredInsights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} userTier={userTier} />
      ))}
    </div>
  );
}

export default function Insights() {
  const [selectedRegion, setSelectedRegion] = useState("Lusaka");
  const [selectedDays, setSelectedDays] = useState(7);
  const [activeTab, setActiveTab] = useState("market");

  const { data: tomatoHistory = [] } = useQuery({
    queryKey: ["/api/insights/price-history", "Tomatoes", selectedRegion, selectedDays],
    queryFn: () => insightsApi.getPriceHistory("Tomatoes", selectedRegion, selectedDays),
  });

  const { data: maizeHistory = [] } = useQuery({
    queryKey: ["/api/insights/price-history", "Maize", selectedRegion, selectedDays],
    queryFn: () => insightsApi.getPriceHistory("Maize", selectedRegion, selectedDays),
  });

  const { data: cabbageHistory = [] } = useQuery({
    queryKey: ["/api/insights/price-history", "Cabbage", selectedRegion, selectedDays],
    queryFn: () => insightsApi.getPriceHistory("Cabbage", selectedRegion, selectedDays),
  });

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ["/api/insights"],
    queryFn: () => insightsApi.getMarketInsights(),
  });

  const { data: subscriptionData } = useQuery({
    queryKey: ["/api/subscription"],
    queryFn: () => insightsApi.getSubscription(),
  });

  const insights = insightsData?.insights || [];
  const userTier = subscriptionData?.effectiveTier || "starter";

  const chartData = useMemo(() => {
    const allDates = new Set([
      ...tomatoHistory.map(h => h.recordedAt),
      ...maizeHistory.map(h => h.recordedAt),
      ...cabbageHistory.map(h => h.recordedAt),
    ]);

    return Array.from(allDates)
      .sort()
      .slice(-selectedDays)
      .map(date => {
        const tomato = tomatoHistory.find(h => h.recordedAt === date);
        const maize = maizeHistory.find(h => h.recordedAt === date);
        const cabbage = cabbageHistory.find(h => h.recordedAt === date);
        
        return {
          date: format(new Date(date), "MMM dd"),
          tomato: tomato?.price || 0,
          maize: maize?.price || 0,
          cabbage: cabbage?.price || 0,
        };
      });
  }, [tomatoHistory, maizeHistory, cabbageHistory, selectedDays]);

  const currentPrices = useMemo(() => {
    const latestTomato = tomatoHistory[tomatoHistory.length - 1];
    const latestMaize = maizeHistory[maizeHistory.length - 1];
    const latestCabbage = cabbageHistory[cabbageHistory.length - 1];

    const calculateTrend = (history: typeof tomatoHistory): number => {
      if (history.length < 2) return 0;
      const current = history[history.length - 1].price;
      const previous = history[history.length - 2].price;
      return parseFloat(((current - previous) / previous * 100).toFixed(1));
    };

    return {
      tomato: { price: latestTomato?.price || 0, trend: calculateTrend(tomatoHistory) },
      maize: { price: latestMaize?.price || 0, trend: calculateTrend(maizeHistory) },
      cabbage: { price: latestCabbage?.price || 0, trend: calculateTrend(cabbageHistory) },
    };
  }, [tomatoHistory, maizeHistory, cabbageHistory]);

  const tierInfo = TIER_LABELS[userTier] || TIER_LABELS.starter;

  return (
    <Layout>
      <div className="bg-muted/30 py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">Business Intelligence</h1>
              <p className="text-muted-foreground text-lg">Real-time insights, trends, and personalized recommendations.</p>
            </div>
            <div className="flex gap-2 items-center">
              <Badge className={`${tierInfo.color} gap-1 px-3 py-1`}>
                {tierInfo.icon}
                <span>{tierInfo.name} Tier</span>
              </Badge>
              <Button variant="outline" className="gap-2">
                <MapPin className="h-4 w-4" /> {selectedRegion}
              </Button>
              <Button>Upgrade Plan</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-green-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Maize (per kg)</div>
                    <div className="text-2xl font-bold">K {currentPrices.maize.price}</div>
                  </div>
                  <Badge className={`${
                    currentPrices.maize.trend > 0 ? 'bg-green-100 text-green-700' : 
                    currentPrices.maize.trend < 0 ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  } hover:bg-current border-none flex gap-1`}>
                    {currentPrices.maize.trend > 0 ? <TrendingUp className="h-3 w-3" /> : 
                     currentPrices.maize.trend < 0 ? <TrendingDown className="h-3 w-3" /> : 
                     <Minus className="h-3 w-3" />}
                    {currentPrices.maize.trend > 0 ? '+' : ''}{currentPrices.maize.trend}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">Avg. price in {selectedRegion} today</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Tomatoes (per kg)</div>
                    <div className="text-2xl font-bold">K {currentPrices.tomato.price}</div>
                  </div>
                  <Badge className={`${
                    currentPrices.tomato.trend > 0 ? 'bg-green-100 text-green-700' : 
                    currentPrices.tomato.trend < 0 ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  } hover:bg-current border-none flex gap-1`}>
                    {currentPrices.tomato.trend > 0 ? <TrendingUp className="h-3 w-3" /> : 
                     currentPrices.tomato.trend < 0 ? <TrendingDown className="h-3 w-3" /> : 
                     <Minus className="h-3 w-3" />}
                    {currentPrices.tomato.trend > 0 ? '+' : ''}{currentPrices.tomato.trend}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{selectedRegion} market price</div>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Cabbage (per kg)</div>
                    <div className="text-2xl font-bold">K {currentPrices.cabbage.price}</div>
                  </div>
                  <Badge className={`${
                    currentPrices.cabbage.trend > 0 ? 'bg-green-100 text-green-700' : 
                    currentPrices.cabbage.trend < 0 ? 'bg-red-100 text-red-700' : 
                    'bg-gray-100 text-gray-700'
                  } hover:bg-current border-none flex gap-1`}>
                    {currentPrices.cabbage.trend > 0 ? <TrendingUp className="h-3 w-3" /> : 
                     currentPrices.cabbage.trend < 0 ? <TrendingDown className="h-3 w-3" /> : 
                     <Minus className="h-3 w-3" />}
                    {currentPrices.cabbage.trend > 0 ? '+' : ''}{currentPrices.cabbage.trend}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{selectedRegion} market price</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full max-w-2xl mx-auto">
            {INSIGHT_CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2" data-testid={`tab-${cat.id}`}>
                <cat.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className="sm:hidden">{cat.label.split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {INSIGHT_CATEGORIES.map((cat) => (
                <TabsContent key={cat.id} value={cat.id} className="mt-0">
                  <div className="mb-6">
                    <h2 className="font-heading text-2xl font-bold flex items-center gap-2">
                      <cat.icon className="h-6 w-6" /> {cat.label}
                    </h2>
                    <p className="text-muted-foreground">{cat.description}</p>
                  </div>
                  <InsightsSection 
                    category={cat} 
                    insights={insights} 
                    userTier={userTier}
                    isLoading={insightsLoading}
                  />
                </TabsContent>
              ))}

              {activeTab === "market" && (
                <Card>
                  <CardHeader>
                    <CardTitle>7-Day Price Trends</CardTitle>
                    <CardDescription>Comparative pricing for key commodities (Kwacha).</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMaize" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorTomato" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCabbage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Area type="monotone" dataKey="maize" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorMaize)" name="Maize (K/kg)" />
                        <Area type="monotone" dataKey="tomato" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTomato)" name="Tomato (K/kg)" />
                        <Area type="monotone" dataKey="cabbage" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCabbage)" name="Cabbage (K/kg)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Subscription</CardTitle>
                  <CardDescription>Current plan and access level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`rounded-lg p-4 mb-4 ${tierInfo.color}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {tierInfo.icon}
                      <span className="font-bold text-lg">{tierInfo.name}</span>
                    </div>
                    <p className="text-sm opacity-80">
                      {userTier === 'starter' && 'Basic market insights and price tracking'}
                      {userTier === 'growth' && 'Enhanced analytics with transport intelligence'}
                      {userTier === 'professional' && 'Full analytics suite with contract insights'}
                      {userTier === 'enterprise' && 'Complete platform access with custom reports'}
                    </p>
                  </div>
                  <Button className="w-full" variant="outline">
                    Compare Plans
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Regional Averages</CardTitle>
                  <CardDescription>Maize (50kg) prices by province.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {REGIONAL_PRICES.map((item, idx) => (
                      <div key={idx} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {item.region.charAt(0)}
                           </div>
                           <div className="font-medium">{item.region}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">K {item.price}</div>
                          <div className={`text-xs flex items-center justify-end gap-1 ${
                            item.trend === 'up' ? 'text-red-500' : item.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'
                          }`}>
                            {item.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : 
                             item.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : 
                             <Minus className="h-3 w-3" />}
                            {item.trend === 'up' ? 'Rising' : item.trend === 'down' ? 'Falling' : 'Stable'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-6">
                  <Info className="h-8 w-8 mb-4 opacity-80" />
                  <h3 className="font-bold text-xl mb-2">Did you know?</h3>
                  <p className="opacity-90 mb-4 text-balance">
                    Producers who use data to time their sales earn an average of 22% more per season.
                  </p>
                  <Button variant="secondary" className="w-full font-bold">
                    Get Premium Insights
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </Layout>
  );
}
