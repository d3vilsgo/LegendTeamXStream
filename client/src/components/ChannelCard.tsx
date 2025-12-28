import { useState } from 'react';
import { Play, Heart } from 'lucide-react';
import { Stream } from '@/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';

interface ChannelCardProps {
  stream: Stream;
}

export default function ChannelCard({ stream }: ChannelCardProps) {
  const { openPlayer } = usePlayerStore();
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavoritesStore();
  const [isHovered, setIsHovered] = useState(false);
  
  const handlePlay = () => {
    openPlayer(stream);
  };
  
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorite(stream.stream_id || ('series_id' in stream ? stream.series_id : ''))) {
      removeFromFavorites(stream.stream_id || ('series_id' in stream ? stream.series_id : ''));
    } else {
      addToFavorites(stream);
    }
  };
  
  const favorite = isFavorite(stream.stream_id || ('series_id' in stream ? stream.series_id : ''));
  
  // Determine image url
  const imageUrl = stream.stream_icon || stream.cover || 
    `https://placehold.co/400x240/1f1f1f/ffffff?text=${encodeURIComponent(stream.name)}`;
  
  return (
    <div 
      className="channel-card bg-background-surface rounded-lg overflow-hidden shadow-lg hover:ring-2 hover:ring-primary transition-all duration-300 cursor-pointer group"
      onClick={handlePlay}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-40">
        <img 
          src={imageUrl} 
          alt={stream.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/400x240/1f1f1f/ffffff?text=${encodeURIComponent(stream.name)}`;
          }}
        />
        <div className="absolute inset-0 channel-overlay bg-black bg-opacity-70 flex items-center justify-center">
          <button className="bg-primary hover:bg-primary-hover rounded-full p-3 transition-all duration-300 transform hover:scale-110">
            <Play className="h-8 w-8 text-white" fill="white" />
          </button>
        </div>
        
        {'stream_type' in stream && stream.stream_type === 'live' && (
          <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-md">LIVE</div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-2 gradient-overlay">
          <div className="flex justify-between items-end">
            <span className="text-white font-medium truncate">{stream.name}</span>
            <div className="flex space-x-1">
              <button 
                className={`${favorite ? 'text-red-500' : 'text-gray-400'} hover:text-red-500`}
                onClick={handleFavoriteToggle}
              >
                <Heart className="h-5 w-5" fill={favorite ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
