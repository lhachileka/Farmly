import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Heart, Trash2, ShoppingCart, Users, Star, UserCheck, Truck } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { authApi, favouritesApi } from "@/lib/api";
import { FavoriteButton } from "@/components/favorite-button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Favorite {
  id: string;
  listingId: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    description: string;
    category: string;
    price: number;
    unit: string;
    quantity: number;
    location: string;
    images: string[];
    status: string;
  };
}

interface UserFavourite {
  id: string;
  userId: string;
  favouriteUserId: string;
  favouriteRole: string;
  createdAt: string;
  favouriteUser: {
    id: string;
    username: string;
    fullName: string;
    role: string;
    location: string;
    isVerified: boolean;
    avatar?: string;
  };
}

export default function Favorites() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("products");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: currentUser, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getCurrentUser,
  });

  useEffect(() => {
    if (!userLoading && !currentUser) {
      setLocation("/auth");
    }
  }, [userLoading, currentUser, setLocation]);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["/api/favorites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/favorites");
      return res.json();
    },
    enabled: !!currentUser,
  });

  const { data: userFavourites = [], isLoading: loadingUserFavourites } = useQuery({
    queryKey: ["/api/favourites"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/favourites");
      return res.json() as Promise<UserFavourite[]>;
    },
    enabled: !!currentUser,
  });

  const removeFavouriteMutation = useMutation({
    mutationFn: (userId: string) => favouritesApi.remove(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
      toast({ title: "Removed from trusted partners" });
    },
    onError: () => {
      toast({ title: "Failed to remove", variant: "destructive" });
    },
  });

  if (userLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "farmer": return <UserCheck className="h-4 w-4" />;
      case "buyer": return <ShoppingCart className="h-4 w-4" />;
      case "transporter": return <Truck className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-8 w-8 text-red-500" />
          <h1 className="text-3xl font-bold">My Favorites</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="products" data-testid="tab-products">
              <Heart className="h-4 w-4 mr-2" />
              Products ({favorites.length})
            </TabsTrigger>
            <TabsTrigger value="partners" data-testid="tab-partners">
              <Users className="h-4 w-4 mr-2" />
              Trading Partners ({userFavourites.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {favorites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">No favorite products yet</h2>
                  <p className="text-muted-foreground mb-4">
                    Start adding listings to your favorites to get notified about price drops!
                  </p>
                  <Button onClick={() => setLocation("/marketplace")} data-testid="button-browse-marketplace">
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {favorites.map((fav: Favorite) => (
                  <Card 
                    key={fav.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setLocation(`/product/${fav.listing.id}`)}
                    data-testid={`favorite-card-${fav.listing.id}`}
                  >
                    <div className="relative">
                      {fav.listing.images[0] && (
                        <img
                          src={fav.listing.images[0]}
                          alt={fav.listing.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <FavoriteButton listingId={fav.listing.id} variant="icon" />
                      </div>
                      {fav.listing.status !== "active" && (
                        <div className="absolute top-2 left-2">
                          <Badge variant="secondary" className="capitalize">
                            {fav.listing.status}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{fav.listing.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{fav.listing.location}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-primary">
                          K{fav.listing.price.toLocaleString()}/{fav.listing.unit}
                        </span>
                        <Badge variant="outline" className="capitalize">
                          {fav.listing.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Added {new Date(fav.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Get notified about price drops</h3>
                    <p className="text-sm text-muted-foreground">
                      When sellers lower prices on your favorited items, you'll receive a notification so you never miss a deal!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            {loadingUserFavourites ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : userFavourites.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h2 className="text-xl font-semibold mb-2">No trusted trading partners yet</h2>
                  <p className="text-muted-foreground mb-4">
                    After completing a transaction with a producer, buyer, or logistics partner, you can add them as a trusted partner for priority access in future deals.
                  </p>
                  <Button onClick={() => setLocation("/marketplace")} data-testid="button-browse-marketplace-partners">
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {userFavourites.map((fav: UserFavourite) => (
                  <Card key={fav.id} className="overflow-hidden" data-testid={`partner-card-${fav.favouriteUser.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {fav.favouriteUser.fullName?.charAt(0) || fav.favouriteUser.username?.charAt(0) || "?"}
                          </div>
                          <div>
                            <h3 className="font-semibold">{fav.favouriteUser.fullName || fav.favouriteUser.username}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize flex items-center gap-1">
                                {getRoleIcon(fav.favouriteUser.role)}
                                {fav.favouriteUser.role}
                              </Badge>
                              {fav.favouriteUser.isVerified && (
                                <Badge className="bg-green-500 text-white">
                                  <Star className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">
                        {fav.favouriteUser.location || "Location not specified"}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          Added {new Date(fav.createdAt).toLocaleDateString()}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavouriteMutation.mutate(fav.favouriteUser.id);
                          }}
                          disabled={removeFavouriteMutation.isPending}
                          data-testid={`remove-partner-${fav.favouriteUser.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardContent className="py-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">How trusted partners work</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Complete a transaction with a producer, buyer, or logistics partner to add them</li>
                      <li>• Favourite logistics partners get priority for your transport jobs</li>
                      <li>• Build a reliable network of trusted agricultural partners</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
