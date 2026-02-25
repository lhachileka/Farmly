import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { coopsApi, type Coop, type User } from "@/lib/api";
import { Users, MapPin, Package, Plus, Search, BadgeCheck, Wheat, Leaf, Drumstick, Factory } from "lucide-react";
import { useState } from "react";

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

function CoopCard({ coop, currentUser }: { coop: Coop; currentUser?: User | null }) {
  const [, navigate] = useLocation();
  const CategoryIcon = categoryIcons[coop.productType] || Package;

  const pricePerUnit = parseFloat(coop.pricePerUnit);
  const totalValue = pricePerUnit * parseFloat(coop.targetQuantity);

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => navigate(`/coops/${coop.id}`)}
      data-testid={`card-coop-${coop.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
              <CategoryIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-lg">{coop.title}</CardTitle>
              <CardDescription className="text-sm">{coop.productName}</CardDescription>
            </div>
          </div>
          <Badge className={statusColors[coop.status]}>
            {coop.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{coop.location}</span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">{coop.percentFilled || 0}%</span>
          </div>
          <Progress value={coop.percentFilled || 0} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{parseFloat(coop.currentQuantity).toLocaleString()} {coop.unit}</span>
            <span>{parseFloat(coop.targetQuantity).toLocaleString()} {coop.unit}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Price:</span>
            <span className="ml-1 font-medium">K{pricePerUnit.toLocaleString()}/{coop.unit}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total:</span>
            <span className="ml-1 font-medium">K{totalValue.toLocaleString()}</span>
          </div>
        </div>

        {coop.leader && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">Led by {coop.leader.name}</span>
            {coop.leader.verified && (
              <BadgeCheck className="w-4 h-4 text-blue-500" />
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        {coop.status === "recruiting" && currentUser?.role === "farmer" && (
          <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/coops/${coop.id}`); }}>
            Join Co-Op
          </Button>
        )}
        {coop.status === "active" && currentUser?.role === "buyer" && (
          <Button className="w-full" onClick={(e) => { e.stopPropagation(); navigate(`/coops/${coop.id}`); }}>
            Place Order
          </Button>
        )}
        {(coop.status !== "recruiting" || currentUser?.role !== "farmer") && 
         (coop.status !== "active" || currentUser?.role !== "buyer") && (
          <Button variant="ghost" className="w-full">View Details</Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function CoopsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
  });

  const { data: coops, isLoading } = useQuery({
    queryKey: ["/api/coops", statusFilter, categoryFilter],
    queryFn: () => coopsApi.getAll({
      status: statusFilter === "all" ? undefined : statusFilter,
      productType: categoryFilter === "all" ? undefined : categoryFilter,
    }),
  });

  const filteredCoops = coops?.filter(coop => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      coop.title.toLowerCase().includes(search) ||
      coop.productName.toLowerCase().includes(search) ||
      coop.location.toLowerCase().includes(search)
    );
  });

  const recruitingCoops = filteredCoops?.filter(c => c.status === "recruiting") || [];
  const activeCoops = filteredCoops?.filter(c => c.status === "active") || [];
  const otherCoops = filteredCoops?.filter(c => !["recruiting", "active"].includes(c.status)) || [];

  const canCreateCoop = currentUser?.role === "farmer" && currentUser?.verified;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Group Supply Co-Ops</h1>
          <p className="text-muted-foreground mt-1">
            Pool resources with other producers to fulfill large buyer orders
          </p>
        </div>
        {canCreateCoop && (
          <Button onClick={() => navigate("/coops/create")} data-testid="button-create-coop">
            <Plus className="w-4 h-4 mr-2" />
            Create Co-Op
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search co-ops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-coops"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="produce">Produce</SelectItem>
            <SelectItem value="livestock">Livestock</SelectItem>
            <SelectItem value="grains">Grains</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="recruiting">Recruiting</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="order_placed">Order Placed</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="recruiting" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recruiting" data-testid="tab-recruiting">
              Recruiting ({recruitingCoops.length})
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              Active ({activeCoops.length})
            </TabsTrigger>
            <TabsTrigger value="other" data-testid="tab-other">
              Other ({otherCoops.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recruiting">
            {recruitingCoops.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Co-Ops Recruiting</h3>
                  <p className="text-muted-foreground mb-4">
                    {currentUser?.role === "farmer" 
                      ? "Start a new co-op to pool resources with other producers"
                      : "Check back later for new co-op opportunities"}
                  </p>
                  {canCreateCoop && (
                    <Button onClick={() => navigate("/coops/create")}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Co-Op
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recruitingCoops.map((coop) => (
                  <CoopCard key={coop.id} coop={coop} currentUser={currentUser} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeCoops.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Co-Ops</h3>
                  <p className="text-muted-foreground">
                    Co-ops become active when they reach their target quantity
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCoops.map((coop) => (
                  <CoopCard key={coop.id} coop={coop} currentUser={currentUser} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="other">
            {otherCoops.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Other Co-Ops</h3>
                  <p className="text-muted-foreground">
                    Completed and cancelled co-ops will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherCoops.map((coop) => (
                  <CoopCard key={coop.id} coop={coop} currentUser={currentUser} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
