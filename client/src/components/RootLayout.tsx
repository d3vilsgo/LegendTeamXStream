import React, { useState } from 'react';
import MainNavigation from './MainNavigation';
import CategorySidebar from './CategorySidebar';
import ContentGrid from './ContentGrid';
import PlayerPanel from './PlayerPanel';
import LoginScreen from './LoginScreen';
import { useXtreamApi } from '@/hooks/useXtreamApi';
import { ContentMode, MediaItem, Category } from '@/types';
import { useToast } from '@/hooks/use-toast';

const RootLayout: React.FC = () => {
  const [mode, setMode] = useState<ContentMode>('live');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null);
  const { toast } = useToast();
  
  const { 
    isAuthenticated, 
    login, 
    liveCategories, 
    getLiveStreamsByCategory,
    vodCategories,
    getVodStreamsByCategory,
    seriesCategories,
    getSeriesByCategory
  } = useXtreamApi();

  // Get the current categories based on the mode
  const getCurrentCategories = () => {
    switch (mode) {
      case 'live':
        return liveCategories.data || [];
      case 'vod':
        return vodCategories.data || [];
      case 'series':
        return seriesCategories.data || [];
      default:
        return [];
    }
  };

  // Get the loading state for categories
  const isCategoriesLoading = () => {
    switch (mode) {
      case 'live':
        return liveCategories.isLoading;
      case 'vod':
        return vodCategories.isLoading;
      case 'series':
        return seriesCategories.isLoading;
      default:
        return false;
    }
  };

  // Get the current selected category name
  const getSelectedCategoryName = () => {
    const categories = getCurrentCategories();
    const category = categories.find(c => c.category_id === selectedCategoryId);
    return category?.category_name;
  };

  // Get content items for the selected category
  const contentQueryResult = (() => {
    switch (mode) {
      case 'live':
        return getLiveStreamsByCategory(selectedCategoryId);
      case 'vod':
        return getVodStreamsByCategory(selectedCategoryId);
      case 'series':
        return getSeriesByCategory(selectedCategoryId);
      default:
        return { data: [], isLoading: false };
    }
  })();

  // Handle mode change
  const handleModeChange = (newMode: ContentMode) => {
    setMode(newMode);
    setSelectedCategoryId(undefined);
    setSelectedMediaItem(null);
    
    // When changing modes, set the first category as selected if available
    const categories = (() => {
      switch (newMode) {
        case 'live':
          return liveCategories.data || [];
        case 'vod':
          return vodCategories.data || [];
        case 'series':
          return seriesCategories.data || [];
        default:
          return [];
      }
    })();
    
    if (categories.length > 0) {
      setSelectedCategoryId(categories[0].category_id);
    }
  };

  // Handle login
  const handleLogin = (credentials: any) => {
    login.mutate(credentials, {
      onSuccess: () => {
        toast({
          title: 'Connected Successfully',
          description: 'You are now connected to the IPTV service',
        });
      },
      onError: (error) => {
        toast({
          title: 'Connection Failed',
          description: error instanceof Error ? error.message : 'Failed to connect to the IPTV service',
          variant: 'destructive'
        });
      }
    });
  };

  // Handle selecting a media item
  const handleSelectMediaItem = (item: MediaItem) => {
    setSelectedMediaItem(item);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <MainNavigation currentMode={mode} onModeChange={handleModeChange} />
      
      <div className="flex flex-1 overflow-hidden">
        {!isAuthenticated ? (
          <LoginScreen onLogin={handleLogin} isLoading={login.isPending} />
        ) : (
          <>
            <CategorySidebar 
              categories={getCurrentCategories()}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              isLoading={isCategoriesLoading()}
            />
            
            <ContentGrid 
              items={contentQueryResult.data || []}
              onSelectItem={handleSelectMediaItem}
              isLoading={contentQueryResult.isLoading}
              contentType={mode}
              categoryName={getSelectedCategoryName()}
            />
            
            {selectedMediaItem && (
              <PlayerPanel 
                mediaItem={selectedMediaItem}
                onClose={() => setSelectedMediaItem(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default RootLayout;
