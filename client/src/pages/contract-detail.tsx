import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authApi, contractsApi, recurringOrdersApi, type RecurringOrder } from "@/lib/api";
import { 
  FileText, Calendar, DollarSign, Package, CheckCircle, Clock, 
  AlertTriangle, ArrowLeft, TrendingUp, Shield, Loader2, XCircle
} from "lucide-react";
import { useState } from "react";

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
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function DeliveryCard({ order, isBuyer, onConfirm, onFund }: { 
  order: RecurringOrder; 
  isBuyer: boolean;
  onConfirm: (id: string, confirmation: string, notes?: string) => void;
  onFund: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const isPast = new Date(order.scheduledDate) < new Date();
  const isUpcoming = !isPast && order.status === "pending";

  return (
    <Card className={`transition-all ${isPast && order.status === "pending" ? "border-red-200 bg-red-50/50" : ""}`} data-testid={`card-delivery-${order.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              order.status === "completed" ? "bg-green-100 text-green-700" : 
              isPast && order.status === "pending" ? "bg-red-100 text-red-700" :
              "bg-muted text-muted-foreground"
            }`}>
              #{order.deliveryNumber}
            </div>
            <div>
              <p className="font-medium">{new Date(order.scheduledDate).toLocaleDateString()}</p>
              <p className="text-sm text-muted-foreground">K{order.escrowAmount.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {order.escrowFunded && (
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <Shield className="w-3 h-3 mr-1" />
                Funded
              </Badge>
            )}
            {getStatusBadge(order.status)}
          </div>
        </div>

        {isBuyer && order.status === "pending" && (
          <div className="mt-4 flex gap-2">
            {!order.escrowFunded && (
              <Button size="sm" variant="outline" onClick={() => onFund(order.id)} data-testid={`button-fund-${order.id}`}>
                <DollarSign className="w-4 h-4 mr-1" />
                Fund Escrow
              </Button>
            )}
            {order.escrowFunded && isPast && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid={`button-confirm-${order.id}`}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Confirm Delivery
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Delivery</DialogTitle>
                    <DialogDescription>
                      How was the delivery for this order?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notes (optional)</label>
                      <Textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes about the delivery..."
                      />
                    </div>
                  </div>
                  <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        onConfirm(order.id, "not_delivered", notes);
                        setDialogOpen(false);
                      }}
                    >
                      Not Delivered
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        onConfirm(order.id, "delivered_with_issues", notes);
                        setDialogOpen(false);
                      }}
                    >
                      Delivered with Issues
                    </Button>
                    <Button 
                      onClick={() => {
                        onConfirm(order.id, "delivered_as_agreed", notes);
                        setDialogOpen(false);
                      }}
                    >
                      Delivered as Agreed
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}

        {order.deliveryConfirmation && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-sm">
              <span className="font-medium">Confirmation: </span>
              {order.deliveryConfirmation.replace(/_/g, " ")}
            </p>
            {order.confirmationNotes && (
              <p className="text-sm text-muted-foreground mt-1">{order.confirmationNotes}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const { data: contract, isLoading: contractLoading } = useQuery({
    queryKey: ["/api/contracts", id],
    queryFn: () => contractsApi.getById(id!),
    enabled: !!id && !!currentUser,
  });

  const confirmMutation = useMutation({
    mutationFn: (data: { id: string; confirmation: string; notes?: string }) =>
      recurringOrdersApi.confirmDelivery(data.id, data.confirmation as any, data.notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", id] });
      toast({ title: "Delivery Confirmed", description: "The delivery status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to confirm delivery", variant: "destructive" });
    },
  });

  const fundMutation = useMutation({
    mutationFn: (orderId: string) => recurringOrdersApi.fundEscrow(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", id] });
      toast({ title: "Escrow Funded", description: "Payment has been secured in escrow." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to fund escrow", variant: "destructive" });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: () => contractsApi.updateStatus(id!, "paused"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts", id] });
      toast({ title: "Contract Paused", description: "The contract has been paused." });
    },
  });

  if (!currentUser && !userLoading) {
    setLocation("/auth");
    return null;
  }

  if (userLoading || contractLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!contract) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Contract Not Found</h1>
          <Button onClick={() => setLocation("/contracts")}>Back to Contracts</Button>
        </div>
      </Layout>
    );
  }

  const isBuyer = contract.buyerId === currentUser?.id;
  const progress = Math.round((contract.completedDeliveries / contract.totalDeliveries) * 100);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/contracts")} 
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Contracts
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <FileText className="w-6 h-6" />
                      Supply Contract
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {contract.pricingModel.replace("_", " ")} • {contract.frequency} deliveries
                    </CardDescription>
                  </div>
                  {getStatusBadge(contract.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Contract Period</p>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4" />
                      K{contract.totalValue.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Progress</span>
                    <span className="font-medium">{contract.completedDeliveries}/{contract.totalDeliveries} ({progress}%)</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Contract Items
                  </h3>
                  <div className="space-y-3">
                    {contract.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantityPerDelivery} {item.unit} per delivery
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">K{item.fixedPrice?.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">per {item.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Scheduled Deliveries
                </CardTitle>
                <CardDescription>
                  Track and confirm your deliveries
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.recurringOrders?.map(order => (
                  <DeliveryCard 
                    key={order.id} 
                    order={order} 
                    isBuyer={isBuyer}
                    onConfirm={(id, conf, notes) => confirmMutation.mutate({ id, confirmation: conf, notes })}
                    onFund={(id) => fundMutation.mutate(id)}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{isBuyer ? "Seller" : "Buyer"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {(isBuyer ? contract.seller : contract.buyer).name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{(isBuyer ? contract.seller : contract.buyer).name}</p>
                    <p className="text-sm text-muted-foreground">{(isBuyer ? contract.seller : contract.buyer).location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Escrow Protection</CardTitle>
                <CardDescription>
                  {contract.escrowScheduleType.replace(/_/g, " ")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 text-green-700">
                  <Shield className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Protected Payments</p>
                    <p className="text-sm">Funds released after delivery confirmation</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Auto-release after {contract.autoReleaseHours} hours if buyer is inactive.
                </p>
              </CardContent>
            </Card>

            {contract.status === "active" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contract Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => pauseMutation.mutate()}
                    disabled={pauseMutation.isPending}
                    data-testid="button-pause-contract"
                  >
                    {pauseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Pause Contract
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
