import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { authApi, subscriptionsApi, contractsApi, type Subscription, type Contract } from "@/lib/api";
import { FileText, Clock, CheckCircle, XCircle, AlertTriangle, Calendar, DollarSign, Package, Loader2 } from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "active":
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    case "completed":
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case "cancelled":
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
    case "breached":
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" />Breached</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SubscriptionCard({ subscription, isSeller, onRespond }: { 
  subscription: Subscription; 
  isSeller: boolean;
  onRespond?: (id: string, action: "accept" | "reject", response?: string) => void;
}) {
  const [, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [pricingModel, setPricingModel] = useState("fixed_price");

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-subscription-${subscription.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Subscription Request</CardTitle>
          {getStatusBadge(subscription.status)}
        </div>
        <CardDescription>
          {subscription.frequency} delivery for {subscription.durationWeeks} weeks
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(subscription.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        {subscription.message && (
          <p className="text-sm bg-muted/50 p-3 rounded-lg">{subscription.message}</p>
        )}
        
        {subscription.sellerResponse && (
          <p className="text-sm bg-primary/5 p-3 rounded-lg">
            <span className="font-medium">Response: </span>{subscription.sellerResponse}
          </p>
        )}

        <div className="flex gap-2">
          {isSeller && subscription.status === "pending" && onRespond && (
            <>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid={`button-accept-${subscription.id}`}>Accept</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Accept Subscription</DialogTitle>
                    <DialogDescription>
                      Configure the contract terms before accepting.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Pricing Model</label>
                      <Select value={pricingModel} onValueChange={setPricingModel}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed_price">Fixed Price</SelectItem>
                          <SelectItem value="price_range">Price Range</SelectItem>
                          <SelectItem value="volume_commitment">Volume Commitment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Response Message (optional)</label>
                      <Textarea 
                        value={responseText} 
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Add a message to the buyer..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                      onRespond(subscription.id, "accept", responseText);
                      setDialogOpen(false);
                    }}>
                      Create Contract
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => onRespond(subscription.id, "reject")}
                data-testid={`button-reject-${subscription.id}`}
              >
                Decline
              </Button>
            </>
          )}
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setLocation(`/subscriptions/${subscription.id}`)}
            data-testid={`button-view-${subscription.id}`}
          >
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContractCard({ contract }: { contract: Contract }) {
  const [, setLocation] = useLocation();
  const progress = Math.round((contract.completedDeliveries / contract.totalDeliveries) * 100);

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`card-contract-${contract.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Supply Contract
          </CardTitle>
          {getStatusBadge(contract.status)}
        </div>
        <CardDescription>
          {contract.pricingModel.replace("_", " ")} • {contract.frequency} deliveries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span>K{contract.totalValue.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Deliveries Progress</span>
            <span>{contract.completedDeliveries}/{contract.totalDeliveries}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Button 
          className="w-full" 
          variant="outline"
          onClick={() => setLocation(`/contracts/${contract.id}`)}
          data-testid={`button-view-contract-${contract.id}`}
        >
          View Contract
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ContractsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ["/api/subscriptions"],
    queryFn: subscriptionsApi.getAll,
    enabled: !!currentUser,
  });

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/contracts"],
    queryFn: contractsApi.getAll,
    enabled: !!currentUser,
  });

  const respondMutation = useMutation({
    mutationFn: (data: { id: string; action: "accept" | "reject"; response?: string }) =>
      subscriptionsApi.respond(data.id, { action: data.action, response: data.response }),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: variables.action === "accept" ? "Contract Created" : "Subscription Declined",
        description: variables.action === "accept" 
          ? "The supply contract is now active."
          : "The subscription request has been declined.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to respond to subscription", variant: "destructive" });
    },
  });

  if (!currentUser && !userLoading) {
    setLocation("/auth");
    return null;
  }

  if (userLoading || subsLoading || contractsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const allSubscriptions = [...(subscriptions?.asBuyer || []), ...(subscriptions?.asSeller || [])];
  const allContracts = [...(contracts?.asBuyer || []), ...(contracts?.asSeller || [])];
  const pendingSubscriptions = subscriptions?.asSeller?.filter(s => s.status === "pending") || [];
  const activeContracts = allContracts.filter(c => c.status === "active");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Contracts & Subscriptions</h1>
            <p className="text-muted-foreground mt-1">Manage your supply agreements and subscription requests</p>
          </div>
          <Button onClick={() => setLocation("/marketplace")} data-testid="button-new-subscription">
            <Package className="w-4 h-4 mr-2" />
            Browse Sellers
          </Button>
        </div>

        {pendingSubscriptions.length > 0 && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Pending Requests
              </CardTitle>
              <CardDescription>You have {pendingSubscriptions.length} subscription request(s) waiting for your response</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Tabs defaultValue="contracts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="contracts" data-testid="tab-contracts">
              Active Contracts ({activeContracts.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              Subscriptions ({allSubscriptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contracts">
            {activeContracts.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Contracts</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any active supply contracts yet.
                  </p>
                  <Button onClick={() => setLocation("/marketplace")}>
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeContracts.map(contract => (
                  <ContractCard key={contract.id} contract={contract} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="space-y-6">
              {currentUser?.role === "farmer" && pendingSubscriptions.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingSubscriptions.map(sub => (
                      <SubscriptionCard 
                        key={sub.id} 
                        subscription={sub} 
                        isSeller={true}
                        onRespond={(id, action, response) => 
                          respondMutation.mutate({ id, action, response })
                        }
                      />
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">All Subscriptions</h3>
                {allSubscriptions.length === 0 ? (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Subscriptions</h3>
                      <p className="text-muted-foreground">
                        You haven't created or received any subscription requests yet.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allSubscriptions.map(sub => (
                      <SubscriptionCard 
                        key={sub.id} 
                        subscription={sub} 
                        isSeller={sub.sellerId === currentUser?.id}
                        onRespond={sub.status === "pending" ? (id, action, response) => 
                          respondMutation.mutate({ id, action, response })
                        : undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
