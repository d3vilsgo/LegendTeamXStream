import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

interface EnhancedPlayerProps {
  mediaItem: any;
  userId: number;
  contentType: "vod" | "live" | "series";
  onError?: (error: Error) => void;
}

interface PlayerControlsProps {
  isPlaying: boolean;
  muted: boolean;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onRestart: () => void;
  isLoading?: boolean;
}

// Basit Player Controls
function SimplePlayerControls({
  isPlaying,
  muted,
  onPlayPause,
  onMuteToggle,
  onRestart,
  isLoading
}: PlayerControlsProps) {
  return (
    <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-4 bg-black bg-opacity-60 rounded-full px-5 py-3 shadow-xl backdrop-blur-md z-10">
      <button 
        onClick={onRestart} 
        title="Başa sar"
        className="text-white hover:text-blue-400 transition-colors p-2"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      
      <button 
        onClick={onPlayPause} 
        title={isPlaying ? "Duraklat" : "Oynat"}
        disabled={isLoading}
        className="text-white hover:text-blue-400 transition-colors p-2 disabled:opacity-50"
      >
        {isLoading ? (
          <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : isPlaying ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
      
      <button 
        onClick={onMuteToggle} 
        title="Ses aç/kapat"
        className="text-white hover:text-blue-400 transition-colors p-2"
      >
        {muted ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export default function EnhancedPlayer({
  mediaItem,
  userId,
  contentType,
  onError,
}: EnhancedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // State variables
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [needsEpisodeSelection, setNeedsEpisodeSelection] = useState(false);
  const maxRetries = 5; // Maximum number of alternative formats to try

  // 🔧 Content type determination
  const determineContentType = (item: any): "vod" | "live" | "series" => {
    console.log('🔍 Determining content type for:', {
      item: item,
      keys: Object.keys(item),
      contentType: contentType
    });

    if (!item) return contentType || 'vod';

    // Method 1: Direct contentType check
    if (contentType) {
      console.log('🎯 Using provided contentType:', contentType);
      return contentType;
    }

    // Method 2: is_series flag
    if (item.is_series || item.type === 'series') {
      console.log('📺 Series detected by is_series flag');
      return 'series';
    }

    // Method 3: Category name check
    if (item.category_name) {
      const categoryLower = item.category_name.toLowerCase();
      if (categoryLower.includes('dizi') || categoryLower.includes('series')) {
        console.log('📺 Series detected by category name:', item.category_name);
        return 'series';
      }
      if (categoryLower.includes('film') || categoryLower.includes('movie')) {
        console.log('🎬 Movie detected by category name:', item.category_name);
        return 'vod';
      }
      if (categoryLower.includes('canlı') || categoryLower.includes('live') || categoryLower.includes('tv')) {
        console.log('📡 Live detected by category name:', item.category_name);
        return 'live';
      }
    }

    // Method 4: Name pattern check
    if (item.name) {
      const nameLower = item.name.toLowerCase();
      if (nameLower.includes('sezon') || nameLower.includes('season') || nameLower.includes('bölüm')) {
        console.log('📺 Series detected by name pattern:', item.name);
        return 'series';
      }
    }

    // Fallback: Use contentType prop
    const fallbackType = contentType || 'vod';
    console.log('⚠️ Using fallback content type:', fallbackType);
    return fallbackType;
  };

  // Get actual content type
  const actualContentType = determineContentType(mediaItem);

  // 🔧 Stream URL generation
  const getStreamUrl = (): string => {
    if (!mediaItem) {
      console.error('❌ No media item provided');
      return '';
    }

    // If mediaItem has direct URL, use it
    if (mediaItem.stream_url && !mediaItem.stream_url.includes('localhost')) {
      console.log('✅ Using existing stream_url from mediaItem');
      return mediaItem.stream_url;
    }

    // Server credentials from console
    const host = 'http://nuhgo1d76dre.xyz:8080';
    const username = 'kyaric1';
    const password = 'qpvyaqGTG2';
    const streamId = mediaItem.stream_id || mediaItem.id || '';
    
    if (!streamId) {
      console.error('❌ No stream ID found');
      return '';
    }

    let streamUrl = '';

    switch (actualContentType) {
      case 'live':
        streamUrl = `${host}/live/${username}/${password}/${streamId}.m3u8`;
        console.log('📡 Live TV URL:', streamUrl);
        break;
        
      case 'vod':
        streamUrl = `${host}/movie/${username}/${password}/${streamId}.mp4`;
        console.log('🎬 VOD URL:', streamUrl);
        break;
        
      case 'series':
        console.log('📺 Processing series content:', {
          hasEpisodeNum: !!mediaItem.episode_num,
          hasSeasonNum: !!mediaItem.season_num,
          episodeId: mediaItem.id,
          episodeIdField: mediaItem.episode_id,
          seriesId: mediaItem.series_id
        });
        
        if (!mediaItem.episode_num || !mediaItem.season_num) {
          console.warn('⚠️ Series missing episode/season info - need selection');
          setNeedsEpisodeSelection(true);
          return 'EPISODE_SELECTION_REQUIRED';
        }
        
        // Get episode stream ID - first try episode-specific ID, then series pattern
        let episodeStreamId = mediaItem.episode_id || mediaItem.id;
        
        // If no episode_id or it matches series ID, create series pattern
        if (!episodeStreamId || episodeStreamId === (mediaItem.series_id || streamId)) {
          episodeStreamId = `${mediaItem.series_id || streamId}_s${mediaItem.season_num}_e${mediaItem.episode_num}`;
        }
        
        streamUrl = `${host}/series/${username}/${password}/${episodeStreamId}.mp4`;
        console.log('📺 Series URL:', streamUrl);
        break;
      default:
        streamUrl = `${host}/live/${username}/${password}/${streamId}.m3u8`;
        break;
    }

    return streamUrl;
  };

  // Get stream URL
  const streamUrl = getStreamUrl();

  // 🔄 ALTERNATİF URL'LER - CORS SORUNU OLMAYAN FORMATLAR
  const getAlternativeUrls = (originalUrl: string): string[] => {
    const host = 'http://nuhgo1d76dre.xyz:8080';
    const username = 'kyaric1';
    const password = 'qpvyaqGTG2';
    const streamId = mediaItem.stream_id || mediaItem.id || '';
    
    if (!streamId) return [originalUrl];
    
    const alternatives: string[] = [];
    
    switch (actualContentType) {
      case 'live':
        alternatives.push(
          `${host}/live/${username}/${password}/${streamId}.m3u8`,
          `${host}/live/${username}/${password}/${streamId}.ts`,
          `${host}/live/${username}/${password}/${streamId}`
        );
        break;
        
      case 'vod':
        alternatives.push(
          // MP4 formatını önce dene (en uyumlu)
          `${host}/movie/${username}/${password}/${streamId}.mp4`,
          // TS formatını dene
          `${host}/movie/${username}/${password}/${streamId}.ts`,
          // HLS formatını dene
          `${host}/movie/${username}/${password}/${streamId}.m3u8`,
          // Format belirtmeden dene
          `${host}/movie/${username}/${password}/${streamId}`,
          // Eski format (fallback)
          `${host}/movie/${username}/${password}/${streamId}.mkv`,
          `${host}/movie/${username}/${password}/${streamId}.avi`
        );
        break;
        
      case 'series':
        const baseSeriesId = mediaItem.series_id || mediaItem.stream_id || mediaItem.id || '';
        const episodeNum = mediaItem.episode_num || 1;
        const seasonNum = mediaItem.season_num || 1;
        
        // Episode ID formatları
        const episodeFormats = [
          mediaItem.episode_id, // Önce episode-specific ID
          mediaItem.id, // Episode'un kendi ID'si
          `${baseSeriesId}_s${seasonNum}_e${episodeNum}`, // Pattern 1
          `${baseSeriesId}s${seasonNum}e${episodeNum}`, // Pattern 2
          `${baseSeriesId}-${seasonNum}-${episodeNum}`, // Pattern 3
          baseSeriesId // Fallback: series ID
        ].filter(Boolean); // Null/undefined'ları filtrele
        
        episodeFormats.forEach(episodeId => {
          alternatives.push(
            `${host}/series/${username}/${password}/${episodeId}.mp4`,
            `${host}/series/${username}/${password}/${episodeId}.ts`,
            `${host}/series/${username}/${password}/${episodeId}.m3u8`,
            `${host}/series/${username}/${password}/${episodeId}`
          );
        });
        break;
    }
    
    // Duplicates'i kaldır ve orijinal URL'i başa ekle
    return [originalUrl, ...new Set(alternatives)].filter(url => url && url !== originalUrl);
  };

  // 🚀 VİDEO YÜKLEME FONKSİYONU - CORS ÇÖZÜMLERİ
  const loadVideo = async (url: string) => {
    const video = videoRef.current;
    if (!video || !url || url === 'EPISODE_SELECTION_REQUIRED') {
      console.error('❌ Cannot load video - missing video element or URL');
      return;
    }

    console.log('🚀 Starting video load with URL:', url);
    setLoading(true);
    setError(null);

    // Önceki HLS instance'ını temizle
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    try {
      // Video element'i sıfırla
      video.removeAttribute('src');
      video.load();
      
      // 🔑 CORS SORUNU İÇİN ÖZEL AYARLAR
      // crossOrigin'i kaldır - CORS sorunlarına neden oluyor
      video.removeAttribute('crossOrigin');
      video.preload = "metadata";

      if (url.includes('.m3u8')) {
        // HLS stream
        if (Hls.isSupported()) {
          console.log('📡 Loading HLS stream');
          
          const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: false,
            autoStartLoad: true,
            startLevel: -1,
            capLevelToPlayerSize: true,
            
            // 🔑 CORS SORUNU İÇİN XHR AYARLARI
            xhrSetup: (xhr, requestUrl) => {
              console.log('📡 XHR Setup for URL:', requestUrl);
              
              // CORS için credentials kaldır
              xhr.withCredentials = false;
              xhr.timeout = 20000;
              
              // CORS headers ekle
              xhr.setRequestHeader('Accept', '*/*');
              
              // CORS error handler
              xhr.addEventListener('error', (e) => {
                console.error('🚨 XHR Error:', e);
              });
              
              xhr.addEventListener('timeout', (e) => {
                console.error('⏰ XHR Timeout:', e);
              });
            },
            
            // Fragment loading ayarları - CORS için optimize
            fragLoadingTimeOut: 25000,
            fragLoadingMaxRetry: 2,
            fragLoadingRetryDelay: 2000,
            
            // Manifest loading ayarları
            manifestLoadingTimeOut: 15000,
            manifestLoadingMaxRetry: 2,
            manifestLoadingRetryDelay: 2000
          });

          hlsRef.current = hls;
          hls.loadSource(url);
          hls.attachMedia(video);

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            console.log('✅ HLS manifest loaded successfully');
            setLoading(false);
            setError(null);
            setRetryCount(0);
            
            // Auto-play dene
            video.play()
              .then(() => {
                console.log('▶️ Auto-play successful');
                setIsPlaying(true);
              })
              .catch((err) => {
                console.log('⚠️ Auto-play blocked (normal):', err.message);
                setIsPlaying(false);
              });
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            console.error('🚨 HLS Error:', data);
            
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('🔄 Network/CORS error, trying alternatives...');
                  setTimeout(() => tryAlternatives(), 2000);
                  break;
                  
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('🔄 Media error, trying recovery...');
                  setTimeout(() => {
                    if (hlsRef.current) {
                      hlsRef.current.recoverMediaError();
                    } else {
                      tryAlternatives();
                    }
                  }, 1000);
                  break;
                  
                default:
                  console.log('💀 Fatal HLS error, trying alternatives...');
                  setTimeout(() => tryAlternatives(), 2000);
                  break;
              }
            }
          });

        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari)
          console.log('🍎 Using native HLS support');
          loadDirectVideo(url);
        } else {
          console.log('❌ HLS not supported, trying alternatives...');
          tryAlternatives();
        }
      } else {
        // Direct video file (MP4, TS, etc.)
        console.log('🎥 Loading direct video file');
        loadDirectVideo(url);
      }
    } catch (error) {
      console.error('💥 Video loading failed:', error);
      tryAlternatives();
    }
  };

  // 🎬 DIRECT VIDEO YÜKLEME - CORS ÇÖZÜMÜ
  const loadDirectVideo = (url: string) => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎬 Loading direct video:', url);

    const handleLoadSuccess = () => {
      console.log('✅ Direct video loaded successfully');
      setLoading(false);
      setError(null);
      setRetryCount(0);
      
      video.play()
        .then(() => {
          console.log('▶️ Video playing');
          setIsPlaying(true);
        })
        .catch((err) => {
          console.log('⚠️ Auto-play prevented:', err.message);
          setIsPlaying(false);
        });
    };

    const handleLoadError = (e: any) => {
      console.error('❌ Direct video failed:', e);
      const errorCode = video.error?.code;
      const errorMessage = video.error?.message || 'Unknown error';
      
      console.log('📊 Video error details:', {
        code: errorCode,
        message: errorMessage,
        networkState: video.networkState,
        readyState: video.readyState,
        currentSrc: video.currentSrc
      });
      
      // CORS error detection
      if (errorMessage.includes('CORS') || errorCode === 4) {
        console.log('🚨 CORS error detected, trying alternatives...');
      }
      
      setTimeout(() => tryAlternatives(), 1500);
    };

    const handleCanPlay = () => {
      console.log('✅ Video can play');
      setLoading(false);
      setError(null);
    };

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          const percent = (bufferedEnd / duration) * 100;
          console.log(`📊 Video buffered: ${percent.toFixed(1)}%`);
        }
      }
    };

    // Event listeners
    video.addEventListener('loadeddata', handleLoadSuccess, { once: true });
    video.addEventListener('canplay', handleCanPlay, { once: true });
    video.addEventListener('error', handleLoadError, { once: true });
    video.addEventListener('progress', handleProgress);
    
    // Cleanup function
    const cleanup = () => {
      video.removeEventListener('loadeddata', handleLoadSuccess);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleLoadError);
      video.removeEventListener('progress', handleProgress);
    };

    // CORS sorunu için crossOrigin kaldır
    video.removeAttribute('crossOrigin');
    
    // URL'yi ayarla ve yükle
    video.src = url;
    video.load();
    
    // Cleanup timeout
    setTimeout(cleanup, 15000);
  };

  // 🔄 ALTERNATİF URL'LERİ DENE
  const tryAlternatives = () => {
    const alternatives = getAlternativeUrls(streamUrl);
    
    console.log('🔄 Available alternatives:', alternatives);
    console.log('🔄 Current retry count:', retryCount);
    
    if (retryCount < alternatives.length) {
      const nextUrl = alternatives[retryCount];
      console.log(`🔄 Trying alternative ${retryCount + 1}/${alternatives.length}:`, nextUrl);
      setRetryCount(prev => prev + 1);
      
      // Retry delay'i artır
      const delay = Math.min(3000 + (retryCount * 1000), 8000);
      setTimeout(() => {
        loadVideo(nextUrl);
      }, delay);
    } else {
      console.error('💀 All alternatives exhausted');
      setError('Video yüklenemedi. CORS politikası veya server erişim sorunu.');
      setLoading(false);
      
      // Browser'da açma seçeneği sun
      console.log('🌐 Suggesting browser open option');
    }
  };

  // Component mount/unmount
  useEffect(() => {
    if (needsEpisodeSelection) {
      setError('Lütfen sezon ve bölüm seçin');
      setLoading(false);
      return;
    }

    if (streamUrl && streamUrl !== 'EPISODE_SELECTION_REQUIRED') {
      console.log('🚀 Starting video load with URL:', streamUrl);
      setRetryCount(0); // Reset retry count
      loadVideo(streamUrl);
    }

    return () => {
      // Cleanup
      if (hlsRef.current) {
        console.log('🧹 Cleaning up HLS instance');
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Player kontrolleri
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Play failed:', err);
          // Browser'da aç
          if (streamUrl && streamUrl !== 'EPISODE_SELECTION_REQUIRED') {
            console.log('🌐 Opening in browser due to play failure');
            window.open(streamUrl, '_blank');
          }
        });
    }
  };

  const handleMuteToggle = () => {
    setMuted(prev => !prev);
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play()
        .then(() => setIsPlaying(true))
        .catch(console.error);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Manual retry requested');
    setError(null);
    setRetryCount(0);
    setLoading(true);
    
    // Fresh load
    if (streamUrl && streamUrl !== 'EPISODE_SELECTION_REQUIRED') {
      loadVideo(streamUrl);
    }
  };

  // Episode seçimi gerekiyorsa
  if (needsEpisodeSelection || streamUrl === 'EPISODE_SELECTION_REQUIRED') {
    return (
      <div className="relative aspect-video w-full bg-black flex items-center justify-center">
        <div className="text-center text-white p-6">
          <div className="text-blue-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 011 1v2a1 1 0 01-1 1h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8H3a1 1 0 01-1-1V5a1 1 0 011-1h4zM9 6h6V4H9v2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Dizi İçeriği</h3>
          <p className="text-gray-300 mb-4">Bu dizi için lütfen sezon ve bölüm seçin</p>
          <button 
            onClick={() => {
              console.log('Episode selector açılacak');
            }}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded text-white font-medium transition-colors"
          >
            Bölüm Seç
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        muted={muted}
        controls={false}
        playsInline
        preload="metadata"
        // crossOrigin kaldırıldı - CORS sorunu nedeniyle
      />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg mb-2">Yükleniyor...</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-400">
                Alternatif format: {retryCount}/{maxRetries} ({Math.round((retryCount / maxRetries) * 100)}%)
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {contentType === 'live' ? 'Canlı yayın' : contentType === 'vod' ? 'Film' : 'Dizi'} • CORS korumalı
            </p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !loading && error !== 'Lütfen sezon ve bölüm seçin' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white p-6 max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Oynatma Hatası</h3>
            <p className="text-sm text-gray-300 mb-1">{error}</p>
            <p className="text-xs text-gray-400 mb-4">
              CORS politikası nedeniyle video player'da oynatılamıyor
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
              >
                Yeniden Dene
              </button>
              {streamUrl && streamUrl !== 'EPISODE_SELECTION_REQUIRED' && (
                <button 
                  onClick={() => {
                    console.log('🌐 Opening video in browser');
                    window.open(streamUrl, '_blank');
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white text-sm font-medium transition-colors"
                >
                  Browser'da Aç
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Player Controls */}
      <SimplePlayerControls
        isPlaying={isPlaying}
        muted={muted}
        onPlayPause={handlePlayPause}
        onMuteToggle={handleMuteToggle}
        onRestart={handleRestart}
        isLoading={loading}
      />
    </div>
  );
}