import { AuthCredentials, Category, MediaItem, XtreamUserInfo } from '@shared/schema';
import axios from 'axios';

// Helper to handle API errors
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    throw new Error(error.response.data.message || 'Sunucu hatası');
  } else if (error.request) {
    // The request was made but no response was received
    throw new Error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
  } else {
    // Something happened in setting up the request that triggered an Error
    throw new Error('İstek gönderilirken bir hata oluştu: ' + error.message);
  }
};

// Authenticate to Xtream API through our backend proxy
export async function authenticateXtream(credentials: AuthCredentials): Promise<XtreamUserInfo> {
  try {
    const response = await axios.post('/api/xtream/authenticate', credentials);
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error; // This line is never reached but makes TypeScript happy
  }
}

// Get live TV categories
export async function getLiveCategories(credentials: AuthCredentials): Promise<Category[]> {
  try {
    const { username, password, host } = credentials;
    
    const url = `/api/xtream/player_api.php?username=${username}&password=${password}&action=get_live_categories&host=${encodeURIComponent(host)}`;
    
    const response = await axios.get(url);
    return response.data || [];
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get live TV streams, optionally filtered by category
export async function getLiveStreams(credentials: AuthCredentials, categoryId?: string): Promise<MediaItem[]> {
  try {
    const { username, password, host } = credentials;
    
    let url = `/api/xtream/player_api.php?username=${username}&password=${password}&action=get_live_streams&host=${encodeURIComponent(host)}`;
    
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    
    const response = await axios.get(url);
    
    // Transform the response to our MediaItem format
    return (response.data || []).map((stream: any) => ({
      stream_id: stream.stream_id,
      name: stream.name,
      stream_icon: stream.stream_icon,
      stream_url: `${host}/live/${username}/${password}/${stream.stream_id}.m3u8`, // 🔥 Değişiklik burada
      category_id: stream.category_id?.toString() || '',
      category_name: stream.category_name,
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get VOD categories
export async function getVodCategories(credentials: AuthCredentials): Promise<Category[]> {
  try {
    const { username, password, host } = credentials;
    
    const url = `/api/xtream/player_api.php?username=${username}&password=${password}&action=get_vod_categories&host=${encodeURIComponent(host)}`;
    
    const response = await axios.get(url);
    return response.data || [];
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get VOD streams, optionally filtered by category
export async function getVodStreams(credentials: AuthCredentials, categoryId?: string): Promise<MediaItem[]> {
  try {
    const { username, password, host } = credentials;
    
    let url = `/api/xtream/player_api.php?username=${username}&password=${password}&action=get_vod_streams&host=${encodeURIComponent(host)}`;
    
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    
    const response = await axios.get(url);
    
    // Transform the response to our MediaItem format
    return (response.data || []).map((stream: any) => ({
      stream_id: stream.stream_id,
      name: stream.name,
      stream_icon: stream.stream_icon,
      stream_url: `${host}/movie/${username}/${password}/${stream.stream_id}.${stream.container_extension || 'mp4'}`,
      category_id: stream.category_id?.toString() || '',
      category_name: stream.category_name,
      movie_image: stream.stream_icon || stream.cover,
      container_extension: stream.container_extension,
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get Series categories
export async function getSeriesCategories(credentials: AuthCredentials): Promise<Category[]> {
  try {
    const { username, password, host } = credentials;
    
    const url = `/api/xtream/player_api.php?username=${username}&password=${password}&action=get_series_categories&host=${encodeURIComponent(host)}`;
    
    const response = await axios.get(url);
    return response.data || [];
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get Series data, optionally filtered by category
export async function getSeriesData(credentials: AuthCredentials, categoryId?: string): Promise<MediaItem[]> {
  try {
    const { username, password, host } = credentials;
    
    let url = `/api/xtream/player_api.php?username=${username}&password=${password}&action=get_series&host=${encodeURIComponent(host)}`;
    
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    
    const response = await axios.get(url);
    
    // Transform the response to our MediaItem format
    return (response.data || []).map((series: any) => ({
      stream_id: series.series_id,
      name: series.name,
      stream_icon: series.cover,
      cover: series.cover,
      category_id: series.category_id?.toString() || '',
      category_name: series.category_name,
    }));
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

// Get detailed information about a Series
export async function getSeriesInfo(credentials: AuthCredentials, seriesId: number): Promise<any> {
  try {
    const { username, password, host } = credentials;
    
    const url = `/api/xtream/player_api.php?username=${username}&password=${password}&action=get_series_info&series_id=${seriesId}&host=${encodeURIComponent(host)}`;
    
    const response = await axios.get(url);
    
    // Process the episodes to add stream URLs
    if (response.data && response.data.episodes) {
      const { info, episodes } = response.data;
      
      // Organize episodes by season
      const episodesBySeason: Record<string, any[]> = {};
      
      Object.entries(episodes).forEach(([seasonNumber, seasonEpisodes]: [string, any]) => {
        episodesBySeason[seasonNumber] = Object.values(seasonEpisodes).map((episode: any) => ({
          ...episode,
          stream_url: `${host}/series/${username}/${password}/${episode.id}.${episode.container_extension || 'mp4'}`
        }));
      });
      
      return {
        info,
        episodes: episodesBySeason
      };
    }
    
    return response.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}