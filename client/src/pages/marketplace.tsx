import { useState, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Filter, SlidersHorizontal, MapPin, Star, Loader2, 
  Package, ShoppingBag, Truck, Calendar, Users, ShieldCheck,
  ArrowRight, Clock, Weight
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FavoriteButton } from "@/components/favorite-button";
import { CATEGORIES } from "@/lib/mockData";
import { 
  listingsApi, 
  forecastsApi,
  transportJobsApi,
  type Listing, 
  type User,
  type DemandForecast,
  type TransportJob 
} from "@/lib/api";

type ListingType = "all" | "seller" | "buyer" | "transport";

const ZAMBIAN_LOCATIONS = [
  "All Locations",
  "Lusaka",
  "Kitwe",
  "Ndola",
  "Kabwe",
  "Chingola",
  "Mufulira",
  "Livingstone",
  "Luanshya",
  "Kasama",
  "Chipata",
  "Solwezi",
  "Choma",
  "Mongu"
];

export default function Marketplace() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialCategory = searchParams.get("category");
  const initialType = (searchParams.get("type") as ListingType) || "all";

  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || "all");
  const [selectedLocation, setSelectedLocation] = useState<string>("All Locations");
  const [listingType, setListingType] = useState<ListingType>(initialType);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ["/api/listings", selectedCategory],
    queryFn: () =>
      listingsApi.getAll({
        category: selectedCategory && selectedCategory !== "all" ? selectedCategory : undefined,
      }),
    enabled: listingType === "all" || listingType === "seller",
  });

  const { data: forecasts = [], isLoading: forecastsLoading } = useQuery({
    queryKey: ["/api/forecasts/available"],
    queryFn: () => forecastsApi.getAvailableForecasts(),
    enabled: listingType === "all" || listingType === "buyer",
  });

  const { data: transportJobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ["/api/transport-jobs"],
    queryFn: () => transportJobsApi.getOpen(),
    enabled: listingType === "all" || listingType === "transport",
  });

  const isLoading = listingsLoading || forecastsLoading || jobsLoading;

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      const matchesLocation = selectedLocation === "All Locations" || 
                              item.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesVerified = !verifiedOnly || item.seller?.verified;
      
      return matchesSearch && matchesPrice && matchesLocation && matchesVerified;
    });
  }, [listings, searchQuery, priceRange, selectedLocation, verifiedOnly]);

  const filteredForecasts = useMemo(() => {
    return forecasts.filter((item) => {
      const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesPrice = !item.targetPrice || (item.targetPrice >= priceRange[0] && item.targetPrice <= priceRange[1]);
      const matchesLocation = selectedLocation === "All Locations" || 
                              item.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesVerified = !verifiedOnly || item.buyer?.verified;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesLocation && matchesVerified;
    });
  }, [forecasts, searchQuery, selectedCategory, priceRange, selectedLocation, verifiedOnly]);

  const filteredJobs = useMemo(() => {
    return transportJobs.filter((job) => {
      const productType = job.productType || "";
      const matchesSearch = productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            job.pickupLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            job.deliveryLocation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPrice = job.suggestedPrice >= priceRange[0] && job.suggestedPrice <= priceRange[1];
      const matchesLocation = selectedLocation === "All Locations" || 
                              job.pickupLocation.toLowerCase().includes(selectedLocation.toLowerCase()) ||
                              job.deliveryLocation.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesVerified = !verifiedOnly || job.seller?.verified || job.buyer?.verified;
      
      return matchesSearch && matchesPrice && matchesLocation && matchesVerified;
    });
  }, [transportJobs, searchQuery, priceRange, selectedLocation, verifiedOnly]);

  const getCounts = () => ({
    all: filteredListings.length + filteredForecasts.length + filteredJobs.length,
    seller: filteredListings.length,
    buyer: filteredForecasts.length,
    transport: filteredJobs.length,
  });

  const counts = getCounts();

  return (
    <Layout>
      <div className="bg-muted/30 border-b py-8">
        <div className="container mx-auto px-4">
          <h1 className="font-heading text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-muted-foreground mb-6">
            Connect with producers, find what buyers need, or pick up transport contracts
          </p>
          
          <Tabs value={listingType} onValueChange={(v) => setListingType(v as ListingType)} className="mb-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-4 h-12">
              <TabsTrigger value="all" className="gap-2" data-testid="tab-all">
                All <Badge variant="secondary" className="ml-1">{counts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="seller" className="gap-2" data-testid="tab-seller">
                <Package className="h-4 w-4 hidden sm:inline" /> Sell
                <Badge variant="secondary" className="ml-1">{counts.seller}</Badge>
              </TabsTrigger>
              <TabsTrigger value="buyer" className="gap-2" data-testid="tab-buyer">
                <ShoppingBag className="h-4 w-4 hidden sm:inline" /> Buy
                <Badge variant="secondary" className="ml-1">{counts.buyer}</Badge>
              </TabsTrigger>
              <TabsTrigger value="transport" className="gap-2" data-testid="tab-transport">
                <Truck className="h-4 w-4 hidden sm:inline" /> Transport
                <Badge variant="secondary" className="ml-1">{counts.transport}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder={
                  listingType === "transport" 
                    ? "Search by cargo type or location..." 
                    : listingType === "buyer"
                    ? "Search buyer requests..."
                    : "Search for produce, livestock, or grains..."
                }
                className="pl-10 h-10 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="flex gap-2">
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[160px] bg-background" data-testid="select-location">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {ZAMBIAN_LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-background gap-2 md:hidden">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
        <aside className="hidden md:block w-64 shrink-0 space-y-8">
          {(listingType === "all" || listingType === "seller" || listingType === "buyer") && (
            <div>
              <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Categories
              </h3>
              <div className="space-y-2">
                <Button 
                  variant={selectedCategory === "all" ? "secondary" : "ghost"} 
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory("all")}
                  data-testid="filter-category-all"
                >
                  All Categories
                </Button>
                {CATEGORIES.filter(c => c.id !== 'logistics').map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "secondary" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(cat.id)}
                    data-testid={`filter-category-${cat.id}`}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-heading font-semibold mb-4">Price Range</h3>
            <div className="px-2">
              <Slider
                defaultValue={[0, 50000]}
                max={50000}
                step={100}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mb-4"
                data-testid="slider-price"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>K{priceRange[0]}</span>
                <span>K{priceRange[1]}+</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4">Filters</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="verified" 
                  checked={verifiedOnly}
                  onCheckedChange={(checked) => setVerifiedOnly(checked as boolean)}
                  data-testid="filter-verified"
                />
                <Label htmlFor="verified" className="text-sm font-normal">Verified Users Only</Label>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {(listingType === "all" || listingType === "seller") && filteredListings.length > 0 && (
                <section>
                  {listingType === "all" && (
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-green-600" /> Seller Listings
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setListingType("seller")}
                        data-testid="link-view-all-seller"
                      >
                        View all <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(listingType === "all" ? filteredListings.slice(0, 6) : filteredListings).map((item) => (
                      <SellerListingCard key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              )}

              {(listingType === "all" || listingType === "buyer") && filteredForecasts.length > 0 && (
                <section>
                  {listingType === "all" && (
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-blue-600" /> Buyer Requests
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setListingType("buyer")}
                        data-testid="link-view-all-buyer"
                      >
                        View all <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(listingType === "all" ? filteredForecasts.slice(0, 6) : filteredForecasts).map((forecast) => (
                      <BuyerRequestCard key={forecast.id} forecast={forecast} />
                    ))}
                  </div>
                </section>
              )}

              {(listingType === "all" || listingType === "transport") && filteredJobs.length > 0 && (
                <section>
                  {listingType === "all" && (
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-heading text-xl font-semibold flex items-center gap-2">
                        <Truck className="h-5 w-5 text-orange-600" /> Transport Jobs
                      </h2>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setListingType("transport")}
                        data-testid="link-view-all-transport"
                      >
                        View all <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(listingType === "all" ? filteredJobs.slice(0, 6) : filteredJobs).map((job) => (
                      <TransportJobCard key={job.id} job={job} />
                    ))}
                  </div>
                </section>
              )}

              {counts.all === 0 && (
                <div className="text-center py-20">
                  <div className="text-muted-foreground mb-4">
                    {listingType === "seller" && "No seller listings match your filters"}
                    {listingType === "buyer" && "No buyer requests match your filters"}
                    {listingType === "transport" && "No transport jobs available"}
                    {listingType === "all" && "No listings found matching your criteria"}
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery("");
                      setPriceRange([0, 50000]);
                      setSelectedCategory("all");
                      setSelectedLocation("All Locations");
                      setVerifiedOnly(false);
                    }}
                  >
                    Clear all filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function SellerListingCard({ item }: { item: Listing & { seller?: User } }) {
  return (
    <Link href={`/product/${item.id}`}>
      <Card 
        className="overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col"
        data-testid={`card-listing-${item.id}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img 
            src={item.images[0]} 
            alt={item.title} 
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 right-3 flex gap-2">
            <FavoriteButton listingId={item.id} variant="icon" />
            {item.organic && <Badge className="bg-green-500/90 hover:bg-green-600 border-none shadow-sm backdrop-blur-sm">Organic</Badge>}
          </div>
          <div className="absolute top-3 left-3">
            <Badge className="bg-green-600/90 text-white border-none shadow-sm backdrop-blur-sm">
              <Package className="h-3 w-3 mr-1" /> For Sale
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-white/90 text-foreground shadow-sm backdrop-blur-sm font-medium">
              Min: {item.minOrder} {item.unit}
            </Badge>
          </div>
        </div>
        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-heading font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
            <span className="font-bold text-primary whitespace-nowrap ml-2">
              K{item.price}/{item.unit}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>
          <div className="mt-auto flex items-center justify-between text-sm">
            <span className="flex items-center text-muted-foreground">
              <MapPin className="h-3 w-3 mr-1" /> {item.location}
            </span>
            {item.seller && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                <span>{item.seller.rating}</span>
                {item.seller.verified && <ShieldCheck className="h-3 w-3 text-green-500" />}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function BuyerRequestCard({ forecast }: { forecast: DemandForecast & { buyer?: User } }) {
  const [, navigate] = useLocation();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col border-blue-200 bg-blue-50/30"
      data-testid={`card-forecast-${forecast.id}`}
    >
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <Badge className="bg-blue-600/90 text-white border-none">
            <ShoppingBag className="h-3 w-3 mr-1" /> Wanted
          </Badge>
          {forecast.preferredGrade && (
            <Badge className={`
              ${forecast.preferredGrade === 'A' ? 'bg-green-500' : 
                forecast.preferredGrade === 'B' ? 'bg-yellow-500' : 'bg-orange-500'}
              text-white border-none
            `}>
              Grade {forecast.preferredGrade}
            </Badge>
          )}
        </div>
        
        <h3 className="font-heading font-semibold text-lg mb-1">
          {forecast.productName}
        </h3>
        <Badge variant="outline" className="w-fit mb-3 capitalize">{forecast.category}</Badge>
        
        <div className="space-y-2 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span><strong>{forecast.quantity} {forecast.unit}</strong> {forecast.frequency !== "one_off" ? forecast.frequency : "(one-time)"}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{forecast.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(forecast.startDate).toLocaleDateString()} - {new Date(forecast.endDate).toLocaleDateString()}
            </span>
          </div>
          {forecast.targetPrice && (
            <div className="flex items-center gap-2 font-semibold text-foreground">
              Target: K{forecast.targetPrice}/{forecast.unit}
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          {forecast.buyer && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{forecast.buyer.name}</span>
              {forecast.buyer.verified && <ShieldCheck className="h-3 w-3 text-green-500" />}
            </div>
          )}
          <Button 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              navigate("/dashboard");
            }}
            data-testid={`button-respond-${forecast.id}`}
          >
            Respond
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TransportJobCard({ job }: { job: TransportJob & { seller?: User; buyer?: User } }) {
  const [, navigate] = useLocation();
  
  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full flex flex-col border-orange-200 bg-orange-50/30"
      data-testid={`card-transport-${job.id}`}
    >
      <CardContent className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-3">
          <Badge className="bg-orange-600/90 text-white border-none">
            <Truck className="h-3 w-3 mr-1" /> Transport Job
          </Badge>
          {job.priority && (
            <Badge variant={job.priority === 'urgent' ? 'destructive' : 'secondary'}>
              {job.priority}
            </Badge>
          )}
        </div>
        
        <h3 className="font-heading font-semibold text-lg mb-3 capitalize">
          {job.productType} {job.quantity && job.unit && `(${job.quantity} ${job.unit})`}
        </h3>
        
        <div className="space-y-2 text-sm text-muted-foreground flex-1">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span><strong>From:</strong> {job.pickupLocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-600" />
            <span><strong>To:</strong> {job.deliveryLocation}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Pickup: {new Date(job.pickupDate).toLocaleDateString()}</span>
          </div>
          {job.weight && (
            <div className="flex items-center gap-2">
              <Weight className="h-4 w-4" />
              <span>{job.weight} kg</span>
            </div>
          )}
          {job.vehicleType && (
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              <span>{job.vehicleType}</span>
            </div>
          )}
        </div>
        
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="font-bold text-lg text-primary">
              K{job.suggestedPrice}
            </div>
            <Button 
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                navigate("/dashboard");
              }}
              data-testid={`button-quote-${job.id}`}
            >
              Submit Quote
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
