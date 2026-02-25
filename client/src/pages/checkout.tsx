import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Loader2, 
  ShoppingBag,
  Shield,
  CheckCircle,
  ArrowLeft,
  Lock,
  Truck
} from "lucide-react";
import { cartApi, authApi, ordersApi, costSplitsApi, feesApi, type CartItem, type FeeCalculation } from "@/lib/api";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TransportCostSplit } from "@/components/transport-cost-split";

const paymentMethods = [
  { id: "airtel_money", name: "Airtel Money", icon: Smartphone, description: "Pay with Airtel Money mobile wallet" },
  { id: "mtn_money", name: "MTN Money", icon: Smartphone, description: "Pay with MTN Mobile Money" },
  { id: "zamtel_money", name: "Zamtel Money", icon: Smartphone, description: "Pay with Zamtel Kwacha" },
  { id: "bank_transfer", name: "Bank Transfer", icon: Building2, description: "Direct bank transfer" },
  { id: "debit_card", name: "Debit Card", icon: CreditCard, description: "Visa or Mastercard" },
] as const;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("airtel_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [createdOrders, setCreatedOrders] = useState<any[]>([]);
  const [includeTransport, setIncludeTransport] = useState(false);
  const [transportSplit, setTransportSplit] = useState({
    splitMode: "buyer_pays",
    buyerPercentage: 100,
    farmerPercentage: 0,
  });

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

  // Calculate dynamic subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + (item.listing.price * item.quantity), 0);
  const estimatedTransportCost = Math.round(subtotal * 0.08);

  // Get unique seller IDs from cart
  const sellerIds = Array.from(new Set(cartItems.map(item => item.listing.sellerId)));
  const primarySellerId = sellerIds[0];

  // Fetch dynamic fee calculations
  const { data: feeCalculation, isLoading: feesLoading } = useQuery({
    queryKey: ["/api/fees/calculate", subtotal, primarySellerId, includeTransport, estimatedTransportCost],
    queryFn: () => feesApi.calculateFees({
      amount: subtotal,
      sellerId: primarySellerId,
      isContract: false,
      transportCost: includeTransport ? estimatedTransportCost : undefined,
    }),
    enabled: !!currentUser && cartItems.length > 0 && !!primarySellerId && subtotal > 0,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const result = await ordersApi.checkout({
        deliveryAddress,
        deliveryPhone,
        notes: notes || undefined,
        paymentMethod: paymentMethod as any,
        phoneNumber: phoneNumber || undefined,
        accountNumber: accountNumber || undefined,
      });
      
      let transportRequestSuccess = true;
      let transportRequestError = "";
      
      if (includeTransport && result.orders?.length > 0) {
        const orderTotal = subtotal + buyerServiceFee;
        const transportCost = Math.round(orderTotal * 0.08);
        
        for (const order of result.orders) {
          try {
            await costSplitsApi.create(order.id, {
              splitMode: transportSplit.splitMode,
              buyerPercentage: transportSplit.buyerPercentage,
              farmerPercentage: transportSplit.farmerPercentage,
              totalTransportCost: transportCost,
            });
          } catch (e: any) {
            console.error("Failed to create cost split for order:", order.id, e);
            transportRequestSuccess = false;
            transportRequestError = e.message || "Transport request failed";
          }
        }
      }
      
      return { ...result, transportRequestSuccess, transportRequestError };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/cart"] });
      setCreatedOrders(data.orders);
      setOrderSuccess(true);
      
      if (includeTransport) {
        if (data.transportRequestSuccess) {
          toast({ title: "Order placed with transport request!" });
        } else {
          toast({ 
            title: "Order placed", 
            description: "Transport request could not be processed. You can set it up later.",
            variant: "default"
          });
        }
      } else {
        toast({ title: "Order placed successfully!" });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Checkout failed", 
        description: error.message || "Please try again",
        variant: "destructive"
      });
    },
  });

  if (userLoading || cartLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    setLocation("/auth");
    return null;
  }

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add items to your cart before checking out.</p>
              <Button onClick={() => setLocation("/marketplace")} data-testid="button-browse">
                Browse Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (orderSuccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Order Placed Successfully!</h2>
              <p className="text-muted-foreground mb-6">
                Your order has been placed. You'll receive notifications about your order status.
              </p>
              <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">What happens next?</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Complete payment using your selected payment method</li>
                  <li>Your payment will be held securely in escrow</li>
                  <li>The seller will ship your order</li>
                  <li>Confirm delivery to release payment to the seller</li>
                </ol>
              </div>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => setLocation("/dashboard")} data-testid="button-view-orders">
                  View My Orders
                </Button>
                <Button variant="outline" onClick={() => setLocation("/marketplace")} data-testid="button-continue-shopping">
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Use dynamic fees from API or fallback to estimates
  const buyerServiceFee = feeCalculation?.transactionFees.buyerFee.amount || Math.round(subtotal * 0.03);
  const buyerServiceFeePercent = feeCalculation?.transactionFees.buyerFee.percentage || 3;
  const farmerServiceFee = feeCalculation?.transactionFees.farmerFee.amount || Math.round(subtotal * 0.03);
  const farmerServiceFeePercent = feeCalculation?.transactionFees.farmerFee.percentage || 3;
  const transportFee = feeCalculation?.transportFees?.amount || 0;
  const transportFeePercent = feeCalculation?.transportFees?.percentage || 3.5;
  const buyerTransportCost = includeTransport 
    ? Math.round((estimatedTransportCost * transportSplit.buyerPercentage) / 100) 
    : 0;
  const total = feeCalculation?.totalBuyerPayable || (subtotal + buyerServiceFee + buyerTransportCost);
  const buyerTier = feeCalculation?.buyerTier || 'starter';

  const isMobileMoney = ["airtel_money", "mtn_money", "zamtel_money"].includes(paymentMethod);
  const isValid = deliveryAddress && deliveryPhone && paymentMethod && 
    (isMobileMoney ? phoneNumber : true);

  return (
    <Layout>
      <div className="bg-muted/30 py-8 border-b">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-2"
            onClick={() => setLocation("/cart")}
            data-testid="button-back-to-cart"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cart
          </Button>
          <h1 className="font-heading text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">
            Complete your order securely
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
                <CardDescription>Where should we deliver your order?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full delivery address including city and district"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    className="mt-1"
                    data-testid="input-address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+260 97X XXX XXX"
                    value={deliveryPhone}
                    onChange={(e) => setDeliveryPhone(e.target.value)}
                    className="mt-1"
                    data-testid="input-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions for delivery or the seller"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                    data-testid="input-notes"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Transport Options
                </CardTitle>
                <CardDescription>Request transport for your order</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="include-transport">Request Farmly Transport</Label>
                    <p className="text-sm text-muted-foreground">
                      Let us help coordinate transport for your goods
                    </p>
                  </div>
                  <Switch
                    id="include-transport"
                    checked={includeTransport}
                    onCheckedChange={setIncludeTransport}
                    data-testid="switch-include-transport"
                  />
                </div>
                
                {includeTransport && (
                  <TransportCostSplit
                    estimatedTransportCost={estimatedTransportCost}
                    onSplitChange={setTransportSplit}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Choose how you'd like to pay</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                        paymentMethod === method.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50"
                      }`}
                      onClick={() => setPaymentMethod(method.id)}
                      data-testid={`payment-method-${method.id}`}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <method.icon className="h-6 w-6 text-primary" />
                      <div className="flex-1">
                        <Label htmlFor={method.id} className="font-medium cursor-pointer">
                          {method.name}
                        </Label>
                        <p className="text-sm text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>

                {isMobileMoney && (
                  <div className="mt-4 pt-4 border-t">
                    <Label htmlFor="mobileNumber">Mobile Money Number</Label>
                    <Input
                      id="mobileNumber"
                      type="tel"
                      placeholder="+260 97X XXX XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="mt-1"
                      data-testid="input-mobile-money"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You will receive a payment prompt on this number
                    </p>
                  </div>
                )}

                {paymentMethod === "bank_transfer" && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="bg-muted/50 rounded-lg p-4 text-sm">
                      <h4 className="font-medium mb-2">Bank Transfer Details</h4>
                      <p className="text-muted-foreground mb-2">Transfer to the following account:</p>
                      <div className="space-y-1">
                        <p><strong>Bank:</strong> Zambia National Commercial Bank</p>
                        <p><strong>Account Name:</strong> Farmly Escrow Account</p>
                        <p><strong>Account Number:</strong> 0123456789012</p>
                        <p><strong>Branch:</strong> Cairo Road, Lusaka</p>
                      </div>
                      <p className="text-muted-foreground mt-2">
                        Use your order ID as the reference when making the transfer.
                      </p>
                    </div>
                  </div>
                )}

                {paymentMethod === "debit_card" && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm">
                      <p className="text-amber-800 dark:text-amber-200">
                        Card payment integration coming soon. Please use mobile money or bank transfer for now.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Escrow Protection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Your payment is protected
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    <li>Your payment is held securely until you receive your order</li>
                    <li>Confirm delivery to release payment to the seller</li>
                    <li>You have 7 days after delivery to raise any disputes</li>
                    <li>Full refund if items don't match the description</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3" data-testid={`checkout-item-${item.id}`}>
                      <img
                        src={item.listing.images[0] || "https://images.unsplash.com/photo-1560493676-04071c5f467b?w=60"}
                        alt={item.listing.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.listing.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} x K{item.listing.price.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm font-medium">
                        K{(item.listing.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>K{subtotal.toLocaleString()}</span>
                  </div>
                  
                  <TooltipProvider>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        Service Fee ({buyerServiceFeePercent}%)
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">This fee covers escrow protection, payment processing, dispute handling, and platform access. Your {buyerTier} tier gives you reduced rates!</p>
                          </TooltipContent>
                        </Tooltip>
                      </span>
                      <span>K{buyerServiceFee.toLocaleString()}</span>
                    </div>
                  </TooltipProvider>
                  
                  {includeTransport && buyerTransportCost > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                        <span>Transport (Your Share: {transportSplit.buyerPercentage}%)</span>
                        <span>K{buyerTransportCost.toLocaleString()}</span>
                      </div>
                      {transportFee > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Transport Service Fee ({transportFeePercent}%)</span>
                          <span>K{transportFee.toLocaleString()}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  {farmerServiceFee > 0 && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Seller's Fee ({farmerServiceFeePercent}%)</span>
                      <span className="italic">Deducted at payout</span>
                    </div>
                  )}
                  
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">K{total.toLocaleString()}</span>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-2 mt-2">
                    <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-1">
                      <Info className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>
                        <strong>{buyerTier.charAt(0).toUpperCase() + buyerTier.slice(1)} tier:</strong> You're getting reduced fees. 
                        Upgrade for even lower rates!
                      </span>
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full h-12 text-lg font-bold" 
                  disabled={!isValid || checkoutMutation.isPending || paymentMethod === "debit_card"}
                  onClick={() => checkoutMutation.mutate()}
                  data-testid="button-place-order"
                >
                  {checkoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place Order - K${total.toLocaleString()}`
                  )}
                </Button>

                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
                  <Lock className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-green-700 dark:text-green-400">
                    <span className="font-medium">Escrow Protected:</span> Your payment is held securely until you confirm delivery. Off-app transactions are not covered.
                  </div>
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  By placing this order, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
