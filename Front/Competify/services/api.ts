import { Artist, TopArtist, RankingEntry, User, TimePeriod, FriendRequest, Friend, Club, ClubMember, ClubMessage } from '@/types';
import { VinylRank } from '@/components/ui/vinyl-badge';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

/**
 * API Service - Conectado con el backend
 */

// URL del backend - usar la configurada en app.json o localhost en desarrollo
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
  (__DEV__ ? 'http://localhost:4000' : 'https://competify-hacktheshow.onrender.com');

// Storage keys
const TOKEN_KEY = '@auth_token';

/**
 * Obtiene el token JWT almacenado
 */
async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

/**
 * Guarda el token JWT
 */
export async function setAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error saving token:', error);
  }
}

/**
 * Elimina el token JWT
 */
export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing token:', error);
  }
}

/**
 * Realiza una petición autenticada al backend
 */
async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token inválido o expirado
      await clearAuthToken();
      throw new Error('Session expired. Please login again.');
    }
    
    // Intentar obtener el mensaje de error del backend
    let errorMessage = `API Error: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // No se pudo parsear el JSON, usar mensaje genérico
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

export class ApiService {
  /**
   * Inicia el flujo de autenticación con Spotify
   */
  static getLoginUrl(): string {
    return `${API_BASE_URL}/auth/login`;
  }

  /**
   * Obtiene el perfil del usuario actual desde el backend
   */
  static async getCurrentUser(): Promise<User> {
    const data = await fetchWithAuth('/me/current');
    // Mapear respuesta del backend al tipo User
    return {
      id: data.user_id || '1',
      spotifyId: data.spotify_id || '',
      username: data.username || 'Usuario',
      avatarUrl: data.avatar_url || 'https://i.pravatar.cc/300',
      rank: data.rank || 'bronze' as VinylRank,
      totalHours: data.total_hours || 0,
      currentMonthHours: data.current_month_hours || 0,
      currentWeekHours: data.current_week_hours || 0,
      totalArtists: data.total_artists || 0,
    };
  }

  /**
   * Obtiene estadísticas del usuario
   */
  static async getUserStats(): Promise<any> {
    return await fetchWithAuth('/me/stats');
  }

  /**
   * Obtiene los artistas más escuchados del usuario desde Spotify
   */
  static async getTopArtists(limit: number = 20, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<Artist[]> {
    const data = await fetchWithAuth(`/artists/top?limit=${limit}&time_range=${timeRange}`);
    return data;
  }

  /**
   * Obtiene artistas para descubrir (recomendaciones)
   */
  static async getDiscoverArtists(): Promise<Artist[]> {
    const data = await fetchWithAuth('/artists/discover');
    return data;
  }

  /**
   * Obtiene los artistas trackeados por el usuario
   */
  static async getTrackedArtists(): Promise<Artist[]> {
    const data = await fetchWithAuth('/artists/tracked');
    return data.map((item: any) => ({
      id: item.artist_id,
      name: item.artist_name,
      imageUrl: item.artist_image_url,
      genres: item.genres || [],
      followers: 0
    }));
  }

  /**
   * Trackear un artista
   */
  static async trackArtist(artist: Artist): Promise<void> {
    await fetchWithAuth('/artists/track', {
      method: 'POST',
      body: JSON.stringify({
        artistId: artist.id,
        artistName: artist.name,
        artistImageUrl: artist.imageUrl,
        genres: artist.genres
      })
    });
  }

  /**
   * Dejar de trackear un artista
   */
  static async untrackArtist(artistId: string): Promise<void> {
    await fetchWithAuth(`/artists/track/${artistId}`, {
      method: 'DELETE'
    });
  }

  /**
   * Obtiene el ranking global por período
   */
  static async getRanking(period: TimePeriod): Promise<RankingEntry[]> {
    // Mock data - TODO: implementar endpoint real
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const rankings = {
      week: [
        { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 42, rank: 'platinum' as VinylRank },
        { id: '2', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 38, rank: 'gold' as VinylRank },
        { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 35, rank: 'gold' as VinylRank, isCurrentUser: true },
      ],
      month: [
        { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 156, rank: 'diamond' as VinylRank },
        { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 142, rank: 'platinum' as VinylRank, isCurrentUser: true },
      ],
      year: [
        { id: '1', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 1876, rank: 'diamond' as VinylRank },
        { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 1432, rank: 'platinum' as VinylRank, isCurrentUser: true },
      ],
      'all-time': [
        { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 5432, rank: 'diamond' as VinylRank },
        { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 3456, rank: 'platinum' as VinylRank, isCurrentUser: true },
      ],
    };

    return rankings[period] || [];
  }

  /**
   * Busca artistas por nombre en Spotify
   */
  static async searchArtists(query: string = ''): Promise<Artist[]> {
    if (!query || query.trim() === '') {
      return [];
    }

    try {
      const data = await fetchWithAuth(`/search/artists?q=${encodeURIComponent(query.trim())}`);
      return data;
    } catch (error) {
      console.error('Error searching artists:', error);
      return [];
    }
  }

  /**
   * Obtiene artistas recomendados
   */
  static async getRecommendedArtists(limit: number = 12): Promise<Artist[]> {
    // Ya no se usa - los artistas recomendados vienen del endpoint discover
    return this.getDiscoverArtists();
  }

  /**
   * Obtiene artistas similares a tu top artista
   */
  static async getSimilarArtists(): Promise<{ artists: Artist[], basedOn: { id: string, name: string, imageUrl: string | null } | null }> {
    try {
      const data = await fetchWithAuth('/artists/similar');
      return data;
    } catch (error) {
      console.error('Error getting similar artists:', error);
      return { artists: [], basedOn: null };
    }
  }

  /**
   * Calcula el rango basado en las horas totales
   */
  static calculateRank(totalHours: number): VinylRank {
    if (totalHours >= 5000) return 'diamond';
    if (totalHours >= 1000) return 'platinum';
    if (totalHours >= 500) return 'gold';
    if (totalHours >= 100) return 'silver';
    return 'bronze';
  }

  // ========== FRIENDS API ==========

  /**
   * Envía una solicitud de amistad
   */
  static async sendFriendRequest(toUserId: string): Promise<any> {
    return fetchWithAuth('/friends/request', {
      method: 'POST',
      body: JSON.stringify({ to_user: toUserId }),
    });
  }

  /**
   * Acepta una solicitud de amistad
   */
  static async acceptFriendRequest(requestId: string): Promise<any> {
    return fetchWithAuth('/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ request_id: requestId }),
    });
  }

  /**
   * Rechaza una solicitud de amistad
   */
  static async rejectFriendRequest(requestId: string): Promise<any> {
    return fetchWithAuth('/friends/reject', {
      method: 'POST',
      body: JSON.stringify({ request_id: requestId }),
    });
  }

  /**
   * Cancela una solicitud de amistad enviada
   */
  static async cancelFriendRequest(requestId: string): Promise<any> {
    return fetchWithAuth('/friends/cancel', {
      method: 'POST',
      body: JSON.stringify({ request_id: requestId }),
    });
  }

  /**
   * Obtiene la lista de amigos
   */
  static async getFriendsList(): Promise<any> {
    return fetchWithAuth('/friends/list');
  }

  /**
   * Obtiene las solicitudes de amistad recibidas
   */
  static async getReceivedRequests(): Promise<any> {
    return fetchWithAuth('/friends/requests/received');
  }

  /**
   * Obtiene las solicitudes de amistad enviadas
   */
  static async getSentRequests(): Promise<any> {
    return fetchWithAuth('/friends/requests/sent');
  }

  /**
   * Elimina un amigo
   */
  static async removeFriend(friendUserId: string): Promise<any> {
    return fetchWithAuth('/friends/remove', {
      method: 'POST',
      body: JSON.stringify({ friend_user_id: friendUserId }),
    });
  }

  // ========== CLUBS API ==========

  /**
   * Crea un nuevo club
   */
  static async createClub(name: string): Promise<any> {
    return fetchWithAuth('/clubs/create', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  /**
   * Unirse a un club
   */
  static async joinClub(clubId: string): Promise<any> {
    return fetchWithAuth('/clubs/join', {
      method: 'POST',
      body: JSON.stringify({ club_id: clubId }),
    });
  }

  /**
   * Salir de un club
   */
  static async leaveClub(clubId: string): Promise<any> {
    return fetchWithAuth('/clubs/leave', {
      method: 'POST',
      body: JSON.stringify({ club_id: clubId }),
    });
  }

  /**
   * Buscar clubes por nombre
   */
  static async searchClubs(query: string): Promise<any> {
    return fetchWithAuth(`/clubs/search?name=${encodeURIComponent(query)}`);
  }

  /**
   * Obtiene la lista de clubes del usuario
   */
  static async getUserClubs(): Promise<any> {
    return fetchWithAuth('/clubs/list');
  }

  /**
   * Obtiene los miembros de un club
   */
  static async getClubMembers(clubId: string): Promise<any> {
    return fetchWithAuth(`/clubs/${clubId}/members`);
  }

  /**
   * Obtiene los mensajes de un club
   */
  static async getClubMessages(clubId: string): Promise<any> {
    return fetchWithAuth(`/clubs/${clubId}/messages`);
  }

  /**
   * Envía un mensaje a un club
   */
  static async sendClubMessage(clubId: string, message: string): Promise<any> {
    return fetchWithAuth(`/clubs/${clubId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }
}

/**
 * Hooks para usar con React
 * Ejemplo de uso futuro con React Query o SWR
 */
export const useCurrentUser = () => {
  // Implementar con React Query:
  // return useQuery('currentUser', ApiService.getCurrentUser);
  return { data: null, isLoading: false, error: null };
};

export const useTopArtists = (limit?: number) => {
  // return useQuery(['topArtists', limit], () => ApiService.getTopArtists(limit));
  return { data: null, isLoading: false, error: null };
};

export const useRanking = (period: TimePeriod) => {
  // return useQuery(['ranking', period], () => ApiService.getRanking(period));
  return { data: null, isLoading: false, error: null };
};
