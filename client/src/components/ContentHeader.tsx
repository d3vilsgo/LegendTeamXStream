import { useChannelStore } from '@/store/useChannelStore';
import { ListFilter, Grid, LayoutGrid } from 'lucide-react';

export default function ContentHeader() {
  const { 
    contentType, 
    selectedCategoryId,
    liveCategories,
    vodCategories,
    seriesCategories
  } = useChannelStore();
  
  // Find the category name based on the selected ID
  const getCategoryName = () => {
    if (!selectedCategoryId) return 'All';
    
    const categories = contentType === 'live' ? liveCategories : 
                      contentType === 'vod' ? vodCategories : seriesCategories;
    
    const category = categories.find(cat => cat.category_id === selectedCategoryId);
    return category ? category.category_name : 'Unknown';
  };
  
  // Get content type heading
  const getContentTypeHeading = () => {
    switch (contentType) {
      case 'live':
        return 'Live TV Channels';
      case 'vod':
        return 'Movies';
      case 'series':
        return 'TV Series';
      default:
        return 'Content';
    }
  };

  return (
    <header className="bg-background-surface border-b border-gray-800 p-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-white">{getContentTypeHeading()}</h1>
        <p className="text-sm text-white/70">{getCategoryName()} category</p>
      </div>
      <div className="flex space-x-2">
        <button className="p-2 bg-background-elevated rounded-md text-white/70 hover:text-white hover:bg-gray-700">
          <ListFilter className="h-5 w-5" />
        </button>
        <button className="p-2 bg-background-elevated rounded-md text-white/70 hover:text-white hover:bg-gray-700">
          <LayoutGrid className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
