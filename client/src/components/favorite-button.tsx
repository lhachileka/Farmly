import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface FavoriteButtonProps {
  listingId: string;
  variant?: "icon" | "default";
  size?: "sm" | "default" | "lg";
}

export function FavoriteButton({ listingId, variant = "icon", size = "default" }: FavoriteButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: favoriteStatus, isLoading } = useQuery({
    queryKey: ["/api/favorites", listingId, "check"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/favorites/${listingId}/check`);
      return res.json();
    },
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/favorites/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", listingId, "check"] });
      toast({ title: "Added to favorites" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/favorites/${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", listingId, "check"] });
      toast({ title: "Removed from favorites" });
    },
  });

  const isFavorited = favoriteStatus?.isFavorited || false;
  const isPending = addMutation.isPending || removeMutation.isPending;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorited) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  if (variant === "icon") {
    return (
      <Button
        data-testid={`button-favorite-${listingId}`}
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isPending || isLoading}
        className={`rounded-full ${isFavorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500"}`}
      >
        <Heart className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
      </Button>
    );
  }

  return (
    <Button
      data-testid={`button-favorite-${listingId}`}
      variant={isFavorited ? "default" : "outline"}
      size={size}
      onClick={handleClick}
      disabled={isPending || isLoading}
      className={isFavorited ? "bg-red-500 hover:bg-red-600" : ""}
    >
      <Heart className={`h-4 w-4 mr-2 ${isFavorited ? "fill-current" : ""}`} />
      {isFavorited ? "Favorited" : "Add to Favorites"}
    </Button>
  );
}
