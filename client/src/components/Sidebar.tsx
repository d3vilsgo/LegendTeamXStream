import { useState, useEffect } from 'react';
import { useChannelStore } from '@/store/useChannelStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Category } from '@/types';
import { Loader2, Search, Tv, Film, Layers, LogOut, Settings, Heart, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const { user, logout } = useAuthStore();
  const { 
    contentType, 
    liveCategories, 
    vodCategories, 
    seriesCategories,
    selectedCategoryId,
    isLoading,
    fetchCategories, 
    setContentType, 
    setSelectedCategory,
    setSearchQuery
  } = useChannelStore();
  
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Get current categories based on content type
  const categories = contentType === 'live' ? liveCategories : 
                      contentType === 'vod' ? vodCategories : seriesCategories;
  
  const handleContentTypeChange = (type: 'live' | 'vod' | 'series') => {
    setContentType(type);
    setIsMobileMenuOpen(false);
  };
  
  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setIsMobileMenuOpen(false);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setSearchQuery(e.target.value);
  };
  
  const handleLogout = () => {
    logout();
  };
  
  const getChannelCount = (categoryId: string) => {
    // This could be implemented with a more sophisticated count mechanism
    // For now, just show a placeholder
    return '•';
  };
  
  // First letter of username for avatar
  const userInitial = user?.username ? user.username[0].toUpperCase() : 'U';
  
  return (
    <div id="sidebar" className={`w-full md:w-64 bg-background-surface border-r border-gray-800 flex flex-col md:h-full overflow-hidden transition-all duration-300 z-20 ${isMobileMenuOpen ? 'h-screen' : 'h-16 md:h-full'}`}>
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-800">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-white font-bold">
            TV
          </div>
          <h1 className="ml-2 text-xl font-semibold text-white">LegendsTivi</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-gray-700"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Content - Only shown when menu is open on mobile */}
      <div className={`${isMobileMenuOpen ? 'flex' : 'hidden md:flex'} flex-col flex-grow overflow-hidden`}>
        <div className="p-4 flex-shrink-0">
          <div className="hidden md:flex items-center mb-8">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-white font-bold">
              TV
            </div>
            <h1 className="ml-2 text-xl font-semibold text-white">LegendsTivi</h1>
          </div>
          
          {/* User Profile */}
          <div className="flex items-center mb-6 p-2 bg-background-card rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
              {userInitial}
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium text-white">{user?.username}</div>
              <div className="text-xs text-white/70">Premium • Active</div>
            </div>
          </div>
          
          {/* Search Box */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              className="w-full pl-10 pr-4 py-2 rounded-md bg-background-elevated border border-gray-700 focus:border-primary focus:outline-none text-sm"
              placeholder="Search channels, shows..."
              value={searchValue}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Content Type Selection */}
        <nav className="px-4 mb-4">
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Browse</h3>
          <div className="space-y-1">
            <button 
              onClick={() => handleContentTypeChange('live')}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${contentType === 'live' ? 'bg-primary text-white' : 'text-white hover:bg-background-elevated'}`}
            >
              <Tv className="h-5 w-5 mr-3" />
              Live TV
            </button>
            <button 
              onClick={() => handleContentTypeChange('vod')}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${contentType === 'vod' ? 'bg-primary text-white' : 'text-white hover:bg-background-elevated'}`}
            >
              <Film className="h-5 w-5 mr-3" />
              Movies
            </button>
            <button 
              onClick={() => handleContentTypeChange('series')}
              className={`w-full flex items-center px-3 py-2 text-sm rounded-md ${contentType === 'series' ? 'bg-primary text-white' : 'text-white hover:bg-background-elevated'}`}
            >
              <Layers className="h-5 w-5 mr-3" />
              TV Series
            </button>
          </div>
        </nav>

        {/* Categories List */}
        <div className="px-4 overflow-y-auto flex-grow scroll-hide">
          <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2">Categories</h3>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-white/70" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-white/70 py-2">No categories available</div>
          ) : (
            categories.map((category: Category) => (
              <button 
                key={category.category_id}
                onClick={() => handleCategorySelect(category.category_id)}
                className={`w-full flex items-center justify-between px-3 py-2 my-1 text-sm rounded-md group
                  ${selectedCategoryId === category.category_id ? 'bg-background-elevated text-white' : 'text-white hover:bg-background-elevated'}`}
              >
                <span>{category.category_name}</span>
                <span className={`text-xs ${selectedCategoryId === category.category_id ? 'text-white/90' : 'text-white/60 group-hover:text-white/90'}`}>
                  {getChannelCount(category.category_id)}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="p-4 border-t border-gray-800 mt-2">
          <div className="flex items-center justify-between">
            <button className="p-2 rounded-md text-white/70 hover:bg-gray-700 hover:text-white">
              <Settings className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-white/70 hover:bg-gray-700 hover:text-white">
              <Heart className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-md text-white/70 hover:bg-gray-700 hover:text-white">
              <Film className="h-5 w-5" />
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 rounded-md text-white/70 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
