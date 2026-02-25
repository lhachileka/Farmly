import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Heart, HeartOff, Loader2 } from "lucide-react";
import { favouritesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface UserFavouriteButtonProps {
  userId: string;
  userName?: string;
  variant?: "default" | "outline" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function UserFavouriteButton({ 
  userId, 
  userName = "this user",
  variant = "outline",
  size = "default",
  className = ""
}: UserFavouriteButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isFavourited, setIsFavourited] = useState(false);

  const { data: favouriteStatus, isLoading: checkingStatus } = useQuery({
    queryKey: ["/api/favourites/check", userId],
    queryFn: () => favouritesApi.check(userId),
    enabled: !!userId,
  });

  useEffect(() => {
    if (favouriteStatus) {
      setIsFavourited(favouriteStatus.isFavourited);
    }
  }, [favouriteStatus]);

  const addMutation = useMutation({
    mutationFn: () => favouritesApi.add(userId),
    onSuccess: () => {
      setIsFavourited(true);
      queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favourites/check", userId] });
      toast({ title: `Added ${userName} to trusted partners` });
    },
    onError: (error: any) => {
      toast({ 
        title: "Couldn't add to favourites",
        description: error.message || "You may need to complete a transaction with this user first",
        variant: "destructive"
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => favouritesApi.remove(userId),
    onSuccess: () => {
      setIsFavourited(false);
      queryClient.invalidateQueries({ queryKey: ["/api/favourites"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favourites/check", userId] });
      toast({ title: `Removed ${userName} from trusted partners` });
    },
    onError: () => {
      toast({ 
        title: "Failed to remove",
        variant: "destructive"
      });
    },
  });

  const isLoading = checkingStatus || addMutation.isPending || removeMutation.isPending;

  const handleClick = () => {
    if (isFavourited) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isLoading}
        className={className}
        data-testid={`favourite-user-${userId}`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFavourited ? (
          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
        ) : (
          <Heart className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={`${isFavourited ? "text-red-500 border-red-200 hover:bg-red-50" : ""} ${className}`}
      data-testid={`favourite-user-${userId}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : isFavourited ? (
        <Heart className="h-4 w-4 mr-2 fill-red-500" />
      ) : (
        <Heart className="h-4 w-4 mr-2" />
      )}
      {isFavourited ? "Trusted Partner" : "Add to Favourites"}
    </Button>
  );
}
