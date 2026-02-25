import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Shield,
  Star,
  CheckCircle,
  Loader2,
  ShieldAlert,
  Bot,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  FileText,
  Users as UsersIcon,
  Scale,
  Target,
  BarChart3,
  Truck,
  Clock,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { adminApi, authApi, adminCoopsApi, gradesApi, forecastsApi, adminTransportApi, type User, type Listing, type Coop, type CoopDispute, type GradeDispute } from "@/lib/api";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: currentUser, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
  });

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (!userLoading) {
      if (!currentUser) {
        setLocation("/auth");
      } else if (currentUser.role !== "admin") {
        // Non-admin users should not access admin page
        setLocation("/dashboard");
      }
    }
  }, [userLoading, currentUser, setLocation]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: adminApi.getStats,
    enabled: isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: adminApi.getUsers,
    enabled: isAdmin,
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/admin/listings"],
    queryFn: adminApi.getListings,
    enabled: isAdmin,
  });

  const { data: flaggedDeliveries = [], isLoading: flaggedLoading } = useQuery({
    queryKey: ["/api/admin/flagged-deliveries"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/flagged-deliveries");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: aiLogs = [], isLoading: aiLogsLoading } = useQuery({
    queryKey: ["/api/admin/ai-logs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ai-logs?limit=50");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: trustScores = [], isLoading: trustScoresLoading } = useQuery({
    queryKey: ["/api/admin/trust-scores"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/trust-scores");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: adminContracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/admin/contracts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/contracts");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: adminCoops = [], isLoading: coopsLoading } = useQuery({
    queryKey: ["/api/admin/coops"],
    queryFn: adminCoopsApi.getAll,
    enabled: isAdmin,
  });

  const { data: coopDisputes = [], isLoading: disputesLoading } = useQuery({
    queryKey: ["/api/admin/coop-disputes"],
    queryFn: () => adminCoopsApi.getDisputes(),
    enabled: isAdmin,
  });

  const { data: gradeDisputes = [], isLoading: gradeDisputesLoading } = useQuery({
    queryKey: ["/api/grades/disputes/pending"],
    queryFn: () => gradesApi.getPendingDisputes(),
    enabled: isAdmin,
  });

  const { data: forecastStats, isLoading: forecastStatsLoading } = useQuery({
    queryKey: ["/api/admin/forecast-stats"],
    queryFn: () => forecastsApi.getStats(),
    enabled: isAdmin,
  });

  const { data: transportStats, isLoading: transportStatsLoading } = useQuery({
    queryKey: ["/api/admin/transport-stats"],
    queryFn: () => adminTransportApi.getStats(),
    enabled: isAdmin,
  });

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<CoopDispute | null>(null);
  const [disputeResolution, setDisputeResolution] = useState("");
  const [selectedGradeDispute, setSelectedGradeDispute] = useState<GradeDispute | null>(null);
  const [gradeDisputeDialogOpen, setGradeDisputeDialogOpen] = useState(false);
  const [gradeResolution, setGradeResolution] = useState("");
  const [buyerWins, setBuyerWins] = useState(false);
  const [refundPercentage, setRefundPercentage] = useState("0");

  const updateCoopStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminCoopsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coops"] });
      toast({ title: "Co-op status updated" });
    },
  });

  const resolveDisputeMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      adminCoopsApi.resolveDispute(id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/coop-disputes"] });
      toast({ title: "Dispute resolved" });
      setResolveDialogOpen(false);
      setSelectedDispute(null);
      setDisputeResolution("");
    },
  });

  const resolveGradeDisputeMutation = useMutation({
    mutationFn: ({ id, resolution, buyerWins, refundPercentage }: { id: string; resolution: string; buyerWins: boolean; refundPercentage: string }) =>
      gradesApi.resolveDispute(id, resolution, buyerWins, undefined, refundPercentage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades/disputes/pending"] });
      toast({ title: "Grade dispute resolved" });
      setGradeDisputeDialogOpen(false);
      setSelectedGradeDispute(null);
      setGradeResolution("");
      setBuyerWins(false);
      setRefundPercentage("0");
    },
  });

  const updateContractMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      await apiRequest("PATCH", `/api/admin/contracts/${id}`, { status, adminNotes: notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/contracts"] });
      toast({ title: "Contract updated" });
    },
  });

  const resolveFlaggedMutation = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: string }) => {
      await apiRequest("POST", `/api/admin/flagged-deliveries/${id}/resolve`, { resolution });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/flagged-deliveries"] });
      toast({ title: "Flagged delivery resolved" });
    },
  });

  const overrideAIMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/ai-logs/${id}/override`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-logs"] });
      toast({ title: "AI decision overridden" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ userId, verified }: { userId: string; verified: boolean }) =>
      adminApi.updateUserVerification(userId, verified),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated", description: "Verification status changed" });
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated", description: "Role changed successfully" });
    },
  });

  const featuredMutation = useMutation({
    mutationFn: ({ listingId, featured }: { listingId: string; featured: boolean }) =>
      adminApi.updateListingFeatured(listingId, featured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      toast({ title: "Listing updated", description: "Featured status changed" });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ listingId, status }: { listingId: string; status: string }) =>
      adminApi.updateListingStatus(listingId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Listing updated", description: "Status changed successfully" });
    },
  });

  if (userLoading || statsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">You do not have permission to access the admin dashboard.</p>
          <Button onClick={() => setLocation("/")}>Return to Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground">Manage users, listings, and platform settings.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Users</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalListings || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Listings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.activeListings || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Listings</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                  <Star className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats?.totalBids || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Bids</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="listings">Listing Moderation</TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="coops" className="flex items-center gap-1">
              <UsersIcon className="h-4 w-4" />
              Co-Ops
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Bot className="h-4 w-4" />
              AI Monitoring
            </TabsTrigger>
            <TabsTrigger value="grading" className="flex items-center gap-1">
              <Scale className="h-4 w-4" />
              Grade Disputes
              {gradeDisputes.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">{gradeDisputes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="transport" className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              Transport
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user verification and roles</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y">
                    {users.map((user) => (
                      <div key={user.id} className="py-4 flex items-center justify-between" data-testid={`user-row-${user.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.name}
                              {user.verified && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username} • {user.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Verified</span>
                            <Switch
                              checked={user.verified}
                              onCheckedChange={(checked) => 
                                verifyMutation.mutate({ userId: user.id, verified: checked })
                              }
                              data-testid={`switch-verify-${user.id}`}
                            />
                          </div>
                          <Select
                            value={user.role}
                            onValueChange={(role) => 
                              roleMutation.mutate({ userId: user.id, role })
                            }
                          >
                            <SelectTrigger className="w-[130px]" data-testid={`select-role-${user.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="farmer">Producer</SelectItem>
                              <SelectItem value="buyer">Buyer</SelectItem>
                              <SelectItem value="transporter">Logistics Partner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>All Listings</CardTitle>
                <CardDescription>Moderate listings and control featured items</CardDescription>
              </CardHeader>
              <CardContent>
                {listingsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y">
                    {listings.map((listing) => (
                      <div key={listing.id} className="py-4 flex items-center justify-between" data-testid={`listing-row-${listing.id}`}>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden">
                            {listing.images[0] && (
                              <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {listing.title}
                              {listing.featured && (
                                <Badge className="bg-amber-100 text-amber-700 border-none">Featured</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              K{listing.price}/{listing.unit} • {listing.location}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Featured</span>
                            <Switch
                              checked={listing.featured}
                              onCheckedChange={(checked) => 
                                featuredMutation.mutate({ listingId: listing.id, featured: checked })
                              }
                              data-testid={`switch-featured-${listing.id}`}
                            />
                          </div>
                          <Select
                            value={listing.status}
                            onValueChange={(status) => 
                              statusMutation.mutate({ listingId: listing.id, status })
                            }
                          >
                            <SelectTrigger className="w-[120px]" data-testid={`select-status-${listing.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="sold">Sold</SelectItem>
                              <SelectItem value="expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts">
            <Card>
              <CardHeader>
                <CardTitle>Contract Management</CardTitle>
                <CardDescription>Monitor and manage subscription contracts between buyers and sellers</CardDescription>
              </CardHeader>
              <CardContent>
                {contractsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : adminContracts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No contracts found
                  </div>
                ) : (
                  <div className="divide-y">
                    {adminContracts.map((contract: any) => (
                      <div key={contract.id} className="py-4" data-testid={`contract-row-${contract.id}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                              #{contract.id}
                            </div>
                            <div>
                              <div className="font-medium">
                                Contract #{contract.id}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Buyer: {contract.buyerId} • Seller: {contract.sellerId}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={
                              contract.status === "active" ? "bg-green-100 text-green-700" :
                              contract.status === "pending" ? "bg-amber-100 text-amber-700" :
                              contract.status === "completed" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }>
                              {contract.status}
                            </Badge>
                            <Select
                              value={contract.status}
                              onValueChange={(status) => 
                                updateContractMutation.mutate({ id: contract.id, status })
                              }
                            >
                              <SelectTrigger className="w-[130px]" data-testid={`select-contract-status-${contract.id}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="ml-13 text-sm text-muted-foreground grid grid-cols-3 gap-4">
                          <div>
                            <span className="font-medium text-foreground">Pricing:</span> {contract.pricingType}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Duration:</span> {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium text-foreground">Payment:</span> {contract.paymentSchedule}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coops" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UsersIcon className="h-5 w-5 text-green-500" />
                    All Co-Ops
                  </CardTitle>
                  <CardDescription>Manage group supply co-ops</CardDescription>
                </CardHeader>
                <CardContent>
                  {coopsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : adminCoops.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <UsersIcon className="h-8 w-8 mx-auto mb-2" />
                      No co-ops created yet
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {adminCoops.map((coop: Coop) => (
                        <div key={coop.id} className="border rounded-lg p-3" data-testid={`coop-admin-${coop.id}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{coop.title}</span>
                            <Badge className={
                              coop.status === "recruiting" ? "bg-blue-100 text-blue-700" :
                              coop.status === "active" ? "bg-green-100 text-green-700" :
                              coop.status === "fulfilled" ? "bg-purple-100 text-purple-700" :
                              coop.status === "cancelled" || coop.status === "failed" ? "bg-red-100 text-red-700" :
                              "bg-gray-100 text-gray-700"
                            }>
                              {coop.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {coop.productName} • {parseFloat(coop.currentQuantity).toLocaleString()}/{parseFloat(coop.targetQuantity).toLocaleString()} {coop.unit}
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={coop.status}
                              onValueChange={(status) => 
                                updateCoopStatusMutation.mutate({ id: coop.id, status })
                              }
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="recruiting">Recruiting</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="order_placed">Order Placed</SelectItem>
                                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Co-Op Disputes
                  </CardTitle>
                  <CardDescription>Quality and delivery disputes</CardDescription>
                </CardHeader>
                <CardContent>
                  {disputesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : coopDisputes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No open disputes
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {coopDisputes.map((dispute: CoopDispute) => (
                        <div key={dispute.id} className="border rounded-lg p-3" data-testid={`dispute-${dispute.id}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">Order #{dispute.coopOrderId.slice(0, 8)}</span>
                            <Badge variant="outline" className={
                              dispute.status === "open" ? "text-red-600 border-red-600" :
                              dispute.status === "investigating" ? "text-amber-600 border-amber-600" :
                              "text-green-600 border-green-600"
                            }>
                              {dispute.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{dispute.reason}</p>
                          {dispute.status !== "resolved" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setResolveDialogOpen(true);
                              }}
                            >
                              Resolve
                            </Button>
                          )}
                          {dispute.status === "resolved" && dispute.resolution && (
                            <p className="text-xs text-green-600">Resolution: {dispute.resolution}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Resolve Dispute</DialogTitle>
                <DialogDescription>
                  Provide a resolution for this dispute
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="resolution">Resolution</Label>
                  <Textarea
                    id="resolution"
                    placeholder="Describe how this dispute was resolved..."
                    value={disputeResolution}
                    onChange={(e) => setDisputeResolution(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => {
                    if (selectedDispute) {
                      resolveDisputeMutation.mutate({ id: selectedDispute.id, resolution: disputeResolution });
                    }
                  }}
                  disabled={resolveDisputeMutation.isPending || !disputeResolution}
                >
                  {resolveDisputeMutation.isPending ? "Resolving..." : "Resolve Dispute"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <TabsContent value="ai" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Flagged Deliveries
                  </CardTitle>
                  <CardDescription>Deliveries requiring manual review</CardDescription>
                </CardHeader>
                <CardContent>
                  {flaggedLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : flaggedDeliveries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No flagged deliveries
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {flaggedDeliveries.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-3" data-testid={`flagged-delivery-${item.id}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Order #{item.orderId?.slice(0, 8)}</span>
                            <Badge variant="outline" className="text-amber-600 border-amber-600">
                              {item.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600"
                              onClick={() => resolveFlaggedMutation.mutate({ id: item.id, resolution: "approved" })}
                              data-testid={`button-approve-flagged-${item.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600"
                              onClick={() => resolveFlaggedMutation.mutate({ id: item.id, resolution: "rejected" })}
                              data-testid={`button-reject-flagged-${item.id}`}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Trust Scores
                  </CardTitle>
                  <CardDescription>User reputation scores based on transaction history</CardDescription>
                </CardHeader>
                <CardContent>
                  {trustScoresLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {trustScores.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0" data-testid={`trust-score-${user.id}`}>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {user.name?.charAt(0) || "?"}
                            </div>
                            <div>
                              <span className="font-medium text-sm">{user.name}</span>
                              <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`text-sm font-bold ${
                              user.trustScore >= 80 ? "text-green-600" :
                              user.trustScore >= 50 ? "text-amber-600" : "text-red-600"
                            }`}>
                              {user.trustScore}
                            </div>
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${
                                  user.trustScore >= 80 ? "bg-green-500" :
                                  user.trustScore >= 50 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${user.trustScore}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-purple-500" />
                  AI Decision Logs
                </CardTitle>
                <CardDescription>Audit trail of all AI-powered decisions</CardDescription>
              </CardHeader>
              <CardContent>
                {aiLogsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : aiLogs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No AI decisions recorded yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {aiLogs.map((log: any) => (
                      <div key={log.id} className="border rounded-lg p-3" data-testid={`ai-log-${log.id}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{log.decisionType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {!log.overridden && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const reason = window.prompt("Enter reason for override:");
                                if (reason) overrideAIMutation.mutate({ id: log.id, reason });
                              }}
                              data-testid={`button-override-ai-${log.id}`}
                            >
                              Override
                            </Button>
                          )}
                          {log.overridden && (
                            <Badge variant="outline" className="text-amber-600">Overridden</Badge>
                          )}
                        </div>
                        <p className="text-sm">{log.decision}</p>
                        {log.confidence && (
                          <span className="text-xs text-muted-foreground">Confidence: {log.confidence}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="grading" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Quality Grade Disputes
                </CardTitle>
                <CardDescription>Review and resolve quality grading disputes between buyers and sellers</CardDescription>
              </CardHeader>
              <CardContent>
                {gradeDisputesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : gradeDisputes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Scale className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    No pending grade disputes
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gradeDisputes.map((dispute: GradeDispute) => (
                      <Card key={dispute.id} className="border-l-4 border-l-orange-500" data-testid={`grade-dispute-${dispute.id}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">Order #{dispute.orderId}</Badge>
                                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                                  {dispute.status}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Claimed Grade: </span>
                                  <Badge className={
                                    dispute.claimedGrade === 'A' ? 'bg-green-500' :
                                    dispute.claimedGrade === 'C' ? 'bg-orange-500' : 'bg-yellow-500'
                                  }>
                                    Grade {dispute.claimedGrade}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Actual Grade: </span>
                                  <Badge className={
                                    dispute.actualGrade === 'A' ? 'bg-green-500' :
                                    dispute.actualGrade === 'C' ? 'bg-orange-500' : 'bg-yellow-500'
                                  }>
                                    Grade {dispute.actualGrade}
                                  </Badge>
                                </div>
                              </div>
                              {dispute.buyerReason && (
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Reason: </span>
                                  {dispute.buyerReason}
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedGradeDispute(dispute);
                                setGradeDisputeDialogOpen(true);
                              }}
                              data-testid={`button-resolve-grade-dispute-${dispute.id}`}
                            >
                              Resolve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Demand Forecasting Analytics
                </CardTitle>
                <CardDescription>
                  Monitor buyer demand forecasts and seller responses across the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {forecastStatsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : forecastStats ? (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-primary/5">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <Target className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-2xl font-bold">{forecastStats.totalForecasts}</div>
                          <p className="text-sm text-muted-foreground">Total Forecasts</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-500/10">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="text-2xl font-bold">{forecastStats.activeForecasts}</div>
                          <p className="text-sm text-muted-foreground">Active Forecasts</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-500/10">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <ShoppingBag className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="text-2xl font-bold">{forecastStats.totalResponses}</div>
                          <p className="text-sm text-muted-foreground">Seller Responses</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-amber-500/10">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="h-5 w-5 text-amber-600" />
                          </div>
                          <div className="text-2xl font-bold">{forecastStats.conversionRate.toFixed(1)}%</div>
                          <p className="text-sm text-muted-foreground">Conversion Rate</p>
                        </CardContent>
                      </Card>
                    </div>

                    {forecastStats.topProducts && forecastStats.topProducts.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Most Requested Products
                        </h3>
                        <div className="space-y-2">
                          {forecastStats.topProducts.map((item: { product: string; count: number }, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <span className="font-medium">{item.product}</span>
                              <Badge variant="secondary">{item.count} request{item.count !== 1 ? "s" : ""}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="bg-muted/30 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Platform Insights</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>Demand forecasting connects buyers with sellers for future supply planning</li>
                        <li>Sellers respond with indicative pricing to buyer demand requests</li>
                        <li>Accepted responses can be converted into subscriptions, contracts, or Co-Op orders</li>
                        {forecastStats.conversionRate > 0 && (
                          <li className="text-green-600">
                            {forecastStats.conversionRate.toFixed(1)}% of forecasts have led to successful conversions
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No forecasting data available yet</p>
                    <p className="text-sm">Forecasts will appear here once buyers start posting demand</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transport" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Transport Management Overview
                </CardTitle>
                <CardDescription>Monitor transport jobs, disputes, and logistics partner performance</CardDescription>
              </CardHeader>
              <CardContent>
                {transportStatsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : transportStats ? (
                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Jobs</p>
                              <div className="text-2xl font-bold">{transportStats.totalJobs}</div>
                            </div>
                            <Truck className="h-8 w-8 text-primary/50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Active Jobs</p>
                              <div className="text-2xl font-bold text-green-600">{transportStats.activeJobs}</div>
                            </div>
                            <Clock className="h-8 w-8 text-green-500/50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Completed</p>
                              <div className="text-2xl font-bold text-blue-600">{transportStats.completedJobs}</div>
                            </div>
                            <CheckCircle className="h-8 w-8 text-blue-500/50" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Escrow Balance</p>
                              <div className="text-2xl font-bold text-amber-600">K{transportStats.escrowBalance.toLocaleString()}</div>
                            </div>
                            <DollarSign className="h-8 w-8 text-amber-500/50" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Dispute Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Total Disputes</p>
                              <p className="text-xl font-bold">{transportStats.totalDisputes}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Open Disputes</p>
                              <p className="text-xl font-bold text-red-500">{transportStats.openDisputes}</p>
                            </div>
                            {transportStats.openDisputes > 0 && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Needs Attention
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Logistics Partner Performance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-muted-foreground">Avg Delivery Time</p>
                              <p className="text-xl font-bold">{transportStats.avgDeliveryTime > 0 ? `${transportStats.avgDeliveryTime.toFixed(1)} hrs` : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Reliable Partners</p>
                              <p className="text-xl font-bold text-green-600">{transportStats.reliableTransporters}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <BarChart3 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Transport Completion Rate</p>
                            <p className="text-sm text-muted-foreground">
                              {transportStats.totalJobs > 0 
                                ? `${((transportStats.completedJobs / transportStats.totalJobs) * 100).toFixed(1)}% of jobs completed successfully`
                                : 'No transport data available yet'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No transport data available yet</p>
                    <p className="text-sm">Transport jobs will appear here once created</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={gradeDisputeDialogOpen} onOpenChange={setGradeDisputeDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Grade Dispute</DialogTitle>
              <DialogDescription>
                Review the evidence and make a decision on this quality grading dispute.
              </DialogDescription>
            </DialogHeader>
            {selectedGradeDispute && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Claimed Grade</Label>
                    <Badge className={`mt-1 ${
                      selectedGradeDispute.claimedGrade === 'A' ? 'bg-green-500' :
                      selectedGradeDispute.claimedGrade === 'C' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                      Grade {selectedGradeDispute.claimedGrade}
                    </Badge>
                  </div>
                  <div>
                    <Label>Actual Grade</Label>
                    <Badge className={`mt-1 ${
                      selectedGradeDispute.actualGrade === 'A' ? 'bg-green-500' :
                      selectedGradeDispute.actualGrade === 'C' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}>
                      Grade {selectedGradeDispute.actualGrade}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Label>Decision:</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={buyerWins ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBuyerWins(true)}
                    >
                      Buyer Wins
                    </Button>
                    <Button
                      variant={!buyerWins ? "default" : "outline"}
                      size="sm"
                      onClick={() => setBuyerWins(false)}
                    >
                      Seller Wins
                    </Button>
                  </div>
                </div>

                {buyerWins && (
                  <div>
                    <Label>Refund Percentage (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={refundPercentage}
                      onChange={(e) => setRefundPercentage(e.target.value)}
                      placeholder="0-100"
                    />
                  </div>
                )}

                <div>
                  <Label>Resolution Notes</Label>
                  <Textarea
                    value={gradeResolution}
                    onChange={(e) => setGradeResolution(e.target.value)}
                    placeholder="Explain your decision..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setGradeDisputeDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedGradeDispute && gradeResolution) {
                    resolveGradeDisputeMutation.mutate({
                      id: selectedGradeDispute.id,
                      resolution: gradeResolution,
                      buyerWins,
                      refundPercentage
                    });
                  }
                }}
                disabled={!gradeResolution || resolveGradeDisputeMutation.isPending}
              >
                {resolveGradeDisputeMutation.isPending ? "Resolving..." : "Resolve Dispute"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
