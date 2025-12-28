import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserFavorite, ContentMode, MediaItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Convert UserFavorite to MediaItem
const favoriteToMediaItem = (favorite: UserFavorite): MediaItem => {
  return {
    stream_id: parseInt(favorite.streamId),
    name: favorite.streamName,
    stream_icon: favorite.streamIcon || undefined,
    category_id: favorite.category || "",
    isFavorite: true,
  };
};

// Get all favorites for a user
export const useFavorites = (userId: number) => {
  return useQuery({
    queryKey: ["/api/favorites", userId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/favorites?userId=${userId}`
      );
      const data = await response.json();
      return data.favorites;
    },
    enabled: !!userId,
  });
};

// Add favorite
export const useAddFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      userId: number;
      contentType: ContentMode;
      streamId: string;
      streamName: string;
      streamIcon?: string;
      category?: string;
    }) => {
      const response = await apiRequest("POST", "/api/favorites", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", variables.userId] });
      toast({
        title: "Favorilere eklendi",
        description: `${variables.streamName} favorilerinize eklendi.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Favorilere eklenirken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Remove favorite
export const useRemoveFavorite = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: {
      userId: number;
      contentType: ContentMode;
      streamId: string;
      streamName: string;
    }) => {
      const response = await apiRequest("DELETE", "/api/favorites", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/favorites", variables.userId] });
      toast({
        title: "Favorilerden çıkarıldı",
        description: `${variables.streamName} favorilerinizden çıkarıldı.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: `Favorilerden çıkarılırken bir hata oluştu: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};

// Check if an item is in favorites
export const useIsFavorite = (userId: number, contentType: ContentMode, streamId: string) => {
  const { data: favorites } = useFavorites(userId);
  
  return !!favorites?.find(
    (f: UserFavorite) => 
      f.contentType === contentType && f.streamId === streamId
  );
};

// Get favorites by content type
export const useContentTypeFavorites = (userId: number, contentType: ContentMode) => {
  const { data: allFavorites, isLoading, error } = useFavorites(userId);
  
  const filteredFavorites = allFavorites
    ? allFavorites
        .filter((f: UserFavorite) => f.contentType === contentType)
        .map(favoriteToMediaItem)
    : [];
  
  return { 
    data: filteredFavorites, 
    isLoading, 
    error 
  };
};