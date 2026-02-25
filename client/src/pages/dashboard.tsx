import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Truck, 
  Edit,
  Trash2,
  Loader2,
  Shield,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Users,
  MessageCircle,
  ArrowRight,
  Bell,
  Wallet,
  Calendar,
  Star,
  Lightbulb,
  Activity,
  Eye,
  BarChart3,
  Target,
  TrendingDown,
  Send,
  ThumbsUp
} from "lucide-react";
import { authApi, listingsApi, bidsApi, ordersApi, contractsApi, coopsApi, subscriptionsApi, forecastsApi, transportJobsApi, type Listing, type User, type Order, type DemandForecast, type ForecastResponse, type TransportJob, type TransportOffer } from "@/lib/api";
import { CheckCircle, Clock, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  if (userLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-8 bg-muted animate-pulse rounded w-20" />
                <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // Show guest dashboard if not logged in
  if (!currentUser) {
    return (
      <Layout>
        <div className="bg-muted/30 border-b py-8">
          <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground">Sign in to access your personal dashboard</p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <GuestDashboard />
        </div>
      </Layout>
    );
  }

  // Admin users should use /admin - redirect them
  if (currentUser.role === "admin") {
    setLocation("/admin");
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Redirecting to admin panel...</span>
        </div>
      </Layout>
    );
  }

  const isFarmer = currentUser.role === "farmer";

  return (
    <Layout>
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20">
                {currentUser.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold flex items-center gap-2">
                  Welcome, {currentUser.name}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="secondary" className="capitalize">
                    {currentUser.role === "farmer" && <Package className="h-3 w-3 mr-1" />}
                    {currentUser.role === "buyer" && <ShoppingBag className="h-3 w-3 mr-1" />}
                    {currentUser.role === "transporter" && <Truck className="h-3 w-3 mr-1" />}
                    {currentUser.role}
                  </Badge>
                  {currentUser.verified ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200">
                      <ShieldCheck className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Unverified
                    </Badge>
                  )}
                  <Badge variant="outline" className="hidden sm:flex">
                    <Star className="h-3 w-3 mr-1 text-amber-500" /> Trust: {(currentUser as any).trustScore || 50}/100
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isFarmer && (
                <Button size="sm" className="gap-2" asChild>
                  <Link href="/dashboard#listings">
                    <Plus className="h-4 w-4" /> New Listing
                  </Link>
                </Button>
              )}
              <Button size="sm" variant="outline" className="gap-2" asChild>
                <Link href="/messages">
                  <MessageCircle className="h-4 w-4" /> Messages
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {currentUser.role === "transporter" ? (
          <TransporterDashboard user={currentUser} />
        ) : isFarmer ? (
          <FarmerDashboard user={currentUser} />
        ) : (
          <BuyerDashboard user={currentUser} />
        )}
      </div>
    </Layout>
  );
}

function GuestDashboard() {
  const { data: listings = [] } = useQuery({
    queryKey: ["/api/listings"],
    queryFn: () => listingsApi.getAll({}),
  });

  const activeListings = listings.filter(l => l.status === "active").slice(0, 6);

  return (
    <div className="space-y-8">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-8 text-center">
          <h2 className="font-heading text-2xl font-bold mb-2">Welcome to Farmly</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Create an account to list your produce, make bids, manage your cart, and access all platform features.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <a href="/auth">Create Account</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/marketplace">Browse Listings</a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="font-heading text-xl font-semibold mb-4">Recent Listings</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-muted relative">
                {listing.images?.[0] && (
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                )}
                <Badge className="absolute top-2 right-2 capitalize">{listing.category}</Badge>
              </div>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-1">{listing.title}</h4>
                <p className="text-primary font-bold">K{listing.price}/{listing.unit}</p>
                <p className="text-sm text-muted-foreground mt-1">{listing.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {activeListings.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No listings available yet.</p>
        )}
      </div>
    </div>
  );
}

