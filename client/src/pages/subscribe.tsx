import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { authApi, listingsApi, subscriptionsApi, sellersApi, type Listing } from "@/lib/api";
import { ArrowLeft, ArrowRight, Package, Calendar, DollarSign, Shield, CheckCircle, Loader2, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SubscriptionItem {
  listingId: string;
  listing: Listing;
  quantityPerDelivery: number;
  pricePerUnit: number;
}

export default function SubscribePage() {
  const { sellerId } = useParams<{ sellerId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [frequency, setFrequency] = useState<"weekly" | "biweekly" | "monthly">("weekly");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [message, setMessage] = useState("");
  const [selectedItems, setSelectedItems] = useState<SubscriptionItem[]>([]);

  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/listings", sellerId],
    queryFn: () => listingsApi.getAll({ sellerId }),
    enabled: !!sellerId,
  });

  const { data: sellerBadges } = useQuery({
    queryKey: ["/api/sellers", sellerId, "badges"],
    queryFn: () => sellersApi.getBadges(sellerId!),
    enabled: !!sellerId,
  });

  const { data: sellerMetrics } = useQuery({
    queryKey: ["/api/sellers", sellerId, "metrics"],
    queryFn: () => sellersApi.getMetrics(sellerId!),
    enabled: !!sellerId,
  });

  const createMutation = useMutation({
    mutationFn: () => subscriptionsApi.create({
      sellerId: sellerId!,
      frequency,
      durationWeeks,
      message,
      items: selectedItems.map(item => ({
        listingId: item.listingId,
        quantityPerDelivery: item.quantityPerDelivery,
        pricePerUnit: item.pricePerUnit,
      })),
    }),
    onSuccess: () => {
      toast({ title: "Subscription Request Sent", description: "The seller will review your request." });
      setLocation("/contracts");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create subscription", variant: "destructive" });
    },
  });

  if (!currentUser && !userLoading) {
    setLocation("/auth");
    return null;
  }

  if (userLoading || listingsLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const sellerName = listings?.[0]?.seller?.name || "Seller";
  const frequencyDays = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
  const totalDeliveries = Math.floor(durationWeeks * 7 / frequencyDays);
  const totalValue = selectedItems.reduce((sum, item) => 
    sum + (item.pricePerUnit * item.quantityPerDelivery * totalDeliveries), 0);

  const toggleItem = (listing: Listing) => {
    const exists = selectedItems.find(i => i.listingId === listing.id);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => i.listingId !== listing.id));
    } else {
      setSelectedItems([...selectedItems, {
        listingId: listing.id,
        listing,
        quantityPerDelivery: listing.minOrder,
        pricePerUnit: listing.price,
      }]);
    }
  };

  const updateItemQuantity = (listingId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item => 
      item.listingId === listingId ? { ...item, quantityPerDelivery: quantity } : item
    ));
  };

  const canProceed = () => {
    if (step === 1) return selectedItems.length > 0;
    if (step === 2) return frequency && durationWeeks > 0;
    return true;
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => step > 1 ? setStep(step - 1) : setLocation("/marketplace")} 
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {step > 1 ? "Previous Step" : "Back to Marketplace"}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Subscribe to {sellerName}</h1>
          <p className="text-muted-foreground mt-1">Set up a recurring supply contract</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                s < step ? "bg-primary text-primary-foreground" :
                s === step ? "bg-primary/20 text-primary border-2 border-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && <div className={`w-24 h-1 mx-2 ${s < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Select Products
                </CardTitle>
                <CardDescription>Choose which products you want to receive regularly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {listings?.map(listing => {
                  const selected = selectedItems.find(i => i.listingId === listing.id);
                  return (
                    <div 
                      key={listing.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        selected ? "border-primary bg-primary/5" : "border-transparent bg-muted/30 hover:bg-muted/50"
                      }`}
                      onClick={() => toggleItem(listing)}
                      data-testid={`product-${listing.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{listing.title}</h4>
                          <p className="text-sm text-muted-foreground">{listing.category} • {listing.location}</p>
                          <p className="text-primary font-bold mt-1">K{listing.price}/{listing.unit}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selected ? "border-primary bg-primary text-white" : "border-muted-foreground"
                        }`}>
                          {selected && <CheckCircle className="w-4 h-4" />}
                        </div>
                      </div>
                      
                      {selected && (
                        <div className="mt-4 flex items-center gap-4" onClick={e => e.stopPropagation()}>
                          <Label className="text-sm">Quantity per delivery:</Label>
                          <Input
                            type="number"
                            min={listing.minOrder}
                            value={selected.quantityPerDelivery}
                            onChange={(e) => updateItemQuantity(listing.id, parseInt(e.target.value) || listing.minOrder)}
                            className="w-24"
                            data-testid={`input-quantity-${listing.id}`}
                          />
                          <span className="text-sm text-muted-foreground">{listing.unit}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {(!listings || listings.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    This seller doesn't have any active listings.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Delivery Schedule
                </CardTitle>
                <CardDescription>Set how often and for how long you want deliveries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Delivery Frequency</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                    <SelectTrigger data-testid="select-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly (Every 2 weeks)</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Contract Duration</Label>
                  <Select value={durationWeeks.toString()} onValueChange={(v) => setDurationWeeks(parseInt(v))}>
                    <SelectTrigger data-testid="select-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4 weeks (1 month)</SelectItem>
                      <SelectItem value="12">12 weeks (3 months)</SelectItem>
                      <SelectItem value="24">24 weeks (6 months)</SelectItem>
                      <SelectItem value="52">52 weeks (1 year)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">This will create</p>
                  <p className="text-2xl font-bold">{totalDeliveries} deliveries</p>
                  <p className="text-sm text-muted-foreground">over {durationWeeks} weeks</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message to Seller (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Add any special requests or notes for the seller..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  data-testid="input-message"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review Subscription</CardTitle>
                <CardDescription>Please review your subscription details before submitting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="font-medium capitalize">{frequency}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{durationWeeks} weeks</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Deliveries</p>
                    <p className="font-medium">{totalDeliveries}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10">
                    <p className="text-sm text-muted-foreground">Total Value</p>
                    <p className="font-bold text-primary text-xl">K{totalValue.toLocaleString()}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Products</h4>
                  {selectedItems.map(item => (
                    <div key={item.listingId} className="flex justify-between py-2 border-b last:border-0">
                      <span>{item.listing.title}</span>
                      <span className="text-muted-foreground">
                        {item.quantityPerDelivery} {item.listing.unit} × K{item.pricePerUnit}
                      </span>
                    </div>
                  ))}
                </div>

                {sellerMetrics && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        Seller Trust Score
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fulfillment Rate</span>
                          <span className="font-medium">{sellerMetrics.fulfillmentRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">On-Time Rate</span>
                          <span className="font-medium">{sellerMetrics.onTimeRate}%</span>
                        </div>
                      </div>
                      {sellerBadges && sellerBadges.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {sellerBadges.map(badge => (
                            <Badge key={badge.id} variant="secondary" className="flex items-center gap-1">
                              <Award className="w-3 h-3" />
                              {badge.badgeType.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="p-4 rounded-lg bg-green-50 text-green-700 flex items-start gap-3">
                  <Shield className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-medium">Escrow Protected</p>
                    <p className="text-sm">Your payments will be held in escrow and only released after you confirm each delivery.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => step > 1 ? setStep(step - 1) : setLocation("/marketplace")}
            data-testid="button-prev"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step > 1 ? "Previous" : "Cancel"}
          </Button>
          
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              disabled={!canProceed()}
              data-testid="button-next"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={() => createMutation.mutate()} 
              disabled={createMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
}
