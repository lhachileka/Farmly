import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { coopsApi, type User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, AlertCircle, CheckCircle2, Wheat, Leaf, Drumstick, Factory } from "lucide-react";
import { useState } from "react";

const ZAMBIAN_LOCATIONS = [
  "Lusaka",
  "Copperbelt",
  "Central Province",
  "Eastern Province",
  "Luapula",
  "Northern Province",
  "North-Western Province",
  "Southern Province",
  "Western Province",
  "Muchinga",
];

const COMMON_UNITS = ["kg", "tonnes", "bags", "crates", "heads", "bundles", "litres"];

const PRODUCT_SUGGESTIONS = {
  produce: ["Tomatoes", "Onions", "Cabbage", "Carrots", "Green Peppers", "Potatoes", "Sweet Potatoes"],
  livestock: ["Chickens", "Goats", "Cattle", "Pigs", "Eggs", "Fish"],
  grains: ["Maize", "Wheat", "Rice", "Sorghum", "Millet", "Groundnuts", "Soybeans"],
  processed: ["Mealie Meal", "Cooking Oil", "Honey", "Dried Fish", "Kapenta"],
};

export default function CreateCoopPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    productType: "",
    productName: "",
    unit: "",
    pricePerUnit: "",
    targetQuantity: "",
    minContribution: "",
    maxContribution: "",
    qualityStandards: "",
    location: "",
    availableFrom: "",
    availableUntil: "",
    leaderQuantity: "",
  });

  const createMutation = useMutation({
    mutationFn: () => coopsApi.create(formData),
    onSuccess: (coop) => {
      toast({ title: "Co-Op Created!", description: "Your co-op is now recruiting members" });
      navigate(`/coops/${coop.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canCreate = currentUser?.role === "farmer" && currentUser?.verified;

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-4">Please log in to create a co-op.</p>
            <Button onClick={() => navigate("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <AlertCircle className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Verification Required</h3>
            <p className="text-muted-foreground mb-4">
              Only verified producers can create co-ops. Please ensure your account is verified.
            </p>
            <Button variant="outline" onClick={() => navigate("/coops")}>
              Back to Co-Ops
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isFormValid = formData.title && formData.productType && formData.productName && 
    formData.unit && formData.pricePerUnit && formData.targetQuantity && 
    formData.location && formData.leaderQuantity;

  const productSuggestions = formData.productType ? PRODUCT_SUGGESTIONS[formData.productType as keyof typeof PRODUCT_SUGGESTIONS] || [] : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => navigate("/coops")} className="mb-4" data-testid="button-back">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Co-Ops
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle data-testid="text-page-title">Create a Co-Op</CardTitle>
              <CardDescription>
                Start a group supply effort to fulfill large buyer orders together
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="title">Co-Op Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Lusaka Tomato Producers Collective"
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your co-op, quality standards, and goals..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                data-testid="input-description"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Product Details</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productType">Category *</Label>
                <Select value={formData.productType} onValueChange={(v) => updateField("productType", v)}>
                  <SelectTrigger data-testid="select-product-type">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produce">
                      <div className="flex items-center gap-2">
                        <Leaf className="w-4 h-4" /> Produce
                      </div>
                    </SelectItem>
                    <SelectItem value="livestock">
                      <div className="flex items-center gap-2">
                        <Drumstick className="w-4 h-4" /> Livestock
                      </div>
                    </SelectItem>
                    <SelectItem value="grains">
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4" /> Grains
                      </div>
                    </SelectItem>
                    <SelectItem value="processed">
                      <div className="flex items-center gap-2">
                        <Factory className="w-4 h-4" /> Processed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="e.g., Fresh Tomatoes"
                  value={formData.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                  list="product-suggestions"
                  data-testid="input-product-name"
                />
                <datalist id="product-suggestions">
                  {productSuggestions.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Select value={formData.unit} onValueChange={(v) => updateField("unit", v)}>
                  <SelectTrigger data-testid="select-unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_UNITS.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pricePerUnit">Price per Unit (K) *</Label>
                <Input
                  id="pricePerUnit"
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.pricePerUnit}
                  onChange={(e) => updateField("pricePerUnit", e.target.value)}
                  data-testid="input-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetQuantity">Target Quantity *</Label>
                <Input
                  id="targetQuantity"
                  type="number"
                  placeholder="e.g., 1000"
                  value={formData.targetQuantity}
                  onChange={(e) => updateField("targetQuantity", e.target.value)}
                  data-testid="input-target-quantity"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualityStandards">Quality Standards</Label>
              <Textarea
                id="qualityStandards"
                placeholder="Describe the quality requirements for contributions..."
                value={formData.qualityStandards}
                onChange={(e) => updateField("qualityStandards", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Contribution Limits (Optional)</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minContribution">Minimum Contribution ({formData.unit || "units"})</Label>
                <Input
                  id="minContribution"
                  type="number"
                  placeholder="e.g., 50"
                  value={formData.minContribution}
                  onChange={(e) => updateField("minContribution", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxContribution">Maximum Contribution ({formData.unit || "units"})</Label>
                <Input
                  id="maxContribution"
                  type="number"
                  placeholder="e.g., 500"
                  value={formData.maxContribution}
                  onChange={(e) => updateField("maxContribution", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Location & Availability</h3>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Select value={formData.location} onValueChange={(v) => updateField("location", v)}>
                <SelectTrigger data-testid="select-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {ZAMBIAN_LOCATIONS.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availableFrom">Available From</Label>
                <Input
                  id="availableFrom"
                  type="date"
                  value={formData.availableFrom}
                  onChange={(e) => updateField("availableFrom", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availableUntil">Available Until</Label>
                <Input
                  id="availableUntil"
                  type="date"
                  value={formData.availableUntil}
                  onChange={(e) => updateField("availableUntil", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Your Contribution</h3>
            <p className="text-sm text-muted-foreground">
              As the leader, you'll be the first member of this co-op.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="leaderQuantity">Your Quantity ({formData.unit || "units"}) *</Label>
              <Input
                id="leaderQuantity"
                type="number"
                placeholder="How much will you contribute?"
                value={formData.leaderQuantity}
                onChange={(e) => updateField("leaderQuantity", e.target.value)}
                data-testid="input-leader-quantity"
              />
            </div>

            {formData.pricePerUnit && formData.leaderQuantity && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">
                    Your share: K{(parseFloat(formData.pricePerUnit) * parseFloat(formData.leaderQuantity)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {formData.pricePerUnit && formData.targetQuantity && (
            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Co-Op Summary</h4>
              <div className="grid md:grid-cols-2 gap-2 text-sm">
                <div>Target: {parseFloat(formData.targetQuantity).toLocaleString()} {formData.unit || "units"}</div>
                <div>Price: K{parseFloat(formData.pricePerUnit).toLocaleString()}/{formData.unit || "unit"}</div>
                <div className="md:col-span-2 font-medium">
                  Total Value: K{(parseFloat(formData.pricePerUnit) * parseFloat(formData.targetQuantity)).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate("/coops")}>Cancel</Button>
          <Button 
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || !isFormValid}
            data-testid="button-create-coop"
          >
            {createMutation.isPending ? "Creating..." : "Create Co-Op"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
