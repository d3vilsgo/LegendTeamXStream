import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ContentHistory, ContentMode, MediaItem } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Convert ContentHistory to MediaItem
const historyToMediaItem = (history: ContentHistory): MediaItem => {
  return {
    stream_id: parseInt(history.streamId),
    name: history.streamName,
    stream_icon: history.streamIcon || undefined,
    category_id: "",
  };
};

// Get all history for a user
export const useHistory = (userId: number) => {
  return useQuery({
    queryKey: ["/api/history", userId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/history?userId=${userId}`
      );
      const data = await response.json();
      return data.history;
    },
    enabled: !!userId,
  });
};

// Update history
export const useUpdateHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      userId: number;
      contentType: ContentMode;
      streamId: string;
      streamName: string;
      streamIcon?: string;
      watchDuration?: number;
      progress?: number;
    }) => {
      const response = await apiRequest("POST", "/api/history", data);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/history", variables.userId] });
    },
  });
};

// Clear history
export const useClearHistory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", "/api/history", { userId });
      return response.json();
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/history", userId] });
    },
  });
};

// Filter history by content type
export const useContentTypeHistory = (userId: number, contentType: ContentMode) => {
  const { data: allHistory, isLoading, error } = useHistory(userId);
  
  const filteredHistory = allHistory
    ? allHistory
        .filter((h: ContentHistory) => h.contentType === contentType)
        .map(historyToMediaItem)
    : [];
  
  return { 
    data: filteredHistory, 
    isLoading, 
    error 
  };
};

// Get recently watched items
export const useRecentlyWatched = (userId: number, limit = 10) => {
  const { data: allHistory, isLoading, error } = useHistory(userId);
  
  const recentlyWatched = allHistory
    ? allHistory
        .sort((a: ContentHistory, b: ContentHistory) => {
          const dateA = a.lastWatched ? new Date(a.lastWatched) : new Date(0);
          const dateB = b.lastWatched ? new Date(b.lastWatched) : new Date(0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, limit)
        .map(historyToMediaItem)
    : [];
  
  return { 
    data: recentlyWatched, 
    isLoading, 
    error 
  };
};