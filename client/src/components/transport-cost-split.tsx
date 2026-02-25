import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Truck, Users, DollarSign, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TransportCostSplitProps {
  estimatedTransportCost: number;
  onSplitChange: (split: {
    splitMode: string;
    buyerPercentage: number;
    farmerPercentage: number;
  }) => void;
}

const presetSplits = [
  { id: "buyer_pays", label: "Buyer pays all", buyerPercentage: 100, farmerPercentage: 0 },
  { id: "farmer_pays", label: "Producer pays all", buyerPercentage: 0, farmerPercentage: 100 },
  { id: "split_50_50", label: "Split 50/50", buyerPercentage: 50, farmerPercentage: 50 },
  { id: "custom", label: "Custom split", buyerPercentage: 50, farmerPercentage: 50 },
];

export function TransportCostSplit({ estimatedTransportCost, onSplitChange }: TransportCostSplitProps) {
  const [splitMode, setSplitMode] = useState("buyer_pays");
  const [customBuyerPercentage, setCustomBuyerPercentage] = useState(50);

  const handleSplitChange = (mode: string) => {
    setSplitMode(mode);
    const preset = presetSplits.find(p => p.id === mode);
    if (preset && mode !== "custom") {
      onSplitChange({
        splitMode: mode,
        buyerPercentage: preset.buyerPercentage,
        farmerPercentage: preset.farmerPercentage,
      });
    } else {
      onSplitChange({
        splitMode: "custom",
        buyerPercentage: customBuyerPercentage,
        farmerPercentage: 100 - customBuyerPercentage,
      });
    }
  };

  const handleCustomSliderChange = (value: number[]) => {
    const buyerPercent = value[0];
    setCustomBuyerPercentage(buyerPercent);
    onSplitChange({
      splitMode: "custom",
      buyerPercentage: buyerPercent,
      farmerPercentage: 100 - buyerPercent,
    });
  };

  const getCurrentSplit = () => {
    if (splitMode === "custom") {
      return { buyerPercentage: customBuyerPercentage, farmerPercentage: 100 - customBuyerPercentage };
    }
    return presetSplits.find(p => p.id === splitMode) || presetSplits[0];
  };

  const currentSplit = getCurrentSplit();
  const buyerAmount = Math.round((estimatedTransportCost * currentSplit.buyerPercentage) / 100);
  const farmerAmount = estimatedTransportCost - buyerAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Transport Cost Sharing
        </CardTitle>
        <CardDescription>
          Choose how to split the transport costs between buyer and producer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estimated Transport Cost</span>
            <span className="text-lg font-bold text-primary">K{estimatedTransportCost.toLocaleString()}</span>
          </div>
        </div>

        <RadioGroup value={splitMode} onValueChange={handleSplitChange} className="space-y-3">
          {presetSplits.map((preset) => (
            <div
              key={preset.id}
              className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                splitMode === preset.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/50"
              }`}
              onClick={() => handleSplitChange(preset.id)}
              data-testid={`split-option-${preset.id}`}
            >
              <RadioGroupItem value={preset.id} id={preset.id} />
              <div className="flex-1">
                <Label htmlFor={preset.id} className="font-medium cursor-pointer">
                  {preset.label}
                </Label>
                {preset.id !== "custom" && (
                  <p className="text-sm text-muted-foreground">
                    Buyer: K{Math.round((estimatedTransportCost * preset.buyerPercentage) / 100).toLocaleString()} | 
                    Producer: K{Math.round((estimatedTransportCost * preset.farmerPercentage) / 100).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </RadioGroup>

        {splitMode === "custom" && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Buyer pays: {customBuyerPercentage}%</Label>
              <Label>Producer pays: {100 - customBuyerPercentage}%</Label>
            </div>
            <Slider
              value={[customBuyerPercentage]}
              onValueChange={handleCustomSliderChange}
              max={100}
              step={5}
              className="w-full"
              data-testid="custom-split-slider"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Buyer: K{buyerAmount.toLocaleString()}</span>
              <span>Producer: K{farmerAmount.toLocaleString()}</span>
            </div>
          </div>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The transport fee will be held in escrow until delivery is confirmed. Both parties must fund their portion before transport begins.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-blue-600 mb-1" />
            <p className="text-xs text-muted-foreground">Buyer pays</p>
            <p className="text-lg font-bold text-blue-600">K{buyerAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{currentSplit.buyerPercentage}%</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 mx-auto text-green-600 mb-1" />
            <p className="text-xs text-muted-foreground">Producer pays</p>
            <p className="text-lg font-bold text-green-600">K{farmerAmount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{currentSplit.farmerPercentage}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
