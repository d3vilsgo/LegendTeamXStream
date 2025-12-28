import { useState, useEffect } from 'react';
import { Play, X, ChevronRight } from 'lucide-react';

interface Episode {
  id: string;
  episode_num: number;
  title: string;
  season_num: number;
  info?: string;
  duration?: string;
}

interface SeriesEpisodeSelectorProps {
  series: any;
  onEpisodeSelect: (episode: Episode, seasonNumber: number) => void;
  onClose: () => void;
}

export default function SeriesEpisodeSelector({ 
  series, 
  onEpisodeSelect, 
  onClose 
}: SeriesEpisodeSelectorProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]);

  // Mock seasons ve episodes oluştur
  useEffect(() => {
    // Gerçek API'den sezon listesi alınacak
    // Şimdilik mock data
    const seasons = [1, 2, 3, 4, 5]; // series.seasons || 
    setAvailableSeasons(seasons);
  }, [series]);

  // Mock episodes oluştur
  const generateMockEpisodes = (seasonNum: number): Episode[] => {
    const episodes: Episode[] = [];
    const episodeCount = seasonNum === 1 ? 12 : seasonNum === 2 ? 10 : 8; // Farklı sezonlarda farklı bölüm sayıları
    
    // Series ID'yi al
    const seriesId = series.series_id || series.id;
    
    for (let i = 1; i <= episodeCount; i++) {
      // Gerçek episode ID formatını oluştur (server'dan gelecek)
      const episodeId = `${seriesId}_s${seasonNum}_e${i}`;
      
      episodes.push({
        id: episodeId, // Bu ID server'a gönderilecek
        episode_num: i,
        title: `${i}. Bölüm`,
        season_num: seasonNum,
        info: `${series.name} - Sezon ${seasonNum}, Bölüm ${i}`,
        duration: `${40 + Math.floor(Math.random() * 20)} dk` // Random duration
      });
    }
    
    console.log('📺 Generated episodes for season', seasonNum, episodes);
    return episodes;
  };

  const currentEpisodes = generateMockEpisodes(selectedSeason);

  const handleEpisodeClick = (episode: Episode) => {
    setLoading(true);
    console.log('🎬 Episode clicked in selector:', { 
      episode, 
      season: selectedSeason,
      seriesInfo: {
        series_id: series.series_id,
        id: series.id,
        name: series.name
      }
    });
    
    // Kısa bir gecikme simülasyonu
    setTimeout(() => {
      onEpisodeSelect(episode, selectedSeason);
      setLoading(false);
    }, 500);
  };

  const handleSeasonChange = (seasonNum: number) => {
    if (loading) return;
    setSelectedSeason(seasonNum);
  };

  // ESC tuşu ile çıkış
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 6h6V4H9v2z" />
                </svg>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-white">{series.name}</h2>
                <p className="text-gray-400 mt-1">Sezon ve bölüm seçin</p>
                <div className="flex items-center mt-2 space-x-2">
                  <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full">
                    Dizi
                  </span>
                  <span className="bg-green-600/20 text-green-400 text-xs px-2 py-1 rounded-full">
                    {availableSeasons.length} Sezon
                  </span>
                  <span className="bg-purple-600/20 text-purple-400 text-xs px-2 py-1 rounded-full">
                    {currentEpisodes.length} Bölüm
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[70vh]">
          {/* Season Selector */}
          <div className="w-80 border-r border-gray-700 bg-gray-800/50">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Sezonlar
              </h3>
            </div>
            
            <div className="p-4 space-y-2 overflow-y-auto max-h-full">
              {availableSeasons.map((seasonNum) => {
                const episodeCount = generateMockEpisodes(seasonNum).length;
                const isSelected = selectedSeason === seasonNum;
                
                return (
                  <button
                    key={seasonNum}
                    onClick={() => handleSeasonChange(seasonNum)}
                    disabled={loading}
                    className={`w-full text-left p-4 rounded-lg transition-all duration-200 group ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold">Sezon {seasonNum}</div>
                        <div className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                          {episodeCount} bölüm
                        </div>
                      </div>
                      
                      <ChevronRight 
                        className={`w-5 h-5 transition-transform ${
                          isSelected ? 'rotate-90' : 'group-hover:translate-x-1'
                        }`} 
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Episodes List */}
          <div className="flex-1 flex flex-col">
            <div className="p-4 border-b border-gray-700 bg-gray-800/30">
              <h3 className="text-white font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000 6h1m-1-6V6a3 3 0 013-3h1a3 3 0 013 3v1M9 10h6v6H9z" />
                </svg>
                Sezon {selectedSeason} Bölümleri
                <span className="ml-2 bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded-full">
                  {currentEpisodes.length} bölüm
                </span>
              </h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Bölümler yükleniyor...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentEpisodes.map((episode, index) => (
                    <div
                      key={episode.id}
                      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all duration-200 cursor-pointer group border border-gray-700 hover:border-gray-600"
                      onClick={() => handleEpisodeClick(episode)}
                    >
                      {/* Episode Thumbnail */}
                      <div className="relative h-32 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                        <div className="text-gray-400 group-hover:text-white transition-colors">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 000 6h1m-1-6V6a3 3 0 013-3h1a3 3 0 013 3v1M9 10h6v6H9z" />
                          </svg>
                        </div>
                        
                        {/* Episode number overlay */}
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded">
                          {episode.episode_num}
                        </div>
                        
                        {/* Duration overlay */}
                        {episode.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {episode.duration}
                          </div>
                        )}
                        
                        {/* Play button overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-blue-600 hover:bg-blue-700 rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform">
                            <Play className="w-6 h-6 text-white" fill="currentColor" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Episode Info */}
                      <div className="p-4">
                        <h4 className="text-white font-semibold group-hover:text-blue-400 transition-colors mb-1">
                          {episode.title}
                        </h4>
                        
                        {episode.info && (
                          <p className="text-gray-400 text-sm line-clamp-2">
                            {episode.info}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            S{episode.season_num}E{episode.episode_num}
                          </span>
                          
                          <div className="flex items-center text-blue-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 mr-1" fill="currentColor" />
                            İzle
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
          <div className="text-sm text-gray-400">
            <span className="font-medium">Sezon {selectedSeason}</span> - {currentEpisodes.length} bölüm mevcut
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              İptal
            </button>
            
            <span className="text-gray-600">|</span>
            
            <div className="text-xs text-gray-500">
              ESC tuşu ile çıkabilirsiniz
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}