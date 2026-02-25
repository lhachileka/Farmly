import { Link, useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Star, ShieldCheck, Truck, Scale, Calendar, Loader2, MessageCircle, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { FavoriteButton } from "@/components/favorite-button";
import { SellerTrustBadge } from "@/components/seller-trust-badge";
import { listingsApi, bidsApi, authApi, cartApi, chatApi, type Bid } from "@/lib/api";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import NotFound from "@/pages/not-found";

export default function ProductDetails() {
  const [match, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [bidQty, setBidQty] = useState("");
  const [bidMessage, setBidMessage] = useState("");
  
  const { data: product, isLoading } = useQuery({
    queryKey: ["/api/listings", id],
    queryFn: () => listingsApi.getById(id!),
    enabled: !!id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
  });

  const { data: bids = [] } = useQuery({
    queryKey: ["/api/listings", id, "bids"],
    queryFn: () => bidsApi.getForListing(id!),
    enabled: !!id,
  });

  const { data: sellerBadges = [] } = useQuery({
    queryKey: ["/api/users", product?.sellerId, "badges"],
    queryFn: async () => {
      const res = await fetch(`/api/users/${product?.sellerId}/badges`);
      return res.json();
    },
    enabled: !!product?.sellerId,
  });

  const bidMutation = useMutation({
    mutationFn: (data: { listingId: string; amount: number; quantity: number; message?: string }) =>
      bidsApi.create(data),
    onSuccess: () => {
      toast({ title: "Bid submitted successfully" });
      setBidDialogOpen(false);
      setBidAmount("");
      setBidQty("");
      setBidMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/listings", id, "bids"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit bid. Please log in first.", variant: "destructive" });
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ listingId, quantity }: { listingId: string; quantity: number }) =>
      cartApi.addItem(listingId, quantity),
    onSuccess: () => {
      toast({ title: "Added to cart", description: "Item has been added to your cart." });
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add to cart. Please log in first.", variant: "destructive" });
    },
  });

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    bidMutation.mutate({
      listingId: id,
      amount: parseInt(bidAmount),
      quantity: parseInt(bidQty),
      message: bidMessage || undefined,
    });
  };

  const [orderQty, setOrderQty] = useState<number>(1);

  React.useEffect(() => {
    if (product && orderQty < product.minOrder) {
      setOrderQty(product.minOrder);
    }
  }, [product]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!product) return <NotFound />;

  const totalPrice = product.price * orderQty;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Link href="/marketplace">
          <Button variant="ghost" size="sm" className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Marketplace
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery */}
            <div className="rounded-2xl overflow-hidden border bg-muted aspect-video relative">
              <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge 
                  className={`text-lg px-3 py-1 font-bold ${
                    (product as any).grade === 'A' ? 'bg-green-500 hover:bg-green-600' :
                    (product as any).grade === 'C' ? 'bg-orange-500 hover:bg-orange-600' :
                    'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                  data-testid="badge-product-grade"
                >
                  Grade {(product as any).grade || 'B'}
                </Badge>
                {product.organic && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-lg px-3 py-1">Organic</Badge>
                )}
              </div>
            </div>

            {/* Product Info */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <div>
                   <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-2">{product.title}</h1>
                   <div className="flex items-center gap-4 text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> {product.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Harvest: {product.harvestDate}
                      </div>
                   </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">K{product.price}</div>
                  <div className="text-muted-foreground">per {product.unit}</div>
                </div>
              </div>

              <Separator className="my-6" />

              <Tabs defaultValue="details">
                <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto gap-8">
                  <TabsTrigger 
                    value="details" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0 font-medium text-base text-muted-foreground data-[state=active]:text-foreground"
                  >
                    Product Details
                  </TabsTrigger>
                  <TabsTrigger 
                    value="reviews" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0 font-medium text-base text-muted-foreground data-[state=active]:text-foreground"
                  >
                    Reviews
                  </TabsTrigger>
                  <TabsTrigger 
                    value="shipping" 
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0 font-medium text-base text-muted-foreground data-[state=active]:text-foreground"
                  >
                    Logistics & Shipping
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="pt-6">
                  <p className="text-lg leading-relaxed text-muted-foreground mb-6">
                    {product.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-muted/30 border-none shadow-none">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Scale className="h-8 w-8 text-primary/60" />
                        <div>
                          <div className="text-sm text-muted-foreground">Available Quantity</div>
                          <div className="font-semibold">{product.quantity} {product.unit}s</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-none shadow-none">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Truck className="h-8 w-8 text-primary/60" />
                        <div>
                          <div className="text-sm text-muted-foreground">Minimum Order</div>
                          <div className="font-semibold">{product.minOrder} {product.unit}s</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="pt-6">
                  <div className="text-muted-foreground italic">No reviews yet for this specific listing.</div>
                </TabsContent>
                <TabsContent value="shipping" className="pt-6">
                  <div className="space-y-4">
                    <Alert>
                      <Truck className="h-4 w-4" />
                      <AlertTitle>Logistics Partner Available</AlertTitle>
                      <AlertDescription>
                        We can arrange transport for this order through our verified logistics partners. Cost will be calculated at checkout.
                      </AlertDescription>
                    </Alert>
                    <p className="text-muted-foreground">Pickup is available from {product.location}.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/10 shadow-xl shadow-primary/5">
              <CardHeader className="bg-muted/30 pb-4 border-b">
                <CardTitle className="text-lg">Place Order</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantity ({product.unit}s)</label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => setOrderQty(Math.max(product.minOrder, orderQty - 1))}>-</Button>
                    <Input 
                      type="number" 
                      value={orderQty} 
                      onChange={(e) => setOrderQty(Math.max(product.minOrder, parseInt(e.target.value) || product.minOrder))} 
                      className="text-center font-bold text-lg"
                    />
                    <Button variant="outline" size="icon" onClick={() => setOrderQty(Math.min(product.quantity, orderQty + 1))}>+</Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    Min order: {product.minOrder} • Max: {product.quantity}
                  </div>
                </div>

                <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>K{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee (2%)</span>
                    <span>K{(totalPrice * 0.02).toLocaleString()}</span>
                  </div>
                  <Separator className="bg-border/50" />
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Total</span>
                    <span>K{(totalPrice * 1.02).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                    data-testid="button-add-cart"
                    onClick={() => addToCartMutation.mutate({ listingId: product.id, quantity: orderQty })}
                    disabled={addToCartMutation.isPending}
                  >
                    {addToCartMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add to Cart
                  </Button>
                  <FavoriteButton listingId={product.id} variant="default" size="lg" />
                </div>
                <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" data-testid="button-make-bid">
                      Make a Bid
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Make a Bid</DialogTitle>
                      <DialogDescription>
                        Submit your offer for {product.title}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBidSubmit} className="space-y-4">
                      <div>
                        <Label htmlFor="bidAmount">Your Price (K per {product.unit})</Label>
                        <Input
                          id="bidAmount"
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={product.price.toString()}
                          required
                          data-testid="input-bid-amount"
                        />
                      </div>
                      <div>
                        <Label htmlFor="bidQty">Quantity ({product.unit}s)</Label>
                        <Input
                          id="bidQty"
                          type="number"
                          value={bidQty}
                          onChange={(e) => setBidQty(e.target.value)}
                          placeholder={product.minOrder.toString()}
                          min={product.minOrder}
                          max={product.quantity}
                          required
                          data-testid="input-bid-quantity"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Min: {product.minOrder} • Max: {product.quantity}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="bidMessage">Message (optional)</Label>
                        <Textarea
                          id="bidMessage"
                          value={bidMessage}
                          onChange={(e) => setBidMessage(e.target.value)}
                          placeholder="Add a note to the seller..."
                          data-testid="input-bid-message"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={bidMutation.isPending}
                        data-testid="button-submit-bid"
                      >
                        {bidMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Bid
                      </Button>
                    </form>
                    {bids.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-2">{bids.length} bid(s) on this item</p>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" /> Payments held in escrow until delivery.
                </div>
              </CardContent>
            </Card>

            {/* Seller Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                   <Avatar className="h-14 w-14 border-2 border-primary/10">
                      <AvatarImage src={product.seller.avatar} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{product.seller.name.charAt(0)}</AvatarFallback>
                   </Avatar>
                   <div>
                     <div className="font-heading font-semibold text-lg">{product.seller.name}</div>
                     <div className="text-sm text-muted-foreground capitalize">{product.seller.role} • {product.seller.location}</div>
                   </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mb-4 text-sm">
                   <div className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium dark:bg-amber-900/30 dark:text-amber-400">
                     <Star className="h-3.5 w-3.5 fill-current" /> {product.seller.rating} Rating
                   </div>
                   {product.seller.verified && (
                     <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                       <ShieldCheck className="h-3.5 w-3.5" /> Verified
                     </div>
                   )}
                </div>

                <div className="mb-4">
                  <SellerTrustBadge sellerId={product.sellerId} size="sm" />
                </div>

                {sellerBadges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {sellerBadges.map((badge: any) => (
                      <Badge 
                        key={badge.id}
                        className={
                          badge.badgeType === "trusted_supplier" 
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" 
                            : badge.badgeType === "contracted_seller"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }
                        data-testid={`badge-${badge.badgeType}`}
                      >
                        {badge.badgeType === "trusted_supplier" && "Trusted Supplier"}
                        {badge.badgeType === "contracted_seller" && "Contracted Seller"}
                        {badge.badgeType === "preferred_supplier" && "Preferred Supplier"}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={async () => {
                      if (!currentUser) {
                        setLocation("/auth");
                        return;
                      }
                      try {
                        const chat = await chatApi.createChat(product.sellerId, product.id);
                        setLocation(`/messages/${chat.id}`);
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Failed to start chat. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    data-testid="button-contact-seller"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message Seller
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={() => setLocation(`/subscribe/${product.sellerId}`)}
                    data-testid="button-subscribe-seller"
                  >
                    Subscribe
                  </Button>
                </div>
                <div className="mt-3 p-2 bg-muted/50 rounded text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  <span>For your protection, complete all purchases through Farmly. Off-app transactions are at your own risk.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
