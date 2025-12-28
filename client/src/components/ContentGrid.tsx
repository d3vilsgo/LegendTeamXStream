import React from 'react';
import MediaCard from './MediaCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { MediaItem, ContentMode } from '@shared/schema';

interface ContentGridProps {
  items: MediaItem[];
  onSelectItem: (item: MediaItem) => void;
  isLoading: boolean;
  contentType: ContentMode;
  categoryName?: string;
}

export default function ContentGrid({
  items,
  onSelectItem,
  isLoading,
  contentType,
  categoryName = 'İçerikler'
}: ContentGridProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold">
          {contentType === 'live' && 'Canlı TV'}
          {contentType === 'vod' && 'Filmler'}
          {contentType === 'series' && 'Diziler'}
          {contentType === 'favorites' && 'Favoriler'}
          {contentType === 'history' && 'İzleme Geçmişi'}
          {categoryName && (
            <span className="text-muted-foreground font-normal text-lg ml-2">
              / {categoryName}
            </span>
          )}
        </h1>
      </div>
      
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="h-96 flex items-center justify-center text-muted-foreground">
            Bu kategoride içerik bulunamadı.
          </div>
        ) : (
          <div className="p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((item) => (
              <MediaCard
                key={item.stream_id}
                item={item}
                onSelect={onSelectItem}
                contentType={contentType}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}