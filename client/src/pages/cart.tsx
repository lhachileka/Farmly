import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Plus, Minus, Loader2, ShoppingBag } from "lucide-react";
import { cartApi, authApi, type CartItem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const { data: cartItems = [], isLoading: cartLoading } = useQuery({
    queryKey: ["/api/cart"],
    queryFn: cartApi.getItems,
    enabled: !!currentUser,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartApi.updateItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
    },
    onError: () => {
      toast({ title: "Failed to update quantity", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => cartApi.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Item removed from cart" });
    },
    onError: () => {
      toast({ title: "Failed to remove item", variant: "destructive" });
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => cartApi.clear(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      toast({ title: "Cart cleared" });
    },
    onError: () => {
      toast({ title: "Failed to clear cart", variant: "destructive" });
    },
  });

  if (userLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded w-32" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-lg border bg-card p-4">
              <div className="h-20 w-20 bg-muted animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-5 bg-muted animate-pulse rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  // Show sign-in prompt for guests
  if (!currentUser) {
    return (
      <Layout>
        <div className="bg-muted/30 py-8 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-2">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <h1 className="font-heading text-3xl font-bold">Shopping Cart</h1>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Sign in to view your cart</h2>
              <p className="text-muted-foreground mb-6">Create an account or sign in to add items and checkout.</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setLocation("/auth")} data-testid="button-signin">
                  Sign In
                </Button>
                <Button variant="outline" onClick={() => setLocation("/marketplace")} data-testid="button-browse">
                  Browse Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (cartLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 space-y-4">
          <div className="h-8 bg-muted animate-pulse rounded w-32" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-lg border bg-card p-4">
              <div className="h-20 w-20 bg-muted animate-pulse rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                <div className="h-5 bg-muted animate-pulse rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0);
  const serviceFee = subtotal * 0.02;
  const total = subtotal + serviceFee;

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="font-heading text-3xl font-bold">Shopping Cart</h1>
          </div>
          <p className="text-muted-foreground">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in your cart
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Browse the marketplace to add products to your cart.</p>
              <Button onClick={() => setLocation("/marketplace")} data-testid="button-browse">
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} data-testid={`cart-item-${item.id}`}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={item.listing.images[0] || "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=200"}
                        alt={item.listing.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{item.listing.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.listing.location}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeMutation.mutate(item.id)}
                            data-testid={`button-remove-${item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateMutation.mutate({ 
                                id: item.id, 
                                quantity: Math.max(item.listing.minOrder, item.quantity - 1) 
                              })}
                              data-testid={`button-decrease-${item.id}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-12 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateMutation.mutate({ 
                                id: item.id, 
                                quantity: Math.min(item.listing.quantity, item.quantity + 1) 
                              })}
                              data-testid={`button-increase-${item.id}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm text-muted-foreground ml-2">{item.listing.unit}s</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-primary">
                              K{(item.listing.price * item.quantity).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              K{item.listing.price}/{item.listing.unit}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="text-destructive"
                  onClick={() => clearMutation.mutate()}
                  data-testid="button-clear-cart"
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>K{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service Fee (2%)</span>
                      <span>K{serviceFee.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">K{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 text-lg font-bold" 
                    onClick={() => setLocation("/checkout")}
                    data-testid="button-checkout"
                  >
                    Proceed to Checkout
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Payments are held in escrow until delivery is confirmed
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
