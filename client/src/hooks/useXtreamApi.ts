import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthCredentials, XtreamUserInfo } from '@shared/schema';
import {
  authenticateXtream,
  getLiveCategories,
  getLiveStreams,
  getVodCategories,
  getVodStreams,
  getSeriesCategories,
  getSeriesData,
  getSeriesInfo
} from '@/lib/api';

// Session'dan oturumu oku
export function getSavedConnection() {
  const saved = sessionStorage.getItem('xtreamConnection');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (err) {
      console.error('Session verisi bozuk:', err);
    }
  }
  return null;
}

// Giriş (Login)
export function useXtreamAuthMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authenticateXtream,
    onSuccess: (data: XtreamUserInfo, credentials: AuthCredentials) => {
      const connectionInfo = {
        credentials,
        userInfo: data,
        baseUrl: `${data.server_info.server_protocol}://${credentials.host}:${data.server_info.port}`
      };

      sessionStorage.setItem('xtreamConnection', JSON.stringify(connectionInfo));

      // 🎯 Sayfayı yenileyerek yeni veriye göre render alın
      queryClient.invalidateQueries({ queryKey: ['/api/xtream'] });
      window.location.reload(); // 🔄 sayfa reload
    },
  });
}

// Canlı TV kategorileri
export function useLiveCategories() {
  const saved = getSavedConnection();
  const creds = saved?.credentials;

  return useQuery({
    queryKey: ['/api/xtream/live/categories', creds?.host, creds?.username],
    queryFn: async () => {
      if (!creds) return [];
      try {
        return await getLiveCategories(creds);
      } catch (err) {
        console.error('Live kategori hatası:', err);
        return [];
      }
    },
    enabled: !!creds,
  });
}

// Canlı TV yayınları
export function useLiveStreams(categoryId?: string) {
  const saved = getSavedConnection();
  const creds = saved?.credentials;

  return useQuery({
    queryKey: ['/api/xtream/live/streams', creds?.host, creds?.username, categoryId],
    queryFn: async () => {
      if (!creds) return [];
      try {
        return await getLiveStreams(creds, categoryId);
      } catch (err) {
        console.error('Live stream hatası:', err);
        return [];
      }
    },
    enabled: !!creds,
  });
}

// VOD kategorileri
export function useVodCategories() {
  const saved = getSavedConnection();
  const creds = saved?.credentials;

  return useQuery({
    queryKey: ['/api/xtream/vod/categories', creds?.host, creds?.username],
    queryFn: async () => {
      if (!creds) return [];
      try {
        return await getVodCategories(creds);
      } catch (err) {
        console.error('VOD kategori hatası:', err);
        return [];
      }
    },
    enabled: !!creds,
  });
}

// VOD içerikleri
export function useVodStreams(categoryId?: string) {
  const saved = getSavedConnection();
  const creds = saved?.credentials;

  return useQuery({
    queryKey: ['/api/xtream/vod/streams', creds?.host, creds?.username, categoryId],
    queryFn: async () => {
      if (!creds) return [];
      try {
        return await getVodStreams(creds, categoryId);
      } catch (err) {
        console.error('VOD stream hatası:', err);
        return [];
      }
    },
    enabled: !!creds,
  });
}

// Dizi kategorileri
export function useSeriesCategories() {
  const saved = getSavedConnection();
  const creds = saved?.credentials;

  return useQuery({
    queryKey: ['/api/xtream/series/categories', creds?.host, creds?.username],
    queryFn: async () => {
      if (!creds) return [];
      try {
        return await getSeriesCategories(creds);
      } catch (err) {
        console.error('Dizi kategorisi hatası:', err);
        return [];
      }
    },
    enabled: !!creds,
  });
}

// Dizi içerikleri
export function useSeriesData(categoryId?: string) {
  const saved = getSavedConnection();
  const creds = saved?.credentials;

  return useQuery({
    queryKey: ['/api/xtream/series/data', creds?.host, creds?.username, categoryId],
    queryFn: async () => {
      if (!creds) return [];
      try {
        return await getSeriesData(creds, categoryId);
      } catch (err) {
        console.error('Dizi verisi hatası:', err);
        return [];
      }
    },
    enabled: !!creds,
  });
}

// Seçilen dizinin detayları (sezon/bölüm)
export function useSeriesInfo(seriesId: number) {
  const saved = getSavedConnection();
  const creds = saved?.credentials;

  return useQuery({
    queryKey: ['/api/xtream/series/info', creds?.host, creds?.username, seriesId],
    queryFn: async () => {
      if (!creds || !seriesId) return null;
      try {
        return await getSeriesInfo(creds, seriesId);
      } catch (err) {
        console.error('Dizi info hatası:', err);
        return null;
      }
    },
    enabled: !!creds && !!seriesId,
  });
}

// Oturum temizleyici
export function logout() {
  const queryClient = useQueryClient();
  sessionStorage.removeItem('xtreamConnection');
  queryClient.invalidateQueries({ queryKey: ['/api/xtream'] });
}
