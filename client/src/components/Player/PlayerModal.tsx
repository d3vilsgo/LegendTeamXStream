import { useRef, useEffect, useState } from 'react';
import { X, Heart, Info, Share2, AlertCircle, Settings } from 'lucide-react';
import { Stream } from '@/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { useFavoritesStore } from '@/store/useFavoritesStore';
import EnhancedPlayer from './EnhancedPlayer';
import SeriesEpisodeSelector from './SeriesEpisodeSelector';
import { useToast } from '@/hooks/use-toast';

export default function PlayerModal() {
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showEpisodeSelector, setShowEpisodeSelector] = useState(false);
  const [connectionIssues, setConnectionIssues] = useState(false);
  
  const { toast } = useToast();
  
  const { 
    currentStream,
    streamUrl,
    openPlayer,
    closePlayer,
    isPlayerOpen,
    playbackState
  } = usePlayerStore();

  const { 
    addToFavorites, 
    removeFromFavorites, 
    isFavorite 
  } = useFavoritesStore();
  
  const { loading, error, isPlaying } = playbackState;

  // Series kontrolü - episode seçimi gerekiyor mu?
  useEffect(() => {
    if (currentStream && isPlayerOpen) {
      console.log('🔍 FULL SERIES DEBUG:', {
        currentStream: currentStream,
        keys: Object.keys(currentStream),
        hasSeries: 'series_id' in currentStream,
        hasSeriesID: !!currentStream.series_id,
        hasID: !!currentStream.id,
        hasStreamID: !!currentStream.stream_id,
        hasEpisodeNum: !!currentStream.episode_num,
        hasSeasonNum: !!currentStream.season_num,
        streamUrl: streamUrl,
        isPlayerOpen: isPlayerOpen,
        contentType: currentStream.stream_type || 'unknown',
        categoryName: currentStream.category_name
      });
      
      // GENEL DİZİ DETECTION - farklı field isimleri dene
      const isSeriesContent = (
        // Method 1: series_id field
        'series_id' in currentStream ||
        // Method 2: stream_type check
        currentStream.stream_type === 'series' ||
        // Method 3: category_name check (eğer kategori var)
        (currentStream.category_name && currentStream.category_name.toLowerCase().includes('dizi')) ||
        // Method 4: name pattern check
        (currentStream.name && (currentStream.name.includes('Sezon') || currentStream.name.includes('Season'))) ||
        // Method 5: URL pattern check
        (streamUrl && streamUrl.includes('/series/')) ||
        // Method 6: specific series indicators
        currentStream.is_series ||
        currentStream.type === 'series'
      );
      
      console.log('📺 SERIES DETECTION RESULT:', {
        isSeriesContent,
        needsEpisodeSelection: isSeriesContent && (!currentStream.episode_num || !currentStream.season_num),
        willShowSelector: isSeriesContent && (!currentStream.episode_num || !currentStream.season_num || streamUrl === 'EPISODE_SELECTION_REQUIRED')
      });
      
      // Episode seçimi gerekiyor mu?
      if (isSeriesContent && 
          (!currentStream.episode_num || !currentStream.season_num || 
           streamUrl === 'EPISODE_SELECTION_REQUIRED')) {
        console.log('✅ Series detected - SHOWING episode selector');
        setShowEpisodeSelector(true);
      } else {
        console.log('❌ Not a series or has episode info - NOT showing selector');
        setShowEpisodeSelector(false);
      }
    }
  }, [currentStream, isPlayerOpen, streamUrl]);
  
  // Fullscreen değişikliklerini dinle
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Esc tuşuyla çıkış
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        if (showEpisodeSelector) {
          setShowEpisodeSelector(false);
        } else {
          closePlayer();
        }
      }
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [closePlayer, showEpisodeSelector]);

  // Bağlantı sorunlarını izle
  useEffect(() => {
    if (error && (error.includes('network') || error.includes('timeout') || error.includes('CORS'))) {
      setConnectionIssues(true);
    } else {
      setConnectionIssues(false);
    }
  }, [error]);
  
  // Hata bildirimleri
  useEffect(() => {
    if (error && !loading && !error.includes('Episode') && !error.includes('sezon')) {
      toast({
        title: "Oynatma Hatası",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, loading, toast]);
  
  const handleError = (errorMessage: string) => {
    console.error('🚨 Player error:', errorMessage);
    toast({
      title: "Video Oynatıcı Hatası",
      description: errorMessage,
      variant: "destructive",
    });
  };
  
  const toggleFullscreen = async () => {
    const elem = playerContainerRef.current;
    if (!elem) return;
    
    try {
      if (!document.fullscreenElement) {
        await elem.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      toast({
        title: "Tam Ekran Hatası",
        description: `Tam ekran modu değiştirilemedi: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`,
        variant: "destructive",
      });
    }
  };
  
  const handleFavoriteToggle = () => {
    if (!currentStream) return;
    
    const streamId = 'stream_id' in currentStream ? currentStream.stream_id : 
                    'series_id' in currentStream ? currentStream.series_id : '';
    
    if (isFavorite(streamId)) {
      removeFromFavorites(streamId);
      toast({
        title: "Favorilerden Kaldırıldı",
        description: `${currentStream.name} favorilerden kaldırıldı.`,
      });
    } else {
      addToFavorites(currentStream);
      toast({
        title: "Favorilere Eklendi",
        description: `${currentStream.name} favorilere eklendi.`,
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share && currentStream) {
      try {
        await navigator.share({
          title: currentStream.name,
          text: `${currentStream.name} izle`,
          url: window.location.href,
        });
      } catch (err) {
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Kopyalandı",
          description: "İçerik linki panoya kopyalandı.",
        });
      }
    } else if (currentStream) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Kopyalandı",
        description: "İçerik linki panoya kopyalandı.",
      });
    }
  };

  // Episode seçimi handler
  const handleEpisodeSelect = (episode: any, seasonNumber: number) => {
    console.log('🎬 Episode selected in PlayerModal:', { episode, seasonNumber });
    
    if (!currentStream) {
      console.error('❌ No currentStream for episode selection');
      return;
    }
    
    // Episode bilgilerini currentStream'e ekle
    const updatedStream = {
      ...currentStream,
      episode_num: episode.episode_num,
      season_num: seasonNumber,
      episode_title: episode.title,
      episode_info: episode.info,
      id: episode.id, // Episode'un kendi ID'si
      episode_id: episode.id, // Backup field
      // Orijinal series bilgilerini koru
      series_id: currentStream.series_id || currentStream.id,
      name: currentStream.name // Series adını koru
    };
    
    console.log('🔄 Updated stream with episode info:', updatedStream);
    
    // Player'ı episode ile yeniden aç
    openPlayer(updatedStream);
    setShowEpisodeSelector(false);
  };
  
  const favorite = currentStream ? isFavorite(
    'stream_id' in currentStream ? currentStream.stream_id : 
    'series_id' in currentStream ? currentStream.series_id : ''
  ) : false;
  
  if (!isPlayerOpen || !currentStream) {
    return null;
  }

  // Episode selector göster
  if (showEpisodeSelector) {
    return (
      <SeriesEpisodeSelector
        series={currentStream}
        onEpisodeSelect={handleEpisodeSelect}
        onClose={() => {
          setShowEpisodeSelector(false);
          closePlayer();
        }}
      />
    );
  }
  
  // Stream type belirleme
  const getStreamType = () => {
    if ('stream_type' in currentStream) {
      return currentStream.stream_type === 'live' ? 'Canlı TV' : 
             currentStream.stream_type === 'movie' ? 'Film' : 'Dizi';
    }
    return 'series_id' in currentStream ? 'Dizi' : 'İçerik';
  };
  
  // Stream tags oluşturma
  const getTags = () => {
    const tags = [];
    
    // Stream type tag
    const streamType = getStreamType();
    tags.push(streamType);
    
    // Episode bilgisi (eğer series ise)
    if ('episode_num' in currentStream && 'season_num' in currentStream) {
      tags.push(`S${currentStream.season_num}E${currentStream.episode_num}`);
    }
    
    // Quality tag (URL'den tahmin et)
    if (streamUrl && typeof streamUrl === 'string') {
      if (streamUrl.includes('1080')) tags.push('Full HD');
      else if (streamUrl.includes('720')) tags.push('HD');
      else tags.push('SD');
      
      // Format tag
      if (streamUrl.includes('.m3u8')) tags.push('HLS');
      else if (streamUrl.includes('.mp4')) tags.push('MP4');
      else if (streamUrl.includes('.ts')) tags.push('TS');
      else tags.push('Canlı Yayın');
    }
    
    return tags;
  };

  // Determine content type
  const getContentType = (): "vod" | "live" | "series" => {
    if ('stream_type' in currentStream) {
      switch (currentStream.stream_type) {
        case 'live':
          return 'live';
        case 'movie':
          return 'vod';
        default:
          return 'series';
      }
    }
    return 'series_id' in currentStream ? 'series' : 'live';
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-black"
    : "fixed inset-0 z-50 overflow-auto bg-black bg-opacity-95 flex items-center justify-center";

  const modalClasses = isFullscreen
    ? "w-full h-full"
    : "bg-gray-900 rounded-lg w-full max-w-7xl mx-4 overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col";
  
  if (showEpisodeSelector) {
    return (
      <SeriesEpisodeSelector
        series={currentStream}
        onEpisodeSelect={handleEpisodeSelect}
        onClose={() => setShowEpisodeSelector(false)}
      />
    );
  }

  return (
    <div className={containerClasses}>
      <div className={modalClasses}>
        {/* Header - Sadece fullscreen değilse göster */}
        {!isFullscreen && (
          <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0 bg-gray-800">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-white truncate">
                  {currentStream.name}
                </h2>
                
                {/* Episode title */}
                {'episode_title' in currentStream && currentStream.episode_title && (
                  <p className="text-sm text-gray-300 truncate">
                    {currentStream.episode_title}
                  </p>
                )}
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-1">
                  {getTags().map((tag, index) => (
                    <span 
                      key={index}
                      className="inline-block bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Status indicators */}
              <div className="flex items-center space-x-2">
                {'stream_type' in currentStream && currentStream.stream_type === 'live' && (
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md animate-pulse">
                    CANLI
                  </div>
                )}
                
                {connectionIssues && (
                  <div className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-md flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Bağlantı Sorunu
                  </div>
                )}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-2 ml-4">
              {/* Episode selector button for series */}
              {'series_id' in currentStream && (
                <button 
                  className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded hover:bg-gray-700"
                  onClick={() => setShowEpisodeSelector(true)}
                  title="Bölümler"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
              )}
              
              <button 
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded hover:bg-gray-700"
                onClick={() => setShowInfo(!showInfo)}
                title="İçerik Bilgisi"
              >
                <Info className="h-5 w-5" />
              </button>
              
              <button 
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded hover:bg-gray-700"
                onClick={handleShare}
                title="Paylaş"
              >
                <Share2 className="h-5 w-5" />
              </button>
              
              <button 
                className={`transition-colors duration-200 p-2 rounded hover:bg-gray-700 ${
                  favorite ? 'text-red-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                }`}
                onClick={handleFavoriteToggle}
                title={favorite ? 'Favorilerden Kaldır' : 'Favorilere Ekle'}
              >
                <Heart className="h-5 w-5" fill={favorite ? 'currentColor' : 'none'} />
              </button>
              
              <button 
                className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded hover:bg-gray-700"
                onClick={toggleFullscreen}
                title="Tam Ekran"
              >
                <Settings className="h-5 w-5" />
              </button>
              
              <button 
                className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-2 rounded hover:bg-gray-700"
                onClick={closePlayer}
                title="Kapat"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}
        
        {/* Info Panel - Toggle ile göster/gizle */}
        {showInfo && !isFullscreen && (
          <div className="bg-gray-800 border-b border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-white font-semibold mb-2">İçerik Bilgileri</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tür:</span>
                    <span className="text-white">{getStreamType()}</span>
                  </div>
                  {('episode_num' in currentStream && 'season_num' in currentStream) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Sezon:</span>
                        <span className="text-white">{currentStream.season_num}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Bölüm:</span>
                        <span className="text-white">{currentStream.episode_num}</span>
                      </div>
                    </>
                  )}
                  {'stream_id' in currentStream && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stream ID:</span>
                      <span className="text-white font-mono text-xs">{currentStream.stream_id}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-2">Teknik Bilgiler</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Durum:</span>
                    <span className={`${loading ? 'text-yellow-400' : error ? 'text-red-400' : 'text-green-400'}`}>
                      {loading ? 'Yükleniyor' : error ? 'Hata' : 'Oynatılıyor'}
                    </span>
                  </div>
                  {streamUrl && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Format:</span>
                      <span className="text-white">
                        {typeof streamUrl === 'string' && streamUrl.includes('.m3u8') ? 'HLS' : 
                         typeof streamUrl === 'string' && streamUrl.includes('.mp4') ? 'MP4' : 
                         typeof streamUrl === 'string' && streamUrl.includes('.ts') ? 'TS' : 'Bilinmeyen'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Oynatıcı:</span>
                    <span className="text-white">Enhanced Player</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Player Container */}
        <div 
          ref={playerContainerRef} 
          className={`relative bg-black ${isFullscreen ? 'w-full h-full' : 'aspect-video flex-1'}`}
        >
          <EnhancedPlayer 
            mediaItem={currentStream}
            userId={1}
            contentType={getContentType()}
            onError={handleError}
          />
        </div>
        
        {/* Footer - Sadece fullscreen değilse göster */}
        {!isFullscreen && (
          <div className="p-3 bg-gray-800 border-t border-gray-700 flex justify-between items-center text-sm text-gray-400">
            <div className="flex items-center space-x-4">
              <span>Enhanced IPTV Player</span>
              {error && !loading && (
                <span className="text-red-400">⚠ {error}</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleFullscreen}
                className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
              >
                Tam Ekran
              </button>
              <span>|</span>
              <button 
                onClick={closePlayer}
                className="hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
              >
                Kapat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}