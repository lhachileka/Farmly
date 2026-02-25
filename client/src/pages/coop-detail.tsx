import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { coopsApi, type Coop, type CoopMember, type User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Users, MapPin, Package, ArrowLeft, BadgeCheck, Calendar, CheckCircle2, Clock, AlertCircle, Truck, DollarSign, Wheat, Leaf, Drumstick, Factory } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

const categoryIcons = {
  produce: Leaf,
  livestock: Drumstick,
  grains: Wheat,
  processed: Factory,
};

const statusColors = {
  recruiting: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  order_placed: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  in_delivery: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  fulfilled: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const memberStatusIcons = {
  pending: Clock,
  ready: CheckCircle2,
  delivered: Truck,
  failed: AlertCircle,
};

const memberStatusColors = {
  pending: "text-yellow-600",
  ready: "text-green-600",
  delivered: "text-blue-600",
  failed: "text-red-600",
};

export default function CoopDetailPage() {
  const [, params] = useRoute("/coops/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [joinQuantity, setJoinQuantity] = useState("");
  const [joinNotes, setJoinNotes] = useState("");
  const [orderQuantity, setOrderQuantity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
  });

  const { data: coop, isLoading } = useQuery({
    queryKey: ["/api/coops", params?.id],
    queryFn: () => coopsApi.getById(params!.id),
    enabled: !!params?.id,
  });

  const joinMutation = useMutation({
    mutationFn: (data: { committedQuantity: string; notes?: string }) => 
      coopsApi.join(params!.id, data),
    onSuccess: () => {
      toast({ title: "Joined Co-Op", description: "You have successfully joined this co-op" });
      queryClient.invalidateQueries({ queryKey: ["/api/coops", params?.id] });
      setJoinDialogOpen(false);
      setJoinQuantity("");
      setJoinNotes("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: (memberId: string) => coopsApi.markReady(params!.id, memberId),
    onSuccess: () => {
      toast({ title: "Marked Ready", description: "Your produce is marked as ready for delivery" });
      queryClient.invalidateQueries({ queryKey: ["/api/coops", params?.id] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const placeOrderMutation = useMutation({
    mutationFn: (data: { quantity: string; deliveryAddress: string; buyerNotes?: string }) => 
      coopsApi.placeOrder(params!.id, data),
    onSuccess: () => {
      toast({ title: "Order Placed", description: "Your order has been placed. Please fund the escrow to proceed." });
      queryClient.invalidateQueries({ queryKey: ["/api/coops", params?.id] });
      setOrderDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!coop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Co-Op Not Found</h3>
            <p className="text-muted-foreground mb-4">This co-op may have been removed or doesn't exist.</p>
            <Button onClick={() => navigate("/coops")}>Back to Co-Ops</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const CategoryIcon = categoryIcons[coop.productType] || Package;
  const pricePerUnit = parseFloat(coop.pricePerUnit);
  const targetQuantity = parseFloat(coop.targetQuantity);
  const currentQuantity = parseFloat(coop.currentQuantity);
  const totalValue = pricePerUnit * targetQuantity;
  const remaining = targetQuantity - currentQuantity;

  const isMember = coop.members?.some(m => m.sellerId === currentUser?.id);
  const myMembership = coop.members?.find(m => m.sellerId === currentUser?.id);
  const canJoin = currentUser?.role === "farmer" && coop.status === "recruiting" && !isMember;
  const canOrder = currentUser?.role === "buyer" && coop.status === "active";

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate("/coops")} className="mb-4" data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Co-Ops
      </Button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
                    <CategoryIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl" data-testid="text-coop-title">{coop.title}</CardTitle>
                    <CardDescription className="text-base">{coop.productName}</CardDescription>
                  </div>
                </div>
                <Badge className={statusColors[coop.status]} data-testid="badge-status">
                  {coop.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{coop.description}</p>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span>{coop.location}</span>
              </div>

              {coop.availableFrom && coop.availableUntil && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Available: {format(new Date(coop.availableFrom), "MMM d")} - {format(new Date(coop.availableUntil), "MMM d, yyyy")}
                  </span>
                </div>
              )}

              {coop.qualityStandards && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Quality Standards</h4>
                  <p className="text-sm text-muted-foreground">{coop.qualityStandards}</p>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Co-Op Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Target: {targetQuantity.toLocaleString()} {coop.unit}</span>
                    <span className="font-medium">{coop.percentFilled || 0}% filled</span>
                  </div>
                  <Progress value={coop.percentFilled || 0} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current: {currentQuantity.toLocaleString()} {coop.unit}</span>
                    <span>Remaining: {remaining.toLocaleString()} {coop.unit}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Members ({coop.members?.length || 0})
              </CardTitle>
              <CardDescription>Producers contributing to this co-op</CardDescription>
            </CardHeader>
            <CardContent>
              {!coop.members || coop.members.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No members yet</p>
              ) : (
                <div className="space-y-3">
                  {coop.members.map((member) => {
                    const StatusIcon = memberStatusIcons[member.status] || Clock;
                    const isLeader = member.sellerId === coop.leaderId;
                    const isMe = member.sellerId === currentUser?.id;
                    
                    return (
                      <div 
                        key={member.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${isMe ? 'bg-primary/5 border-primary/20' : ''}`}
                        data-testid={`member-${member.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${memberStatusColors[member.status]} bg-opacity-10`}>
                            <StatusIcon className={`w-4 h-4 ${memberStatusColors[member.status]}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{member.seller?.name || "Unknown"}</span>
                              {isLeader && <Badge variant="secondary">Leader</Badge>}
                              {isMe && <Badge>You</Badge>}
                              {member.seller?.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {member.seller?.location} • {parseFloat(member.committedQuantity).toLocaleString()} {coop.unit}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="capitalize">
                            {member.status}
                          </Badge>
                          {isMe && member.status === "pending" && coop.status === "order_placed" && (
                            <Button 
                              size="sm" 
                              className="ml-2"
                              onClick={() => markReadyMutation.mutate(member.id)}
                              disabled={markReadyMutation.isPending}
                            >
                              Mark Ready
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per {coop.unit}</span>
                <span className="font-bold text-lg">K{pricePerUnit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Quantity</span>
                <span>{targetQuantity.toLocaleString()} {coop.unit}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Total Value</span>
                <span className="font-bold text-xl text-green-600">K{totalValue.toLocaleString()}</span>
              </div>

              {coop.minContribution && (
                <div className="text-sm text-muted-foreground">
                  Min contribution: {parseFloat(coop.minContribution).toLocaleString()} {coop.unit}
                </div>
              )}
              {coop.maxContribution && (
                <div className="text-sm text-muted-foreground">
                  Max contribution: {parseFloat(coop.maxContribution).toLocaleString()} {coop.unit}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-3">
              {canJoin && (
                <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-join-coop">
                      <Users className="w-4 h-4 mr-2" />
                      Join This Co-Op
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Join Co-Op</DialogTitle>
                      <DialogDescription>
                        Commit to contributing produce to "{coop.title}"
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity to Contribute ({coop.unit})</Label>
                        <Input
                          id="quantity"
                          type="number"
                          placeholder={`Max: ${remaining.toLocaleString()}`}
                          value={joinQuantity}
                          onChange={(e) => setJoinQuantity(e.target.value)}
                          data-testid="input-join-quantity"
                        />
                        <p className="text-xs text-muted-foreground">
                          {coop.minContribution && `Min: ${parseFloat(coop.minContribution).toLocaleString()} ${coop.unit}`}
                          {coop.minContribution && coop.maxContribution && " • "}
                          {coop.maxContribution && `Max: ${parseFloat(coop.maxContribution).toLocaleString()} ${coop.unit}`}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any additional information about your contribution..."
                          value={joinNotes}
                          onChange={(e) => setJoinNotes(e.target.value)}
                        />
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          Your share: K{(parseFloat(joinQuantity || "0") * pricePerUnit).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={() => joinMutation.mutate({ committedQuantity: joinQuantity, notes: joinNotes })}
                        disabled={joinMutation.isPending || !joinQuantity}
                        data-testid="button-confirm-join"
                      >
                        {joinMutation.isPending ? "Joining..." : "Confirm Join"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {canOrder && (
                <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-place-order">
                      <Package className="w-4 h-4 mr-2" />
                      Place Order
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Place Order</DialogTitle>
                      <DialogDescription>
                        Order from this co-op. Escrow will be required to proceed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="orderQty">Quantity ({coop.unit})</Label>
                        <Input
                          id="orderQty"
                          type="number"
                          placeholder={`Available: ${currentQuantity.toLocaleString()}`}
                          value={orderQuantity}
                          onChange={(e) => setOrderQuantity(e.target.value)}
                          data-testid="input-order-quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address</Label>
                        <Textarea
                          id="address"
                          placeholder="Full delivery address..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          data-testid="input-delivery-address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="buyerNotes">Notes (optional)</Label>
                        <Textarea
                          id="buyerNotes"
                          placeholder="Special delivery instructions..."
                          value={buyerNotes}
                          onChange={(e) => setBuyerNotes(e.target.value)}
                        />
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex justify-between font-medium">
                          <span>Total Amount</span>
                          <span>K{(parseFloat(orderQuantity || "0") * pricePerUnit).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          This amount will be held in escrow until delivery is confirmed
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={() => placeOrderMutation.mutate({ 
                          quantity: orderQuantity, 
                          deliveryAddress, 
                          buyerNotes 
                        })}
                        disabled={placeOrderMutation.isPending || !orderQuantity || !deliveryAddress}
                        data-testid="button-confirm-order"
                      >
                        {placeOrderMutation.isPending ? "Placing..." : "Place Order"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {isMember && (
                <div className="w-full p-3 bg-primary/5 rounded-lg text-center">
                  <p className="text-sm font-medium">You are a member of this co-op</p>
                  <p className="text-xs text-muted-foreground">
                    Your contribution: {parseFloat(myMembership?.committedQuantity || "0").toLocaleString()} {coop.unit}
                  </p>
                </div>
              )}
            </CardFooter>
          </Card>

          {coop.leader && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Co-Op Leader</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{coop.leader.name}</span>
                      {coop.leader.verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="text-sm text-muted-foreground">{coop.leader.location}</div>
                    <div className="text-sm text-yellow-600">★ {parseFloat(coop.leader.rating).toFixed(1)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
