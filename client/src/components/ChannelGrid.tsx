import { useEffect } from 'react';
import { useChannelStore } from '@/store/useChannelStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import ChannelCard from './ChannelCard';
import { Loader2 } from 'lucide-react';

export default function ChannelGrid() {
  const { 
    selectedCategoryId, 
    isLoading, 
    error,
    getFilteredStreams,
    fetchStreams,
    searchQuery
  } = useChannelStore();
  
  const { fetchFavorites } = useFavoritesStore();
  
  useEffect(() => {
    // Fetch initial streams if category is selected
    if (selectedCategoryId) {
      fetchStreams(selectedCategoryId);
    }
    
    // Fetch favorites
    fetchFavorites();
  }, [selectedCategoryId, fetchStreams, fetchFavorites]);
  
  const streams = getFilteredStreams();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-500 mb-2">Error Loading Content</h3>
          <p className="text-white/70">{error}</p>
        </div>
      </div>
    );
  }
  
  if (streams.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-white mb-2">No Content Found</h3>
          {searchQuery ? (
            <p className="text-white/70">No results for "{searchQuery}"</p>
          ) : (
            <p className="text-white/70">This category is empty</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {streams.map((stream) => (
        <ChannelCard 
          key={'series_id' in stream ? stream.series_id : (stream.stream_id || Math.random().toString())}
          stream={stream as any} 
        />
      ))}
    </div>
  );
}
