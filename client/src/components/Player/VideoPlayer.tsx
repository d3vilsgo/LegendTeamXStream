import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import PlayerControls from "./PlayerControls";

interface EnhancedPlayerProps {
  mediaItem: any;
  userId: number;
  contentType: string;
  onError?: (error: Error) => void;
}

export default function EnhancedPlayer({
  mediaItem,
  userId,
  contentType,
  onError,
}: EnhancedPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Direct stream URL (PROXY YOK!)
  const streamUrl = getDirectStreamUrl(mediaItem);

  console.log('🎬 EnhancedPlayer - Direct stream URL:', streamUrl);

  useEffect(() => {
    let hls: Hls;
    const video = videoRef.current;
    
    if (!video || !streamUrl) {
      setError("Stream URL bulunamadı");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // URL format kontrolü
    if (streamUrl.includes('.m3u8')) {
      console.log('🎯 HLS stream detected');
      
      if (Hls.isSupported()) {
        console.log('✅ HLS.js supported, initializing...');
        
        hls = new Hls({
          debug: false,
          enableWorker: true,
          lowLatencyMode: false,
          autoStartLoad: true,
          startLevel: -1, // Auto quality
          capLevelToPlayerSize: true,
          
          // Fragment ayarları
          frag: {
            loadTimeout: 20000,
            retryTimeout: 5000,
            maxRetry: 3
          },
          
          // Manifest ayarları
          manifest: {
            loadTimeout: 10000,
            retryTimeout: 5000,
            maxRetry: 3
          }
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          console.log('✅ HLS manifest parsed successfully');
          setLoading(false);
          setError(null);
          
          video.play()
            .then(() => {
              console.log('▶️ Auto-play started');
              setIsPlaying(true);
            })
            .catch((err) => {
              console.log('⚠️ Auto-play failed (normal):', err);
              setIsPlaying(false);
              // Auto-play hatası normal, error olarak gösterme
            });
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('🚨 HLS Error:', data);
          
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('🔄 Network error, attempting recovery...');
                setError('Ağ bağlantı sorunu, yeniden deneniyor...');
                setTimeout(() => {
                  hls.startLoad();
                }, 1000);
                break;
                
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('🔄 Media error, attempting recovery...');
                setError('Medya hatası, yeniden deneniyor...');
                setTimeout(() => {
                  hls.recoverMediaError();
                }, 1000);
                break;
                
              default:
                const errorMsg = `Stream hatası: ${data.details || 'Bilinmeyen hata'}`;
                console.error('💀 Fatal HLS error:', errorMsg);
                setError(errorMsg);
                setLoading(false);
                if (onError) {
                  onError(new Error(errorMsg));
                }
                break;
            }
          }
        });

        // Loading events
        hls.on(Hls.Events.FRAG_LOADING, () => {
          setLoading(true);
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          setLoading(false);
        });

      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log('🍎 Using native HLS support');
        video.src = streamUrl;
        
        const handleLoad = () => {
          console.log('✅ Native HLS loaded');
          setLoading(false);
          setError(null);
          video.play()
            .then(() => setIsPlaying(true))
            .catch((err) => {
              console.log('⚠️ Native HLS auto-play failed:', err);
              setIsPlaying(false);
            });
        };

        const handleError = () => {
          const errorMsg = 'Native HLS yükleme hatası';
          console.error('❌', errorMsg);
          setError(errorMsg);
          setLoading(false);
          if (onError) {
            onError(new Error(errorMsg));
          }
        };

        video.addEventListener('loadeddata', handleLoad);
        video.addEventListener('error', handleError);
        
        return () => {
          video.removeEventListener('loadeddata', handleLoad);
          video.removeEventListener('error', handleError);
        };
        
      } else {
        const errorMsg = 'HLS bu tarayıcıda desteklenmiyor';
        console.error('❌', errorMsg);
        setError(errorMsg);
        setLoading(false);
        if (onError) {
          onError(new Error(errorMsg));
        }
      }
    } else {
      // Direct video (mp4, ts, etc.)
      console.log('🎥 Direct video stream detected');
      video.src = streamUrl;
      
      const handleLoad = () => {
        console.log('✅ Direct video loaded');
        setLoading(false);
        setError(null);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log('⚠️ Direct video auto-play failed:', err);
            setIsPlaying(false);
          });
      };

      const handleError = () => {
        const errorMsg = 'Video yükleme hatası';
        console.error('❌', errorMsg);
        setError(errorMsg);
        setLoading(false);
        if (onError) {
          onError(new Error(errorMsg));
        }
      };

      video.addEventListener('loadeddata', handleLoad);
      video.addEventListener('error', handleError);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoad);
        video.removeEventListener('error', handleError);
      };
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamUrl, onError]);

  // Direct stream URL oluştur (PROXY YOK!)
  function getDirectStreamUrl(mediaItem: any): string {
    if (!mediaItem) {
      console.error('❌ No media item provided');
      return '';
    }

    // Eğer mediaItem'da direct URL varsa onu kullan
    if (mediaItem.stream_url) {
      console.log('📡 Using direct stream_url from mediaItem');
      return mediaItem.stream_url;
    }

    // Yoksa Xtream API formatında oluştur
    const host = 'http://nuhgo1d76dre.xyz:8080'; // Kendi host'unuzu yazın
    const username = 'kyaric1'; // Kendi username'inizi yazın
    const password = 'qpvyaqGTG2'; // Kendi password'ünüzü yazın
    
    const streamId = mediaItem.stream_id || mediaItem.id || '';
    
    if (!streamId) {
      console.error('❌ No stream ID found in mediaItem');
      return '';
    }

    let directUrl = '';

    // Content type'a göre URL oluştur
    switch (contentType) {
      case 'live':
        directUrl = `${host}/live/${username}/${password}/${streamId}.m3u8`;
        break;
      case 'vod':
        directUrl = `${host}/movie/${username}/${password}/${streamId}.mp4`;
        break;
      case 'series':
        directUrl = `${host}/series/${username}/${password}/${streamId}.mp4`;
        break;
      default:
        directUrl = `${host}/live/${username}/${password}/${streamId}.m3u8`;
        break;
    }

    console.log('🎯 Generated direct URL:', directUrl);
    return directUrl;
  }

  return (
    <div className="relative aspect-video w-full bg-black">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        muted={muted}
        controls={false}
        playsInline
        crossOrigin="anonymous"
      />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Yükleniyor...</p>
          </div>
        </div>
      )}
      
      {/* Error Overlay */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white p-6">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Oynatma Hatası</h3>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
            >
              Yeniden Dene
            </button>
          </div>
        </div>
      )}
      
      <PlayerControls
        isPlaying={isPlaying}
        muted={muted}
        onMuteToggle={() => setMuted((prev) => !prev)}
        onPlayPause={() => {
          const video = videoRef.current;
          if (video) {
            if (isPlaying) {
              video.pause();
              setIsPlaying(false);
            } else {
              video.play()
                .then(() => setIsPlaying(true))
                .catch(console.error);
            }
          }
        }}
        onRestart={() => {
          const video = videoRef.current;
          if (video) {
            video.currentTime = 0;
            video.play()
              .then(() => setIsPlaying(true))
              .catch(console.error);
          }
        }}
      />
    </div>
  );
}