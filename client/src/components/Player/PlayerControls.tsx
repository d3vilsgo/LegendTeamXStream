import { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Maximize,
  Minimize,
  Settings,
  Download,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { usePlayerStore } from '@/store/usePlayerStore';

interface PlayerControlsProps {
  onFullscreen: () => void;
  isFullscreen?: boolean;
}

export default function PlayerControls({ onFullscreen, isFullscreen = false }: PlayerControlsProps) {
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const { 
    playbackState,
    togglePlay,
    toggleMute,
    restart,
    seek,
    setVolume
  } = usePlayerStore();
  
  const { isPlaying, muted, currentTime, duration, loading, error, volume } = playbackState;
  
  // Zaman formatlama (saat:dakika:saniye)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '00:00';
    
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Progress yüzdesi hesaplama
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  
  // Buffer yüzdesi (şimdilik static)
  const bufferPercentage = Math.min(progressPercentage + 10, 100);
  
  // Progress bar'a tıklama
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newTime = position * duration;
    seek(newTime);
  };

  // Progress bar sürükleme
  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressBarRef.current) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = position * duration;
    seek(newTime);
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleProgressMouseMove);
      document.addEventListener('mouseup', handleProgressMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleProgressMouseMove);
        document.removeEventListener('mouseup', handleProgressMouseUp);
      };
    }
  }, [isDragging, duration]);
  
  // Volume değiştirme
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input elementlerinde klavye kısayollarını devre dışı bırak
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          onFullscreen();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 10));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case '0':
        case 'Home':
          e.preventDefault();
          restart();
          break;
        case 'End':
          e.preventDefault();
          seek(duration);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [togglePlay, toggleMute, onFullscreen, seek, restart, currentTime, duration, volume, setVolume]);
  
  // Kontrolleri otomatik gizleme
  useEffect(() => {
    const showControls = () => {
      setIsControlsVisible(true);
      
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (isPlaying && !showVolumeSlider && !isDragging) {
          setIsControlsVisible(false);
        }
      }, 3000);
      
      setHideTimeout(timeout);
    };
    
    showControls();
    
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isPlaying, showVolumeSlider, isDragging, hideTimeout]);
  
  // Skip fonksiyonları
  const skipBackward = () => {
    seek(Math.max(0, currentTime - 10));
  };
  
  const skipForward = () => {
    seek(Math.min(duration, currentTime + 10));
  };

  // Retry fonksiyonu
  const handleRetry = () => {
    restart();
    setTimeout(() => {
      togglePlay();
    }, 500);
  };
  
  return (
    <div 
      className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
        isControlsVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseMove={() => setIsControlsVisible(true)}
      onMouseLeave={() => !isDragging && !showVolumeSlider && setIsControlsVisible(false)}
    >
      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white p-6 max-w-md">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Playback Error</h3>
            <p className="text-sm text-gray-300 mb-4">{error}</p>
            <button 
              onClick={handleRetry}
              className="bg-primary hover:bg-primary-hover px-4 py-2 rounded-md text-white text-sm font-medium transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-sm">Loading...</p>
          </div>
        </div>
      )}

      {/* Gradient Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent h-32 pointer-events-none" />
      
      {/* Controls Container */}
      <div className="relative p-6 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          {/* Time Display */}
          <div className="flex justify-between text-white text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Progress Track */}
          <div 
            ref={progressBarRef}
            className="relative w-full bg-white/20 rounded-full h-1.5 cursor-pointer group"
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
          >
            {/* Buffer Bar */}
            <div 
              className="absolute top-0 left-0 bg-white/40 h-full rounded-full transition-all duration-300"
              style={{ width: `${bufferPercentage}%` }}
            />
            
            {/* Progress Bar */}
            <div 
              className="absolute top-0 left-0 bg-primary h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
            
            {/* Progress Thumb */}
            <div 
              className="absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ left: `${progressPercentage}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
        </div>
        
        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            <button 
              className="text-white hover:text-primary transition-colors duration-200 p-2"
              onClick={restart}
              title="Restart (Home/0)"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            
            <button 
              className="text-white hover:text-primary transition-colors duration-200 p-2"
              onClick={skipBackward}
              title="Skip back 10s (←)"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            
            <button 
              className={`bg-white hover:bg-gray-200 rounded-full p-3 transition-all duration-200 ${
                loading ? 'opacity-50 cursor-wait' : 'hover:scale-105'
              }`}
              onClick={togglePlay}
              disabled={loading}
              title={isPlaying ? "Pause (Space/K)" : "Play (Space/K)"}
            >
              {loading ? (
                <Loader2 className="h-6 w-6 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6 text-black" />
              ) : (
                <Play className="h-6 w-6 text-black ml-0.5" fill="currentColor" />
              )}
            </button>
            
            <button 
              className="text-white hover:text-primary transition-colors duration-200 p-2"
              onClick={skipForward}
              title="Skip forward 10s (→)"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            
            {/* Volume Control */}
            <div 
              className="flex items-center space-x-2"
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              <button 
                className="text-white hover:text-primary transition-colors duration-200 p-2"
                onClick={toggleMute}
                title={muted ? "Unmute (M)" : "Mute (M)"}
              >
                {muted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${
                showVolumeSlider ? 'w-20 opacity-100' : 'w-0 opacity-0'
              }`}>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={muted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  title="Volume (↑/↓)"
                />
              </div>
            </div>
          </div>
          
          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            <button 
              className="text-white hover:text-primary transition-colors duration-200 p-2"
              onClick={onFullscreen}
              title="Fullscreen (F)"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}