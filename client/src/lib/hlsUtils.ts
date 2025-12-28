import Hls from 'hls.js';

// HLS URL kontrolü
export const isHlsUrl = (url: string): boolean => {
  return url.includes('.m3u8') || 
         url.includes('application/vnd.apple.mpegurl') ||
         url.toLowerCase().includes('m3u8');
};

// Direct video URL kontrolü
export const isDirectUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.ts'];
  return videoExtensions.some(ext => url.toLowerCase().includes(ext));
};

// HLS instance oluşturma
export const initializeHls = (
  videoElement: HTMLVideoElement,
  streamUrl: string,
  updatePlaybackState: (state: any) => void,
  autoPlay: boolean = true
): Hls => {
  const hls = new Hls({
    debug: false,
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90,
    maxBufferLength: 30,
    maxMaxBufferLength: 600,
    maxBufferSize: 60 * 1000 * 1000,
    maxBufferHole: 0.5,
    highBufferWatchdogPeriod: 2,
    nudgeOffset: 0.1,
    nudgeMaxRetry: 3,
    maxFragLookUpTolerance: 0.25,
    liveSyncDurationCount: 3,
    liveMaxLatencyDurationCount: Infinity,
    liveDurationInfinity: false,
    liveBackBufferLength: Infinity,
    maxLiveSyncPlaybackRate: 1,
    liveSyncDuration: undefined,
    liveMaxLatencyDuration: undefined,
    maxStarvationDelay: 4,
    maxLoadingDelay: 4,
    minAutoBitrate: 0,
    emeEnabled: true,
  });

  hls.loadSource(streamUrl);
  hls.attachMedia(videoElement);

  // Event listeners
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    console.log('HLS manifest parsed successfully');
    updatePlaybackState({ loading: false, error: null });
    
    if (autoPlay) {
      videoElement.play()
        .then(() => {
          updatePlaybackState({ isPlaying: true });
        })
        .catch((err) => {
          console.error('Auto-play failed:', err);
          updatePlaybackState({ 
            isPlaying: false,
            error: `Auto-play failed: ${err.message}`
          });
        });
    }
  });

  hls.on(Hls.Events.ERROR, (event, data) => {
    console.error('HLS Error:', data);
    
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          console.error('Fatal network error, trying to recover...');
          updatePlaybackState({ 
            error: 'Network connection problem. Retrying...',
            loading: true 
          });
          hls.startLoad();
          break;
        
        case Hls.ErrorTypes.MEDIA_ERROR:
          console.error('Fatal media error, trying to recover...');
          updatePlaybackState({ 
            error: 'Media decoding error. Retrying...',
            loading: true 
          });
          hls.recoverMediaError();
          break;
        
        default:
          console.error('Fatal error, cannot recover');
          updatePlaybackState({ 
            error: `Fatal playback error: ${data.details}`,
            loading: false 
          });
          break;
      }
    } else {
      console.warn('Non-fatal HLS error:', data);
      updatePlaybackState({ 
        error: `Playback warning: ${data.details}`,
        loading: false 
      });
    }
  });

  // Loading events
  hls.on(Hls.Events.FRAG_LOADING, () => {
    updatePlaybackState({ loading: true });
  });

  hls.on(Hls.Events.FRAG_LOADED, () => {
    updatePlaybackState({ loading: false, error: null });
  });

  hls.on(Hls.Events.BUFFER_APPENDED, () => {
    updatePlaybackState({ loading: false });
  });

  // Level events for quality switching
  hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
    console.log('Quality switched to level:', data.level);
  });

  return hls;
};

// HLS instance yok etme
export const destroyHls = (hls: Hls | null): void => {
  if (hls) {
    try {
      hls.destroy();
    } catch (error) {
      console.error('HLS destroy error:', error);
    }
  }
};

// Stream quality levels alma
export const getQualityLevels = (hls: Hls): Array<{ level: number; height: number; bitrate: number; label: string }> => {
  if (!hls || !hls.levels) return [];
  
  return hls.levels.map((level, index) => ({
    level: index,
    height: level.height || 0,
    bitrate: level.bitrate || 0,
    label: level.height ? `${level.height}p` : `${Math.round((level.bitrate || 0) / 1000)}k`
  }));
};

// Quality level değiştirme
export const setQualityLevel = (hls: Hls, level: number): void => {
  if (hls && hls.levels && level >= -1 && level < hls.levels.length) {
    hls.currentLevel = level; // -1 for auto
  }
};

// Stream bilgilerini alma
export const getStreamInfo = (hls: Hls) => {
  if (!hls || !hls.levels) return null;
  
  const currentLevel = hls.currentLevel;
  const level = hls.levels[currentLevel];
  
  return {
    currentLevel,
    totalLevels: hls.levels.length,
    resolution: level ? `${level.width}x${level.height}` : 'Unknown',
    bitrate: level ? Math.round(level.bitrate / 1000) : 0,
    codec: level ? level.videoCodec : 'Unknown',
    fps: level ? level.frameRate : 0
  };
};

// Error handling helper
export const getErrorMessage = (data: any): string => {
  const errorMessages: { [key: string]: string } = {
    [Hls.ErrorDetails.MANIFEST_LOAD_ERROR]: 'Failed to load stream manifest',
    [Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT]: 'Stream manifest load timeout',
    [Hls.ErrorDetails.MANIFEST_PARSING_ERROR]: 'Stream manifest parsing error',
    [Hls.ErrorDetails.LEVEL_LOAD_ERROR]: 'Failed to load stream quality level',
    [Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT]: 'Stream quality level load timeout',
    [Hls.ErrorDetails.FRAG_LOAD_ERROR]: 'Failed to load stream fragment',
    [Hls.ErrorDetails.FRAG_LOAD_TIMEOUT]: 'Stream fragment load timeout',
    [Hls.ErrorDetails.FRAG_DECRYPT_ERROR]: 'Stream fragment decryption error',
    [Hls.ErrorDetails.FRAG_PARSING_ERROR]: 'Stream fragment parsing error',
    [Hls.ErrorDetails.KEY_LOAD_ERROR]: 'Failed to load decryption key',
    [Hls.ErrorDetails.KEY_LOAD_TIMEOUT]: 'Decryption key load timeout',
    [Hls.ErrorDetails.BUFFER_ADD_CODEC_ERROR]: 'Codec not supported',
    [Hls.ErrorDetails.BUFFER_APPEND_ERROR]: 'Buffer append error',
    [Hls.ErrorDetails.BUFFER_APPENDING_ERROR]: 'Buffer appending error',
    [Hls.ErrorDetails.BUFFER_STALLED_ERROR]: 'Buffer stalled',
    [Hls.ErrorDetails.BUFFER_FULL_ERROR]: 'Buffer full',
    [Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE]: 'Seek over buffer hole',
    [Hls.ErrorDetails.BUFFER_NUDGE_ON_STALL]: 'Buffer nudge on stall',
  };

  return errorMessages[data.details] || `Unknown error: ${data.details}`;
};