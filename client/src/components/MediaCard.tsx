import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart } from 'lucide-react';
import { MediaItem, ContentMode } from '@shared/schema';

interface MediaCardProps {
  item: MediaItem;
  onSelect: (item: MediaItem) => void;
  contentType: ContentMode;
}

export default function MediaCard({ item, onSelect, contentType }: MediaCardProps) {
  // Determine the image to use
  const imageUrl = item.stream_icon || 
                  item.cover || 
                  item.movie_image || 
                  getDefaultImage(contentType);
  
  // Handle click
  const handleClick = () => {
    onSelect(item);
  };
  
  return (
    <Card 
      className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer group"
      onClick={handleClick}
    >
      <div className="relative aspect-video bg-muted">
        <img 
          src={imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
        />
        
        {item.isFavorite && (
          <div className="absolute top-2 right-2 bg-background/80 p-1 rounded-full">
            <Heart className="h-4 w-4 text-red-500 fill-current" />
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 h-10">
          {item.name}
        </h3>
      </CardContent>
    </Card>
  );
}

// Default images for different content types
function getDefaultImage(contentType: ContentMode): string {
  switch (contentType) {
    case 'live':
      return 'https://placehold.co/400x225/333/white?text=Live+TV';
    case 'vod':
      return 'https://placehold.co/400x225/333/white?text=Movie';
    case 'series':
      return 'https://placehold.co/400x225/333/white?text=Series';
    case 'favorites':
      return 'https://placehold.co/400x225/333/white?text=Favorite';
    case 'history':
      return 'https://placehold.co/400x225/333/white?text=History';
    default:
      return 'https://placehold.co/400x225/333/white?text=Media';
  }
}