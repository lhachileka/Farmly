import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { authApi, feesApi } from "@/lib/api";
import { 
  Settings, 
  DollarSign, 
  Truck, 
  FileText, 
  Save,
  Loader2,
  Shield,
  TrendingDown
} from "lucide-react";
import { Redirect } from "wouter";

export default function AdminFeesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
    retry: false,
  });

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ["/api/fees/config"],
    queryFn: feesApi.getConfig,
    enabled: currentUser?.role === 'admin',
  });

  const [formData, setFormData] = useState({
    baseBuyerFeePercent: 3,
    baseFarmerFeePercent: 3,
    baseTransportFeePercent: 3.5,
    contractFeePercent: 3,
    starterDiscount: 0,
    growthDiscount: 1,
    proDiscount: 2,
    commercialDiscount: 3,
  });

  useEffect(() => {
    if (config) {
      setFormData({
        baseBuyerFeePercent: config.baseBuyerFeePercent ?? 3,
        baseFarmerFeePercent: config.baseFarmerFeePercent ?? 3,
        baseTransportFeePercent: config.baseTransportFeePercent ?? 3.5,
        contractFeePercent: config.contractFeePercent ?? 3,
        starterDiscount: config.starterDiscount ?? 0,
        growthDiscount: config.growthDiscount ?? 1,
        proDiscount: config.proDiscount ?? 2,
        commercialDiscount: config.commercialDiscount ?? 3,
      });
    }
  }, [config]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => feesApi.updateConfig(data),
    onSuccess: () => {
      toast({
        title: "Fees Updated",
        description: "Fee configuration has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fees/config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fee configuration.",
        variant: "destructive",
      });
    },
  });

  if (userLoading || configLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!currentUser || currentUser.role !== 'admin') {
    return <Redirect to="/" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-full">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-admin-fees-title">Fee Configuration</h1>
            <p className="text-muted-foreground">Manage platform transaction and service fees</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Transaction Fees
              </CardTitle>
              <CardDescription>
                Base fees charged on marketplace transactions (before tier discounts)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseBuyerFeePercent">Buyer Service Fee (%)</Label>
                  <Input
                    id="baseBuyerFeePercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.baseBuyerFeePercent}
                    onChange={(e) => setFormData({ ...formData, baseBuyerFeePercent: parseFloat(e.target.value) })}
                    data-testid="input-buyer-fee"
                  />
                  <p className="text-xs text-muted-foreground">Charged to buyers on each purchase</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baseFarmerFeePercent">Seller Service Fee (%)</Label>
                  <Input
                    id="baseFarmerFeePercent"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={formData.baseFarmerFeePercent}
                    onChange={(e) => setFormData({ ...formData, baseFarmerFeePercent: parseFloat(e.target.value) })}
                    data-testid="input-farmer-fee"
                  />
                  <p className="text-xs text-muted-foreground">Deducted from seller payouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Transport Fees
              </CardTitle>
              <CardDescription>
                Fees for transport coordination and logistics services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="baseTransportFeePercent">Transport Service Fee (%)</Label>
                <Input
                  id="baseTransportFeePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.baseTransportFeePercent}
                  onChange={(e) => setFormData({ ...formData, baseTransportFeePercent: parseFloat(e.target.value) })}
                  data-testid="input-transport-fee"
                />
                <p className="text-xs text-muted-foreground">Applied to transport costs for logistics coordination</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Fees
              </CardTitle>
              <CardDescription>
                Additional fees for contract-based transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-w-md">
                <Label htmlFor="contractFeePercent">Contract Service Fee (%)</Label>
                <Input
                  id="contractFeePercent"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.contractFeePercent}
                  onChange={(e) => setFormData({ ...formData, contractFeePercent: parseFloat(e.target.value) })}
                  data-testid="input-contract-fee"
                />
                <p className="text-xs text-muted-foreground">Applied to contract-based orders (demand forecasts, subscriptions)</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Tier Discounts
              </CardTitle>
              <CardDescription>
                Fee reductions based on user subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="starterDiscount" className="flex items-center gap-2">
                    <Badge variant="secondary">Starter</Badge>
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="starterDiscount"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.starterDiscount}
                      onChange={(e) => setFormData({ ...formData, starterDiscount: parseFloat(e.target.value) })}
                      data-testid="input-starter-discount"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="growthDiscount" className="flex items-center gap-2">
                    <Badge className="bg-blue-500">Growth</Badge>
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="growthDiscount"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.growthDiscount}
                      onChange={(e) => setFormData({ ...formData, growthDiscount: parseFloat(e.target.value) })}
                      data-testid="input-growth-discount"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proDiscount" className="flex items-center gap-2">
                    <Badge className="bg-purple-500">Pro</Badge>
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="proDiscount"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.proDiscount}
                      onChange={(e) => setFormData({ ...formData, proDiscount: parseFloat(e.target.value) })}
                      data-testid="input-pro-discount"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commercialDiscount" className="flex items-center gap-2">
                    <Badge className="bg-amber-500">Commercial</Badge>
                  </Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="commercialDiscount"
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.commercialDiscount}
                      onChange={(e) => setFormData({ ...formData, commercialDiscount: parseFloat(e.target.value) })}
                      data-testid="input-commercial-discount"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Effective Fee Rates
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Starter:</span>
                    <p className="font-medium">{(formData.baseBuyerFeePercent - formData.starterDiscount).toFixed(1)}% buyer / {(formData.baseFarmerFeePercent - formData.starterDiscount).toFixed(1)}% seller</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Growth:</span>
                    <p className="font-medium">{(formData.baseBuyerFeePercent - formData.growthDiscount).toFixed(1)}% buyer / {(formData.baseFarmerFeePercent - formData.growthDiscount).toFixed(1)}% seller</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pro:</span>
                    <p className="font-medium">{(formData.baseBuyerFeePercent - formData.proDiscount).toFixed(1)}% buyer / {(formData.baseFarmerFeePercent - formData.proDiscount).toFixed(1)}% seller</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Commercial:</span>
                    <p className="font-medium">{(formData.baseBuyerFeePercent - formData.commercialDiscount).toFixed(1)}% buyer / {(formData.baseFarmerFeePercent - formData.commercialDiscount).toFixed(1)}% seller</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              size="lg" 
              disabled={updateMutation.isPending}
              data-testid="button-save-fees"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Fee Configuration
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
