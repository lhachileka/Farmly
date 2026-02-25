import { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, MapPin, Package, Clock, ShieldCheck, Search } from "lucide-react";
import logisticsHero from "@assets/generated_images/modern_logistics_truck_on_african_road.png";

export default function Logistics() {
  const [trackingId, setTrackingId] = useState("");
  const [trackingResult, setTrackingResult] = useState<null | { status: string; location: string; eta: string }>(null);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock tracking result
    setTrackingResult({
      status: "In Transit",
      location: "Great North Road, near Kabwe",
      eta: "Today, 4:00 PM"
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-muted/30 py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                Reliable Agricultural Transport
              </Badge>
              <h1 className="font-heading text-4xl md:text-5xl font-bold text-balance">
                Move your harvest from <span className="text-primary">Farm to Market</span> efficiently.
              </h1>
              <p className="text-lg text-muted-foreground text-balance max-w-lg">
                Connect with verified logistics partners across Zambia. Real-time tracking, fair per-km pricing, and guaranteed delivery.
              </p>
              
              <Card className="border-primary/20 shadow-lg max-w-md">
                <CardContent className="p-4 pt-6">
                  <form onSubmit={handleTrack} className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="tracking" className="sr-only">Tracking ID</Label>
                      <Input 
                        id="tracking" 
                        placeholder="Enter Tracking ID (e.g. TRK-4921)" 
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                      />
                    </div>
                    <Button type="submit">Track</Button>
                  </form>
                  
                  {trackingResult && (
                    <div className="mt-4 p-3 bg-muted rounded-lg border text-sm animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <Truck className="h-4 w-4" /> {trackingResult.status}
                        </span>
                        <span className="text-muted-foreground">{trackingResult.eta}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        Current Location: {trackingResult.location}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 dark:border-white/10 aspect-video">
               <img 
                 src={logisticsHero} 
                 alt="Logistics Truck" 
                 className="w-full h-full object-cover"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
               <div className="absolute bottom-4 left-4 text-white">
                 <div className="font-bold text-lg">Verified Fleet</div>
                 <div className="text-sm opacity-90">Serving all 10 provinces</div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="request" className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl font-bold mb-4">Logistics Services</h2>
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="request">Request Transport</TabsTrigger>
                <TabsTrigger value="become-transporter">Become a Partner</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="request">
              <Card>
                <CardHeader>
                  <CardTitle>Book a Vehicle</CardTitle>
                  <CardDescription>Get an instant quote for your cargo.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Pickup Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Enter pickup address" className="pl-9" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Delivery Destination</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Enter delivery address" className="pl-9" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Vehicle Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Pickup Truck (1 Ton)</SelectItem>
                          <SelectItem value="canter">Canter (3-5 Tons)</SelectItem>
                          <SelectItem value="truck">Large Truck (10+ Tons)</SelectItem>
                          <SelectItem value="refrigerated">Refrigerated Truck</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cargo Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select contents" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="produce">Fresh Produce (Vegetables/Fruits)</SelectItem>
                          <SelectItem value="grains">Grains (Maize/Rice)</SelectItem>
                          <SelectItem value="livestock">Livestock</SelectItem>
                          <SelectItem value="fragile">Fragile Goods</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Preferred Date</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input type="date" className="pl-9" />
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-muted/30 p-4 rounded-lg flex justify-between items-center border">
                      <div>
                        <div className="text-sm text-muted-foreground">Estimated Distance</div>
                        <div className="font-bold">124 km</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Est. Cost</div>
                        <div className="font-bold text-xl text-primary">K 1,850</div>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Button className="w-full h-12 text-lg">Book Transport</Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="become-transporter">
              <Card>
                <CardHeader>
                  <CardTitle>Register Your Vehicle</CardTitle>
                  <CardDescription>Start earning by transporting agricultural goods.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg text-center space-y-2 hover:border-primary/50 transition-colors">
                      <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-primary">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold">Guaranteed Pay</h3>
                      <p className="text-sm text-muted-foreground">Secure payments via Farmly Escrow upon delivery.</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center space-y-2 hover:border-primary/50 transition-colors">
                      <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Search className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold">Find Jobs Easily</h3>
                      <p className="text-sm text-muted-foreground">Browse delivery requests near your location.</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center space-y-2 hover:border-primary/50 transition-colors">
                      <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-primary">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <h3 className="font-bold">Route Optimization</h3>
                      <p className="text-sm text-muted-foreground">Smart routing to save fuel and time.</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-6 rounded-lg text-center">
                    <h3 className="font-bold text-lg mb-2">Requirements</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 mb-6">
                      <li>• Valid Driver's License</li>
                      <li>• Vehicle Registration & Insurance</li>
                      <li>• Roadworthiness Certificate</li>
                      <li>• Smartphone for Tracking App</li>
                    </ul>
                    <Button size="lg" className="w-full sm:w-auto">Start Registration</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}