function FarmerDashboard({ user }: { user: User }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showProtectionTip, setShowProtectionTip] = useState(() => {
    return localStorage.getItem("farmly_protection_tip_dismissed") !== "true";
  });
  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [selectedForecast, setSelectedForecast] = useState<DemandForecast | null>(null);
  const [responseData, setResponseData] = useState({ indicativeQuantity: 0, proposedPrice: 0, message: "" });
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const dismissProtectionTip = () => {
    localStorage.setItem("farmly_protection_tip_dismissed", "true");
    setShowProtectionTip(false);
  };

  const { data: availableForecasts = [] } = useQuery({
    queryKey: ["/api/forecasts/available"],
    queryFn: () => forecastsApi.getAvailableForecasts(),
  });

  const respondToForecastMutation = useMutation({
    mutationFn: ({ forecastId, data }: { forecastId: string; data: typeof responseData }) => 
      forecastsApi.respond(forecastId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts/available"] });
      setRespondDialogOpen(false);
      setSelectedForecast(null);
      setResponseData({ indicativeQuantity: 0, proposedPrice: 0, message: "" });
      toast({ title: "Response sent! The buyer will be notified." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to send response", variant: "destructive" });
    },
  });

  const { data: myListings = [], isLoading } = useQuery({
    queryKey: ["/api/listings", { sellerId: user.id }],
    queryFn: () => listingsApi.getAll({ sellerId: user.id }),
  });

  const { data: sellerOrders = [] } = useQuery({
    queryKey: ["/api/orders", "seller"],
    queryFn: () => ordersApi.getAll("seller"),
  });

  const { data: contractsData } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: () => contractsApi.getAll(),
  });
  const contracts = [...(contractsData?.asBuyer || []), ...(contractsData?.asSeller || [])];

  const { data: coops = [] } = useQuery({
    queryKey: ["/api/coops"],
    queryFn: () => coopsApi.getAll(),
  });

  const pendingOrders = sellerOrders.filter(o => o.status === "paid");
  const shippedOrders = sellerOrders.filter(o => o.status === "shipped");
  const completedOrders = sellerOrders.filter(o => o.status === "completed");
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => listingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
      toast({ title: "Listing deleted" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete listing", variant: "destructive" });
    },
  });

  const shipMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.markShipped(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order marked as shipped!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      disputed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  const activeListings = myListings.filter(l => l.status === "active");
  const soldListings = myListings.filter(l => l.status === "sold");
  const activePercentage = myListings.length > 0 ? Math.round((activeListings.length / myListings.length) * 100) : 0;
  
  const expiringContracts = contracts.filter((c: any) => {
    const endDate = new Date(c.endDate);
    const daysUntilEnd = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd <= 7 && daysUntilEnd > 0;
  });

  const pendingCoopContributions = coops.filter((c: any) => 
    c.status === "forming" && c.members?.some((m: any) => m.userId === user.id && !m.isReady)
  );

  const needsAttention = pendingOrders.length > 0 || expiringContracts.length > 0 || pendingCoopContributions.length > 0;

  return (
    <div className="space-y-6">
      {showProtectionTip && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-300">Stay protected with Farmly!</span>
              <span className="text-blue-700 dark:text-blue-400"> All transactions made through our platform are covered by escrow protection. Off-app deals are at your own risk and not covered.</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={dismissProtectionTip}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {needsAttention && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Bell className="h-4 w-4" /> Needs Your Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {pendingOrders.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-background border">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{pendingOrders.length} order{pendingOrders.length > 1 ? "s" : ""} waiting to be shipped</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => document.getElementById("orders-section")?.scrollIntoView({ behavior: "smooth" })}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {expiringContracts.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-background border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{expiringContracts.length} contract{expiringContracts.length > 1 ? "s" : ""} expiring soon</span>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/contracts"><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              )}
              {pendingCoopContributions.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-background border">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Co-Op participation incomplete</span>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/coops"><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" })}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                <Package className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs">{activePercentage}% active</Badge>
            </div>
            <div className="text-2xl font-bold">{myListings.length}</div>
            <div className="text-sm text-muted-foreground">Total Listings</div>
            <Progress value={activePercentage} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/orders")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-600">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs">{pendingOrders.length} pending</Badge>
            </div>
            <div className="text-2xl font-bold">{sellerOrders.length}</div>
            <div className="text-sm text-muted-foreground">Orders Received</div>
            <div className="flex gap-1 mt-2">
              <div className="h-1.5 flex-1 bg-green-500 rounded-full" style={{ flex: completedOrders.length || 1 }} />
              <div className="h-1.5 flex-1 bg-blue-500 rounded-full" style={{ flex: pendingOrders.length || 0 }} />
              <div className="h-1.5 flex-1 bg-amber-500 rounded-full" style={{ flex: shippedOrders.length || 0 }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-green-500/10 rounded-lg text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" /> This week
              </Badge>
            </div>
            <div className="text-2xl font-bold">K{totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Earnings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold">{user.rating || "0.0"}</div>
            <div className="text-sm text-muted-foreground">Your Rating</div>
            <div className="flex items-center gap-1 mt-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(parseFloat(user.rating || "0")) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {activeListings.length > 0 && myListings.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              {pendingOrders.length === 0 && activeListings.length < 3 && (
                <span><strong>Tip:</strong> Add more listings to increase visibility and attract more buyers.</span>
              )}
              {pendingOrders.length > 3 && (
                <span><strong>Great job!</strong> You have high demand. Consider joining a Co-Op to fulfill larger orders.</span>
              )}
              {pendingOrders.length === 0 && activeListings.length >= 3 && (
                <span><strong>Looking good!</strong> Your listings are active. Consider updating prices based on market trends.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {availableForecasts.length > 0 && (
        <div id="buyer-requests-section">
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Buyer Demand Requests
            <Badge variant="secondary">{availableForecasts.length}</Badge>
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Buyers are looking for these products. Respond with your availability and pricing to secure future orders.
          </p>
          <div className="space-y-3">
            {availableForecasts.slice(0, 5).map((forecast: DemandForecast & { buyer: User; responses: ForecastResponse[] }) => {
              const myResponse = forecast.responses?.find((r: ForecastResponse) => r.sellerId === user.id);
              return (
                <Card key={forecast.id} className="border-primary/20" data-testid={`buyer-request-${forecast.id}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{forecast.productName}</span>
                          <Badge variant="outline" className="text-xs">{forecast.category}</Badge>
                          {forecast.preferredGrade && (
                            <Badge className="bg-amber-100 text-amber-800 text-xs">Grade {forecast.preferredGrade}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <strong>{forecast.quantity} {forecast.unit}</strong>
                          {forecast.frequency !== "one_off" ? ` ${forecast.frequency}` : " (one-time)"} • {forecast.location}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Needed: {new Date(forecast.startDate).toLocaleDateString()} - {new Date(forecast.endDate).toLocaleDateString()}
                          {forecast.targetPrice ? ` • Target: K${forecast.targetPrice}/${forecast.unit}` : ""}
                        </p>
                        {forecast.buyer && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Users className="h-3 w-3" /> {forecast.buyer.name} • {forecast.buyer.location}
                            {forecast.buyer.verified && <ShieldCheck className="h-3 w-3 text-green-500" />}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {myResponse ? (
                          <div>
                            <Badge className={myResponse.status === "accepted" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                              {myResponse.status === "accepted" ? "Accepted!" : "Responded"}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              K{myResponse.proposedPrice}/{forecast.unit}
                            </p>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedForecast(forecast);
                              setResponseData({ 
                                indicativeQuantity: Math.min(forecast.quantity, 100), 
                                proposedPrice: forecast.targetPrice || 50, 
                                message: "" 
                              });
                              setRespondDialogOpen(true);
                            }}
                            data-testid={`button-respond-forecast-${forecast.id}`}
                          >
                            <Send className="h-4 w-4 mr-1" /> Respond
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Buyer Request</DialogTitle>
            <DialogDescription>
              {selectedForecast && (
                <>Submit your indicative pricing for <strong>{selectedForecast.productName}</strong> ({selectedForecast.quantity} {selectedForecast.unit})</>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedForecast && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="indicativeQuantity">Quantity You Can Supply ({selectedForecast.unit})</Label>
                  <Input
                    id="indicativeQuantity"
                    type="number"
                    value={responseData.indicativeQuantity}
                    onChange={(e) => setResponseData({ ...responseData, indicativeQuantity: parseInt(e.target.value) || 0 })}
                    max={selectedForecast.quantity}
                    data-testid="input-response-quantity"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proposedPrice">Your Price (K/{selectedForecast.unit})</Label>
                  <Input
                    id="proposedPrice"
                    type="number"
                    value={responseData.proposedPrice}
                    onChange={(e) => setResponseData({ ...responseData, proposedPrice: parseFloat(e.target.value) || 0 })}
                    data-testid="input-response-price"
                  />
                </div>
              </div>
              {selectedForecast.targetPrice && responseData.proposedPrice > selectedForecast.targetPrice && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Your price is above the buyer's target of K{selectedForecast.targetPrice}/{selectedForecast.unit}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="message">Message to Buyer (Optional)</Label>
                <Textarea
                  id="message"
                  value={responseData.message}
                  onChange={(e) => setResponseData({ ...responseData, message: e.target.value })}
                  placeholder="e.g., Fresh harvest available from our farm..."
                  data-testid="input-response-message"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => selectedForecast && respondToForecastMutation.mutate({ forecastId: selectedForecast.id, data: responseData })}
                disabled={!responseData.indicativeQuantity || !responseData.proposedPrice || respondToForecastMutation.isPending}
                data-testid="button-submit-response"
              >
                {respondToForecastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                Send Response
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {pendingOrders.length > 0 && (
        <div id="orders-section">
          <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Orders to Fulfill
            <Badge variant="secondary">{pendingOrders.length}</Badge>
          </h2>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <Card key={order.id} className="border-primary/20" data-testid={`seller-order-${order.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()} - {order.deliveryAddress.slice(0, 40)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-primary">K{order.total.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Payment received</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => shipMutation.mutate(order.id)}
                        disabled={shipMutation.isPending}
                        data-testid={`button-ship-${order.id}`}
                      >
                        {shipMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark Shipped"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <TransportTrackingSection userId={user.id} role="seller" />

      <div className="space-y-6" id="listings-section">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl font-bold">My Listings</h2>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2" data-testid="button-add-listing">
                <Plus className="h-4 w-4" /> Add New Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Listing</DialogTitle>
                <DialogDescription>Add a new product listing to the marketplace</DialogDescription>
              </DialogHeader>
              <ListingForm 
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
                }} 
              />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
                <div className="h-32 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : myListings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              You don't have any listings yet. Click "Add New Listing" to create one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myListings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden" data-testid={`listing-card-${listing.id}`}>
                <div className="flex flex-col sm:flex-row gap-4 p-4">
                  <img 
                    src={listing.images[0] || "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=200"} 
                    alt={listing.title} 
                    className="w-full sm:w-24 h-24 object-cover rounded-md" 
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{listing.title}</h3>
                        <div className="text-sm text-muted-foreground">Stock: {listing.quantity} {listing.unit}s</div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          listing.status === "active" 
                            ? "bg-green-500/10 text-green-700 border-green-200" 
                            : listing.status === "sold"
                            ? "bg-blue-500/10 text-blue-700 border-blue-200"
                            : "bg-gray-500/10 text-gray-700 border-gray-200"
                        }
                      >
                        {listing.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="font-bold text-primary">
                        K{listing.price} <span className="text-xs font-normal text-muted-foreground">/ {listing.unit}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingListing(listing);
                            setEditDialogOpen(true);
                          }}
                          data-testid={`button-edit-${listing.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(listing.id)}
                          data-testid={`button-delete-${listing.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Listing</DialogTitle>
            <DialogDescription>Update your product listing details</DialogDescription>
          </DialogHeader>
          {editingListing && (
            <ListingForm 
              listing={editingListing}
              onSuccess={() => {
                setEditDialogOpen(false);
                setEditingListing(null);
                queryClient.invalidateQueries({ queryKey: ["/api/listings"] });
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListingForm({ listing, onSuccess }: { listing?: Listing; onSuccess: () => void }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: listing?.title || "",
    description: listing?.description || "",
    category: listing?.category || "produce",
    grade: (listing as any)?.grade || "B",
    price: listing?.price?.toString() || "",
    unit: listing?.unit || "kg",
    quantity: listing?.quantity?.toString() || "",
    minOrder: listing?.minOrder?.toString() || "",
    location: listing?.location || "",
    harvestDate: listing?.harvestDate || "",
    organic: listing?.organic || false,
    images: listing?.images || [],
    status: listing?.status || "active",
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => listingsApi.create(data),
    onSuccess: () => {
      toast({ title: "Listing created successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create listing", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => listingsApi.update(listing!.id, data),
    onSuccess: () => {
      toast({ title: "Listing updated successfully" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update listing", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      price: parseInt(formData.price),
      quantity: parseInt(formData.quantity),
      minOrder: parseInt(formData.minOrder),
      images: formData.images.length > 0 ? formData.images : ["https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800"],
    };
    
    if (listing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Fresh Tomatoes"
            required
            data-testid="input-title"
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your product..."
            required
            data-testid="input-description"
          />
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select 
            value={formData.category} 
            onValueChange={(v) => setFormData({ ...formData, category: v as any })}
          >
            <SelectTrigger data-testid="select-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="produce">Produce</SelectItem>
              <SelectItem value="livestock">Livestock</SelectItem>
              <SelectItem value="grains">Grains</SelectItem>
              <SelectItem value="processed">Processed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="grade">Quality Grade</Label>
          <Select 
            value={formData.grade} 
            onValueChange={(v) => setFormData({ ...formData, grade: v })}
          >
            <SelectTrigger data-testid="select-grade">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Grade A - Premium</SelectItem>
              <SelectItem value="B">Grade B - Standard</SelectItem>
              <SelectItem value="C">Grade C - Economy</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            <a href="/grade-standards" target="_blank" className="text-primary hover:underline">View grade standards</a>
          </p>
        </div>

        <div>
          <Label htmlFor="location">Location</Label>
          <Select 
            value={formData.location} 
            onValueChange={(v) => setFormData({ ...formData, location: v })}
          >
            <SelectTrigger data-testid="select-location">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Lusaka">Lusaka</SelectItem>
              <SelectItem value="Ndola">Ndola</SelectItem>
              <SelectItem value="Kitwe">Kitwe</SelectItem>
              <SelectItem value="Kabwe">Kabwe</SelectItem>
              <SelectItem value="Livingstone">Livingstone</SelectItem>
              <SelectItem value="Chipata">Chipata</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price">Price (K)</Label>
          <Input 
            id="price"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="100"
            required
            data-testid="input-price"
          />
        </div>

        <div>
          <Label htmlFor="unit">Unit</Label>
          <Select 
            value={formData.unit} 
            onValueChange={(v) => setFormData({ ...formData, unit: v })}
          >
            <SelectTrigger data-testid="select-unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kg">kg</SelectItem>
              <SelectItem value="ton">ton</SelectItem>
              <SelectItem value="bag">bag</SelectItem>
              <SelectItem value="crate">crate</SelectItem>
              <SelectItem value="head">head</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="quantity">Available Quantity</Label>
          <Input 
            id="quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="500"
            required
            data-testid="input-quantity"
          />
        </div>

        <div>
          <Label htmlFor="minOrder">Minimum Order</Label>
          <Input 
            id="minOrder"
            type="number"
            value={formData.minOrder}
            onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
            placeholder="50"
            required
            data-testid="input-min-order"
          />
        </div>

        <div>
          <Label htmlFor="harvestDate">Harvest Date</Label>
          <Input 
            id="harvestDate"
            value={formData.harvestDate}
            onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
            placeholder="January 2026"
            required
            data-testid="input-harvest-date"
          />
        </div>

        <div className="flex items-center gap-3 pt-6">
          <Switch 
            id="organic"
            checked={formData.organic}
            onCheckedChange={(checked) => setFormData({ ...formData, organic: checked })}
            data-testid="switch-organic"
          />
          <Label htmlFor="organic">Organic Certified</Label>
        </div>

        <div className="col-span-2">
          <Label>Product Images (max 3)</Label>
          <div className="space-y-2 mt-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Image URL ${index + 1}`}
                  value={formData.images[index] || ""}
                  onChange={(e) => {
                    const newImages = [...formData.images];
                    if (e.target.value) {
                      newImages[index] = e.target.value;
                    } else {
                      newImages.splice(index, 1);
                    }
                    setFormData({ ...formData, images: newImages.filter(Boolean) });
                  }}
                  data-testid={`input-image-${index}`}
                />
                {formData.images[index] && (
                  <img 
                    src={formData.images[index]} 
                    alt={`Preview ${index + 1}`}
                    className="h-9 w-9 rounded object-cover border"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Enter image URLs for your product photos. Leave empty for a default image.
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-listing">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {listing ? "Update Listing" : "Create Listing"}
      </Button>
    </form>
  );
}

function BuyerDashboard({ user }: { user: User }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showProtectionTip, setShowProtectionTip] = useState(() => {
    return localStorage.getItem("farmly_buyer_protection_tip_dismissed") !== "true";
  });
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false);
  const [newForecast, setNewForecast] = useState({
    productName: "",
    category: "produce" as string,
    quantity: 100,
    unit: "kg",
    frequency: "monthly" as string,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    preferredGrade: "" as string,
    targetPrice: 0,
    location: user.location || "Lusaka",
    notes: ""
  });

  const dismissProtectionTip = () => {
    localStorage.setItem("farmly_buyer_protection_tip_dismissed", "true");
    setShowProtectionTip(false);
  };

  const { data: myForecasts = [] } = useQuery({
    queryKey: ["/api/forecasts/my"],
    queryFn: () => forecastsApi.getMyForecasts(),
  });

  const createForecastMutation = useMutation({
    mutationFn: (data: typeof newForecast) => forecastsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts/my"] });
      setForecastDialogOpen(false);
      setNewForecast({
        productName: "",
        category: "produce",
        quantity: 100,
        unit: "kg",
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        preferredGrade: "",
        targetPrice: 0,
        location: user.location || "Lusaka",
        notes: ""
      });
      toast({ title: "Demand forecast posted! Producers can now respond with offers." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create forecast", variant: "destructive" });
    },
  });

  const acceptResponseMutation = useMutation({
    mutationFn: (responseId: string) => forecastsApi.acceptResponse(responseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts/my"] });
      toast({ title: "Response accepted! Contact the producer to finalize." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to accept response", variant: "destructive" });
    },
  });

  const convertForecastMutation = useMutation({
    mutationFn: ({ forecastId, data }: { forecastId: string; data: { conversionType: string; responseId: string; referenceId: string; quantity: number } }) => 
      forecastsApi.convert(forecastId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forecasts/my"] });
      const typeMap: Record<string, string> = {
        subscription: "Subscription created! Redirecting...",
        contract: "Contract initiated! Redirecting...",
        order: "Order placed!",
        coop: "Co-Op request created!"
      };
      toast({ title: typeMap[variables.data.conversionType] || "Conversion successful!" });
      
      // Navigate after successful conversion
      const routeMap: Record<string, string> = {
        subscription: "/subscriptions",
        contract: "/contracts",
        coop: "/coops"
      };
      const route = routeMap[variables.data.conversionType];
      if (route) {
        setLocation(route);
      }
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to convert forecast. Please try again.", variant: "destructive" });
    },
  });

  const { data: allListings = [] } = useQuery({
    queryKey: ["/api/listings"],
    queryFn: () => listingsApi.getAll(),
  });

  const { data: buyerOrders = [] } = useQuery({
    queryKey: ["/api/orders", "buyer"],
    queryFn: () => ordersApi.getAll("buyer"),
  });

  const { data: contractsData } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: () => contractsApi.getAll(),
  });
  const contracts = [...(contractsData?.asBuyer || []), ...(contractsData?.asSeller || [])];

  const { data: subscriptionsData } = useQuery({
    queryKey: ["/api/subscriptions"],
    queryFn: () => subscriptionsApi.getAll(),
  });
  const subscriptions = [...(subscriptionsData?.asBuyer || []), ...(subscriptionsData?.asSeller || [])];

  const confirmDeliveryMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.confirmDelivery(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Delivery confirmed!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to confirm delivery", variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.complete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order completed! Payment released to seller." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to complete order", variant: "destructive" });
    },
  });

  const pendingOrders = buyerOrders.filter(o => o.status === "pending" || o.status === "paid");
  const shippedOrders = buyerOrders.filter(o => o.status === "shipped");
  const deliveredOrders = buyerOrders.filter(o => o.status === "delivered");
  const completedOrders = buyerOrders.filter(o => o.status === "completed");
  const totalSpend = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  const expiringContracts = contracts.filter((c: any) => {
    const endDate = new Date(c.endDate);
    const daysUntilEnd = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd <= 7 && daysUntilEnd > 0;
  });

  const needsAttention = deliveredOrders.length > 0 || shippedOrders.length > 0 || expiringContracts.length > 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      processing: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
      delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
      disputed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    };
    return <Badge className={variants[status] || ""}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {showProtectionTip && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <span className="font-medium text-blue-800 dark:text-blue-300">Stay protected with Farmly!</span>
              <span className="text-blue-700 dark:text-blue-400"> All purchases made through our platform are covered by escrow protection. Off-app deals are at your own risk and not covered.</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={dismissProtectionTip}>
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {needsAttention && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Bell className="h-4 w-4" /> Needs Your Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {deliveredOrders.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-background border">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{deliveredOrders.length} order{deliveredOrders.length > 1 ? "s" : ""} need{deliveredOrders.length === 1 ? "s" : ""} quality confirmation</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => document.getElementById("orders-section")?.scrollIntoView({ behavior: "smooth" })}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {shippedOrders.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-background border">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">{shippedOrders.length} order{shippedOrders.length > 1 ? "s" : ""} in transit</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => document.getElementById("orders-section")?.scrollIntoView({ behavior: "smooth" })}>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {expiringContracts.length > 0 && (
                <div className="flex items-center justify-between p-2 rounded bg-white dark:bg-background border">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">{expiringContracts.length} contract{expiringContracts.length > 1 ? "s" : ""} expiring soon</span>
                  </div>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/contracts"><ArrowRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/orders")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs">{shippedOrders.length} in transit</Badge>
            </div>
            <div className="text-2xl font-bold">{buyerOrders.length}</div>
            <div className="text-sm text-muted-foreground">My Orders</div>
            <div className="flex gap-1 mt-2">
              <div className="h-1.5 flex-1 bg-green-500 rounded-full" style={{ flex: completedOrders.length || 1 }} />
              <div className="h-1.5 flex-1 bg-blue-500 rounded-full" style={{ flex: shippedOrders.length || 0 }} />
              <div className="h-1.5 flex-1 bg-amber-500 rounded-full" style={{ flex: pendingOrders.length || 0 }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-green-500/10 rounded-lg text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold">K{totalSpend.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Spent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-600">
                <Star className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold">{user.rating || "0.0"}</div>
            <div className="text-sm text-muted-foreground">Your Rating</div>
            <div className="flex items-center gap-1 mt-2">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className={`h-3 w-3 ${i <= Math.round(parseFloat(user.rating || "0")) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/subscriptions")}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
              <Badge variant="outline" className="text-xs">{contracts.length} active</Badge>
            </div>
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <div className="text-sm text-muted-foreground">Subscriptions</div>
          </CardContent>
        </Card>
      </div>

      {buyerOrders.length === 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <strong>Get started:</strong> Browse the marketplace to find quality produce from verified producers. Subscribe to sellers for recurring orders!
            </div>
          </CardContent>
        </Card>
      )}

      {completedOrders.length >= 5 && contracts.length === 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0" />
            <div className="text-sm">
              <strong>Tip:</strong> You're a regular buyer! Consider setting up contracts with trusted sellers for better prices and guaranteed supply.
            </div>
          </CardContent>
        </Card>
      )}

      <div id="demand-forecasting-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Demand Forecasting
          </h2>
          <Dialog open={forecastDialogOpen} onOpenChange={setForecastDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-post-forecast">
                <Plus className="h-4 w-4 mr-1" /> Post Future Demand
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post Future Demand</DialogTitle>
                <DialogDescription>
                  Let producers know what you'll need in the future. They can respond with indicative pricing.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={newForecast.productName}
                      onChange={(e) => setNewForecast({ ...newForecast, productName: e.target.value })}
                      placeholder="e.g., Tomatoes"
                      data-testid="input-forecast-product"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newForecast.category} onValueChange={(v) => setNewForecast({ ...newForecast, category: v })}>
                      <SelectTrigger data-testid="select-forecast-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="produce">Produce</SelectItem>
                        <SelectItem value="livestock">Livestock</SelectItem>
                        <SelectItem value="grains">Grains</SelectItem>
                        <SelectItem value="processed">Processed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newForecast.quantity}
                      onChange={(e) => setNewForecast({ ...newForecast, quantity: parseInt(e.target.value) || 0 })}
                      data-testid="input-forecast-quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newForecast.unit} onValueChange={(v) => setNewForecast({ ...newForecast, unit: v })}>
                      <SelectTrigger data-testid="select-forecast-unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="bags">bags</SelectItem>
                        <SelectItem value="head">head</SelectItem>
                        <SelectItem value="crates">crates</SelectItem>
                        <SelectItem value="tonnes">tonnes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newForecast.frequency} onValueChange={(v) => setNewForecast({ ...newForecast, frequency: v })}>
                      <SelectTrigger data-testid="select-forecast-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="one_off">One-off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newForecast.startDate}
                      onChange={(e) => setNewForecast({ ...newForecast, startDate: e.target.value })}
                      data-testid="input-forecast-start"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newForecast.endDate}
                      onChange={(e) => setNewForecast({ ...newForecast, endDate: e.target.value })}
                      data-testid="input-forecast-end"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredGrade">Preferred Grade (Optional)</Label>
                    <Select value={newForecast.preferredGrade} onValueChange={(v) => setNewForecast({ ...newForecast, preferredGrade: v })}>
                      <SelectTrigger data-testid="select-forecast-grade">
                        <SelectValue placeholder="Any grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any grade</SelectItem>
                        <SelectItem value="A">Grade A (Premium)</SelectItem>
                        <SelectItem value="B">Grade B (Standard)</SelectItem>
                        <SelectItem value="C">Grade C (Economy)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetPrice">Target Price (K/{newForecast.unit})</Label>
                    <Input
                      id="targetPrice"
                      type="number"
                      value={newForecast.targetPrice || ""}
                      onChange={(e) => setNewForecast({ ...newForecast, targetPrice: parseFloat(e.target.value) || 0 })}
                      placeholder="Optional"
                      data-testid="input-forecast-price"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Delivery Location</Label>
                  <Select value={newForecast.location} onValueChange={(v) => setNewForecast({ ...newForecast, location: v })}>
                    <SelectTrigger data-testid="select-forecast-location">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lusaka">Lusaka</SelectItem>
                      <SelectItem value="Copperbelt">Copperbelt</SelectItem>
                      <SelectItem value="Southern">Southern</SelectItem>
                      <SelectItem value="Central">Central</SelectItem>
                      <SelectItem value="Eastern">Eastern</SelectItem>
                      <SelectItem value="Northern">Northern</SelectItem>
                      <SelectItem value="Luapula">Luapula</SelectItem>
                      <SelectItem value="Northwestern">Northwestern</SelectItem>
                      <SelectItem value="Western">Western</SelectItem>
                      <SelectItem value="Muchinga">Muchinga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={newForecast.notes}
                    onChange={(e) => setNewForecast({ ...newForecast, notes: e.target.value })}
                    placeholder="Any specific requirements..."
                    data-testid="input-forecast-notes"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createForecastMutation.mutate(newForecast)}
                  disabled={!newForecast.productName || createForecastMutation.isPending}
                  data-testid="button-submit-forecast"
                >
                  {createForecastMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Post Demand Forecast
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {myForecasts.length === 0 ? (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 mx-auto text-primary/60 mb-3" />
              <h3 className="font-semibold mb-2">Plan Your Future Supply</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Post what products you'll need in the future. Verified producers will respond with indicative pricing and availability.
              </p>
              <Button onClick={() => setForecastDialogOpen(true)} data-testid="button-first-forecast">
                <Plus className="h-4 w-4 mr-1" /> Post Your First Demand
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myForecasts.slice(0, 5).map((forecast: DemandForecast & { responses: ForecastResponse[] }) => (
              <Card key={forecast.id} data-testid={`forecast-card-${forecast.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{forecast.productName}</span>
                        <Badge variant="outline" className="text-xs">{forecast.category}</Badge>
                        <Badge className={forecast.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                          {forecast.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {forecast.quantity} {forecast.unit} {forecast.frequency !== "one_off" ? `(${forecast.frequency})` : ""} • {forecast.location}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(forecast.startDate).toLocaleDateString()} - {new Date(forecast.endDate).toLocaleDateString()}
                        {forecast.preferredGrade && ` • Grade ${forecast.preferredGrade}`}
                        {forecast.targetPrice ? ` • Target: K${forecast.targetPrice}/${forecast.unit}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {forecast.responses?.length || 0} response{(forecast.responses?.length || 0) !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                  
                  {forecast.responses && forecast.responses.length > 0 && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Producer Responses</p>
                      {forecast.responses.slice(0, 3).map((response: ForecastResponse) => (
                        <div key={response.id} className="flex items-center justify-between p-2 bg-muted/50 rounded" data-testid={`response-${response.id}`}>
                          <div>
                            <p className="text-sm font-medium">
                              K{response.proposedPrice}/{forecast.unit} • {response.indicativeQuantity} {forecast.unit}
                            </p>
                            {response.message && <p className="text-xs text-muted-foreground">{response.message}</p>}
                          </div>
                          <div className="flex items-center gap-2">
                            {response.status === "pending" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => acceptResponseMutation.mutate(response.id)}
                                disabled={acceptResponseMutation.isPending}
                                data-testid={`button-accept-response-${response.id}`}
                              >
                                <ThumbsUp className="h-3 w-3 mr-1" /> Accept
                              </Button>
                            )}
                            {response.status === "accepted" && (
                              <div className="flex items-center gap-1">
                                <Badge className="bg-green-100 text-green-800">Accepted</Badge>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-xs h-6 px-2" data-testid={`button-convert-${response.id}`}>
                                      <ArrowRight className="h-3 w-3 mr-1" /> Convert
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Convert to Order</DialogTitle>
                                      <DialogDescription>
                                        Create a formal arrangement with this seller for {forecast.productName} ({response.indicativeQuantity} {forecast.unit} at K{response.proposedPrice}/{forecast.unit}).
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-3 py-4">
                                      <Button 
                                        variant="outline" 
                                        className="h-auto py-3 justify-start" 
                                        disabled={convertForecastMutation.isPending}
                                        onClick={() => {
                                          convertForecastMutation.mutate({
                                            forecastId: forecast.id,
                                            data: {
                                              conversionType: "subscription",
                                              responseId: response.id,
                                              referenceId: response.sellerId,
                                              quantity: response.indicativeQuantity
                                            }
                                          });
                                        }}
                                        data-testid={`button-convert-subscription-${response.id}`}
                                      >
                                        {convertForecastMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : null}
                                        <div className="text-left">
                                          <div className="font-medium">Set Up Subscription</div>
                                          <p className="text-xs text-muted-foreground">Recurring delivery from this seller</p>
                                        </div>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        className="h-auto py-3 justify-start"
                                        disabled={convertForecastMutation.isPending}
                                        onClick={() => {
                                          convertForecastMutation.mutate({
                                            forecastId: forecast.id,
                                            data: {
                                              conversionType: "contract",
                                              responseId: response.id,
                                              referenceId: response.sellerId,
                                              quantity: response.indicativeQuantity
                                            }
                                          });
                                        }}
                                        data-testid={`button-convert-contract-${response.id}`}
                                      >
                                        {convertForecastMutation.isPending ? (
                                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : null}
                                        <div className="text-left">
                                          <div className="font-medium">Create Contract</div>
                                          <p className="text-xs text-muted-foreground">Formal supply agreement with fixed terms</p>
                                        </div>
                                      </Button>
                                      <Button variant="ghost" className="h-auto py-3 justify-start" asChild>
                                        <a href="/chat">
                                          <div className="text-left">
                                            <div className="font-medium">Message Seller First</div>
                                            <p className="text-xs text-muted-foreground">Discuss details before ordering</p>
                                          </div>
                                        </a>
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {buyerOrders.length > 0 && (
        <div id="orders-section">
          <h2 className="font-heading text-xl font-bold mb-4">My Orders</h2>
          <div className="space-y-3">
            {buyerOrders.slice(0, 10).map(order => (
              <Card key={order.id} className={`transition-colors ${order.status === 'shipped' ? 'border-primary/30 bg-primary/5' : ''}`} data-testid={`order-card-${order.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Order #{order.id.slice(0, 8)}</span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                      {order.status === "shipped" && (
                        <p className="text-sm text-primary mt-1 flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Your order is on the way!
                        </p>
                      )}
                      {order.status === "delivered" && order.disputeDeadline && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Payment releases: {new Date(order.disputeDeadline).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-bold text-primary">K{order.total.toLocaleString()}</div>
                      </div>
                      {order.status === "shipped" && (
                        <Button 
                          size="sm"
                          onClick={() => confirmDeliveryMutation.mutate(order.id)}
                          disabled={confirmDeliveryMutation.isPending}
                          data-testid={`button-confirm-delivery-${order.id}`}
                        >
                          {confirmDeliveryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Delivery"}
                        </Button>
                      )}
                      {order.status === "delivered" && (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => completeMutation.mutate(order.id)}
                          disabled={completeMutation.isPending}
                          data-testid={`button-complete-${order.id}`}
                        >
                          {completeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" /> Release Payment
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {buyerOrders.length > 10 && (
              <Button variant="outline" className="w-full" onClick={() => setLocation("/orders")}>
                View All Orders
              </Button>
            )}
          </div>
        </div>
      )}

      <TransportTrackingSection userId={user.id} role="buyer" />

      <div>
        <h2 className="font-heading text-xl font-bold mb-4">Recommended Products</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allListings.slice(0, 6).map(listing => (
            <Card key={listing.id} className="overflow-hidden" data-testid={`product-card-${listing.id}`}>
              <img 
                src={listing.images[0] || "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=400"} 
                alt={listing.title}
                className="w-full h-40 object-cover"
              />
              <CardContent className="p-4">
                <h3 className="font-semibold mb-1">{listing.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{listing.location}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-primary">K{listing.price}/{listing.unit}</span>
                  <Button size="sm" asChild>
                    <a href={`/product/${listing.id}`}>View</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransportTrackingSection({ userId, role }: { userId: string; role: "buyer" | "seller" }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingJob, setRatingJob] = useState<TransportJob | null>(null);
  const [ratingData, setRatingData] = useState({
    rating: 5,
    onTimeDelivery: true,
    cargoCondition: "excellent" as string,
    communication: 5,
    comment: ""
  });

  const { data: myTransportJobs = [], isLoading } = useQuery({
    queryKey: ["/api/transport-jobs/my", role],
    queryFn: () => transportJobsApi.getMy(),
  });

  const verifyProofMutation = useMutation({
    mutationFn: ({ proofId, verified, reason }: { proofId: string; verified: boolean; reason?: string }) => 
      transportJobsApi.verifyProof(proofId, { verified, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-jobs/my"] });
      toast({ title: "Proof verification updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to verify proof", variant: "destructive" });
    },
  });

  const submitRatingMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: typeof ratingData & { ratedUser: string } }) => 
      transportJobsApi.submitRating(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-jobs/my"] });
      setRatingDialogOpen(false);
      setRatingJob(null);
      toast({ title: "Rating submitted! Thank you for your feedback." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit rating", variant: "destructive" });
    },
  });

  const activeJobs = myTransportJobs.filter(j => 
    ["open", "bidding", "assigned", "pickup_confirmed", "in_transit"].includes(j.status)
  );
  const completedJobs = myTransportJobs.filter(j => ["delivered", "completed"].includes(j.status));

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      open: "outline",
      bidding: "secondary",
      assigned: "default",
      pickup_confirmed: "default",
      in_transit: "default",
      delivered: "secondary",
      completed: "secondary",
      cancelled: "destructive",
      disputed: "destructive"
    };
    return variants[status] || "outline";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (myTransportJobs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-bold flex items-center gap-2">
        <Truck className="h-5 w-5" />
        Transport Tracking
        {activeJobs.length > 0 && <Badge>{activeJobs.length} active</Badge>}
      </h2>

      {activeJobs.length > 0 && (
        <div className="space-y-3">
          {activeJobs.map(job => (
            <Card key={job.id} className="border-l-4 border-l-primary" data-testid={`transport-tracking-${job.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getStatusBadge(job.status)} className="capitalize">{job.status.replace("_", " ")}</Badge>
                      <Badge variant="outline" className="capitalize">{job.productType}</Badge>
                    </div>
                    <div className="text-sm">
                      <p><span className="font-medium">Route:</span> {job.pickupLocation} → {job.deliveryLocation}</p>
                      <p><span className="font-medium">Pickup Date:</span> {new Date(job.pickupDate).toLocaleDateString()}</p>
                      {job.transporter && (
                        <p><span className="font-medium">Logistics Partner:</span> {job.transporter.name}</p>
                      )}
                    </div>
                    <p className="text-lg font-bold text-primary">K{job.agreedPrice || job.suggestedPrice}</p>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    {job.status === "open" && (
                      <Badge variant="outline" className="justify-center">Awaiting offers</Badge>
                    )}
                    {job.status === "bidding" && (
                      <Badge variant="secondary" className="justify-center">Reviewing offers</Badge>
                    )}
                    {job.status === "assigned" && (
                      <Badge variant="default" className="justify-center">Logistics partner assigned</Badge>
                    )}
                    {job.status === "pickup_confirmed" && (
                      <Badge className="bg-amber-500 justify-center">Pickup confirmed</Badge>
                    )}
                    {job.status === "in_transit" && (
                      <Badge className="bg-blue-500 justify-center">In transit</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completedJobs.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-muted-foreground mb-3">Completed Deliveries</h3>
          <div className="space-y-2">
            {completedJobs.slice(0, 3).map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`completed-transport-${job.id}`}>
                <div>
                  <p className="font-medium text-sm">{job.pickupLocation} → {job.deliveryLocation}</p>
                  <p className="text-xs text-muted-foreground">{new Date(job.updatedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-primary text-sm">K{job.agreedPrice || job.suggestedPrice}</span>
                  {job.status === "delivered" && role === "buyer" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setRatingJob(job);
                        setRatingDialogOpen(true);
                      }}
                      data-testid={`rate-transport-${job.id}`}
                    >
                      <Star className="h-3 w-3 mr-1" /> Rate
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Logistics Partner</DialogTitle>
            <DialogDescription>Share your experience with this delivery</DialogDescription>
          </DialogHeader>
          {ratingJob && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Overall Rating</Label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingData({ ...ratingData, rating: star })}
                      className={`p-1 ${ratingData.rating >= star ? "text-amber-500" : "text-muted-foreground"}`}
                    >
                      <Star className="h-6 w-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch 
                  checked={ratingData.onTimeDelivery}
                  onCheckedChange={(checked) => setRatingData({ ...ratingData, onTimeDelivery: checked })}
                />
                <Label>On-time delivery</Label>
              </div>

              <div className="space-y-2">
                <Label>Cargo Condition</Label>
                <Select value={ratingData.cargoCondition} onValueChange={(v) => setRatingData({ ...ratingData, cargoCondition: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="acceptable">Acceptable</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Communication ({ratingData.communication}/5)</Label>
                <Input 
                  type="range"
                  min="1"
                  max="5"
                  value={ratingData.communication}
                  onChange={(e) => setRatingData({ ...ratingData, communication: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Comments (Optional)</Label>
                <Textarea 
                  placeholder="Share your experience..."
                  value={ratingData.comment}
                  onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => ratingJob?.transporterId && submitRatingMutation.mutate({ 
                  jobId: ratingJob.id, 
                  data: { ...ratingData, ratedUser: ratingJob.transporterId } 
                })}
                disabled={submitRatingMutation.isPending || !ratingJob?.transporterId}
              >
                {submitRatingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Rating
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransporterDashboard({ user }: { user: User }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<TransportJob | null>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofJob, setProofJob] = useState<TransportJob | null>(null);
  const [offerData, setOfferData] = useState({
    proposedPrice: 0,
    estimatedPickupTime: "",
    estimatedDeliveryTime: "",
    vehicleDetails: "",
    message: ""
  });
  const [proofData, setProofData] = useState({
    proofType: "pickup" as string,
    photoUrls: [] as string[],
    gpsLatitude: 0,
    gpsLongitude: 0,
    gpsAddress: "",
    notes: ""
  });
  const [filters, setFilters] = useState({
    cargoType: "",
    region: "",
    priority: ""
  });

  const { data: openJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/transport-jobs", filters],
    queryFn: () => transportJobsApi.getOpen(filters.cargoType || filters.region || filters.priority ? filters : undefined),
  });

  const { data: myJobs = [], isLoading: myJobsLoading } = useQuery({
    queryKey: ["/api/transport-jobs/my"],
    queryFn: () => transportJobsApi.getMy(),
  });

  const submitOfferMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: typeof offerData }) => 
      transportJobsApi.submitOffer(jobId, {
        proposedPrice: data.proposedPrice,
        estimatedPickupTime: data.estimatedPickupTime || undefined,
        estimatedDeliveryTime: data.estimatedDeliveryTime || undefined,
        vehicleDetails: data.vehicleDetails || undefined,
        message: data.message || undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-jobs"] });
      setOfferDialogOpen(false);
      setSelectedJob(null);
      setOfferData({ proposedPrice: 0, estimatedPickupTime: "", estimatedDeliveryTime: "", vehicleDetails: "", message: "" });
      toast({ title: "Offer submitted! Waiting for buyer response." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit offer", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ jobId, status }: { jobId: string; status: string }) => 
      transportJobsApi.updateStatus(jobId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-jobs/my"] });
      toast({ title: "Status updated!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    },
  });

  const submitProofMutation = useMutation({
    mutationFn: ({ jobId, data }: { jobId: string; data: typeof proofData }) => 
      transportJobsApi.submitProof(jobId, {
        proofType: data.proofType,
        photoUrls: data.photoUrls.length > 0 ? data.photoUrls : ["https://via.placeholder.com/400x300?text=Proof+Photo"],
        gpsLatitude: data.gpsLatitude || undefined,
        gpsLongitude: data.gpsLongitude || undefined,
        gpsAddress: data.gpsAddress || undefined,
        notes: data.notes || undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transport-jobs/my"] });
      setProofDialogOpen(false);
      setProofJob(null);
      setProofData({ proofType: "pickup", photoUrls: [], gpsLatitude: 0, gpsLongitude: 0, gpsAddress: "", notes: "" });
      toast({ title: "Proof submitted! Waiting for verification." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit proof", variant: "destructive" });
    },
  });

  const activeJobs = myJobs.filter(j => ["assigned", "pickup_confirmed", "in_transit"].includes(j.status));
  const completedJobs = myJobs.filter(j => j.status === "delivered");
  const pendingOfferJobs = myJobs.filter(j => j.status === "open" || j.status === "bidding");

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      open: "outline",
      bidding: "secondary",
      assigned: "default",
      pickup_confirmed: "default",
      in_transit: "default",
      delivered: "secondary",
      completed: "secondary",
      cancelled: "destructive",
      disputed: "destructive"
    };
    return variants[status] || "outline";
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === "urgent") return "destructive";
    if (priority === "high") return "default";
    return "outline";
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Jobs</p>
                <p className="text-2xl font-bold">{openJobs.length}</p>
              </div>
              <Truck className="h-8 w-8 text-primary/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
                <p className="text-2xl font-bold">{activeJobs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedJobs.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Offers</p>
                <p className="text-2xl font-bold">{pendingOfferJobs.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            My Active Jobs
          </CardTitle>
          <CardDescription>Jobs you're currently working on</CardDescription>
        </CardHeader>
        <CardContent>
          {myJobsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activeJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No active jobs. Browse available jobs below to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeJobs.map(job => (
                <Card key={job.id} data-testid={`active-job-${job.id}`} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={getStatusBadge(job.status)} className="capitalize">{job.status.replace("_", " ")}</Badge>
                          {job.priority && <Badge variant={getPriorityBadge(job.priority)} className="capitalize">{job.priority}</Badge>}
                          <Badge variant="outline" className="capitalize">{job.productType}</Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">From:</span> {job.pickupLocation}</p>
                          <p><span className="font-medium">To:</span> {job.deliveryLocation}</p>
                          <p><span className="font-medium">Pickup Date:</span> {new Date(job.pickupDate).toLocaleDateString()}</p>
                          {job.weight && <p><span className="font-medium">Weight:</span> {job.weight} kg</p>}
                        </div>
                        <p className="text-lg font-bold text-primary">K{job.agreedPrice || job.suggestedPrice}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.status === "assigned" && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setProofJob(job);
                                setProofData({ ...proofData, proofType: "pickup" });
                                setProofDialogOpen(true);
                              }}
                              data-testid={`submit-pickup-proof-${job.id}`}
                            >
                              Submit Pickup Proof
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: "pickup_confirmed" })}
                              data-testid={`confirm-pickup-${job.id}`}
                            >
                              Confirm Pickup
                            </Button>
                          </>
                        )}
                        {job.status === "pickup_confirmed" && (
                          <Button 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: "in_transit" })}
                            data-testid={`start-transit-${job.id}`}
                          >
                            Start Transit
                          </Button>
                        )}
                        {job.status === "in_transit" && (
                          <>
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setProofJob(job);
                                setProofData({ ...proofData, proofType: "delivery" });
                                setProofDialogOpen(true);
                              }}
                              data-testid={`submit-delivery-proof-${job.id}`}
                            >
                              Submit Delivery Proof
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateStatusMutation.mutate({ jobId: job.id, status: "delivered" })}
                              data-testid={`confirm-delivery-${job.id}`}
                            >
                              Confirm Delivery
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Available Jobs
              </CardTitle>
              <CardDescription>Browse and bid on transport jobs</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={filters.cargoType} onValueChange={(v) => setFilters(f => ({ ...f, cargoType: v }))}>
                <SelectTrigger className="w-[140px]" data-testid="filter-cargo-type">
                  <SelectValue placeholder="Cargo Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="produce">Produce</SelectItem>
                  <SelectItem value="livestock">Livestock</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.priority} onValueChange={(v) => setFilters(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="w-[120px]" data-testid="filter-priority">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
              <Input 
                placeholder="Region" 
                className="w-[120px]"
                value={filters.region}
                onChange={(e) => setFilters(f => ({ ...f, region: e.target.value }))}
                data-testid="filter-region"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {jobsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : openJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No available jobs matching your filters.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {openJobs.map(job => (
                <Card key={job.id} data-testid={`job-card-${job.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      {job.priority && <Badge variant={getPriorityBadge(job.priority)} className="capitalize">{job.priority}</Badge>}
                      <Badge variant="outline" className="capitalize">{job.productType}</Badge>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{job.pickupLocation} → {job.deliveryLocation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(job.pickupDate).toLocaleDateString()}</span>
                      </div>
                      {job.weight && (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{job.weight} kg</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">K{job.suggestedPrice}</span>
                      <Button 
                        size="sm"
                        onClick={() => {
                          setSelectedJob(job);
                          setOfferData({ ...offerData, proposedPrice: job.suggestedPrice });
                          setOfferDialogOpen(true);
                        }}
                        data-testid={`bid-job-${job.id}`}
                      >
                        Make Offer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {completedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Completed Jobs
            </CardTitle>
            <CardDescription>Your delivery history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedJobs.slice(0, 5).map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg" data-testid={`completed-job-${job.id}`}>
                  <div>
                    <p className="font-medium">{job.pickupLocation} → {job.deliveryLocation}</p>
                    <p className="text-sm text-muted-foreground">{new Date(job.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">K{job.agreedPrice || job.suggestedPrice}</p>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Make Transport Offer</DialogTitle>
            <DialogDescription>
              Submit your offer for this transport job
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedJob.pickupLocation} → {selectedJob.deliveryLocation}</p>
                <p className="text-sm text-muted-foreground">Suggested Price: K{selectedJob.suggestedPrice}</p>
              </div>
              
              <div className="space-y-2">
                <Label>Your Proposed Price (ZMW)</Label>
                <Input 
                  type="number"
                  value={offerData.proposedPrice}
                  onChange={(e) => setOfferData({ ...offerData, proposedPrice: Number(e.target.value) })}
                  data-testid="offer-price-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Est. Pickup Time</Label>
                  <Input 
                    type="datetime-local"
                    value={offerData.estimatedPickupTime}
                    onChange={(e) => setOfferData({ ...offerData, estimatedPickupTime: e.target.value })}
                    data-testid="offer-pickup-time"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Est. Delivery Time</Label>
                  <Input 
                    type="datetime-local"
                    value={offerData.estimatedDeliveryTime}
                    onChange={(e) => setOfferData({ ...offerData, estimatedDeliveryTime: e.target.value })}
                    data-testid="offer-delivery-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vehicle Details</Label>
                <Input 
                  placeholder="e.g., 5-ton truck, refrigerated"
                  value={offerData.vehicleDetails}
                  onChange={(e) => setOfferData({ ...offerData, vehicleDetails: e.target.value })}
                  data-testid="offer-vehicle-details"
                />
              </div>

              <div className="space-y-2">
                <Label>Message (Optional)</Label>
                <Textarea 
                  placeholder="Any additional information..."
                  value={offerData.message}
                  onChange={(e) => setOfferData({ ...offerData, message: e.target.value })}
                  data-testid="offer-message"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => selectedJob && submitOfferMutation.mutate({ jobId: selectedJob.id, data: offerData })}
                disabled={submitOfferMutation.isPending || offerData.proposedPrice <= 0}
                data-testid="submit-offer-btn"
              >
                {submitOfferMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Offer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Proof of {proofData.proofType === "pickup" ? "Pickup" : "Delivery"}</DialogTitle>
            <DialogDescription>
              Upload photos and GPS coordinates as proof
            </DialogDescription>
          </DialogHeader>
          {proofJob && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{proofJob.pickupLocation} → {proofJob.deliveryLocation}</p>
              </div>

              <div className="space-y-2">
                <Label>Photo URL (for demo)</Label>
                <Input 
                  placeholder="https://example.com/photo.jpg"
                  onChange={(e) => setProofData({ ...proofData, photoUrls: e.target.value ? [e.target.value] : [] })}
                  data-testid="proof-photo-url"
                />
                <p className="text-xs text-muted-foreground">In production, this would be a photo upload</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>GPS Latitude</Label>
                  <Input 
                    type="number"
                    step="0.0001"
                    placeholder="-15.4167"
                    value={proofData.gpsLatitude || ""}
                    onChange={(e) => setProofData({ ...proofData, gpsLatitude: Number(e.target.value) })}
                    data-testid="proof-latitude"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GPS Longitude</Label>
                  <Input 
                    type="number"
                    step="0.0001"
                    placeholder="28.2833"
                    value={proofData.gpsLongitude || ""}
                    onChange={(e) => setProofData({ ...proofData, gpsLongitude: Number(e.target.value) })}
                    data-testid="proof-longitude"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location Address</Label>
                <Input 
                  placeholder="e.g., Farm Gate, Chisamba"
                  value={proofData.gpsAddress}
                  onChange={(e) => setProofData({ ...proofData, gpsAddress: e.target.value })}
                  data-testid="proof-address"
                />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea 
                  placeholder="Any observations about the cargo..."
                  value={proofData.notes}
                  onChange={(e) => setProofData({ ...proofData, notes: e.target.value })}
                  data-testid="proof-notes"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={() => proofJob && submitProofMutation.mutate({ jobId: proofJob.id, data: proofData })}
                disabled={submitProofMutation.isPending}
                data-testid="submit-proof-btn"
              >
                {submitProofMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit Proof
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

