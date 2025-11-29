import { Artist, TopArtist, RankingEntry, User, TimePeriod } from '@/types';
import { VinylRank } from '@/components/ui/vinyl-badge';

/**
 * Mock API Service
 * Este servicio simula las llamadas a la API de Spotify y al backend.
 * Reemplazar con llamadas reales cuando se integre la API.
 */

// Simula un delay de red
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class ApiService {
  /**
   * Obtiene el perfil del usuario actual
   */
  static async getCurrentUser(): Promise<User> {
    await delay(500);
    
    return {
      id: '1',
      spotifyId: 'spotify:user:123',
      username: 'Usuario123',
      avatarUrl: 'https://i.pravatar.cc/300',
      rank: 'gold' as VinylRank,
      totalHours: 1234,
      currentMonthHours: 87,
      currentWeekHours: 23,
      totalArtists: 156,
    };
  }

  /**
   * Obtiene los artistas más escuchados del usuario
   */
  static async getTopArtists(limit: number = 5): Promise<TopArtist[]> {
    await delay(500);
    
    return [
      { id: '1', name: 'Taylor Swift', imageUrl: 'https://picsum.photos/200', genres: ['pop'], hours: 245 },
      { id: '2', name: 'The Weeknd', imageUrl: 'https://picsum.photos/201', genres: ['r&b'], hours: 198 },
      { id: '3', name: 'Bad Bunny', imageUrl: 'https://picsum.photos/202', genres: ['reggaeton'], hours: 176 },
      { id: '4', name: 'Drake', imageUrl: 'https://picsum.photos/203', genres: ['hip hop'], hours: 154 },
      { id: '5', name: 'Rosalía', imageUrl: 'https://picsum.photos/204', genres: ['flamenco'], hours: 132 },
    ].slice(0, limit);
  }

  /**
   * Obtiene el ranking global por período
   */
  static async getRanking(period: TimePeriod): Promise<RankingEntry[]> {
    await delay(500);
    
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
   * Busca artistas por nombre o género
   */
  static async searchArtists(query: string = '', genre?: string): Promise<Artist[]> {
    await delay(500);
    
    const allArtists: Artist[] = [
      { id: '1', name: 'Taylor Swift', imageUrl: 'https://picsum.photos/200', genres: ['pop', 'country'], followers: 92000000 },
      { id: '2', name: 'The Weeknd', imageUrl: 'https://picsum.photos/201', genres: ['r&b', 'pop'], followers: 78000000 },
      { id: '3', name: 'Bad Bunny', imageUrl: 'https://picsum.photos/202', genres: ['reggaeton', 'latin'], followers: 74000000 },
      { id: '4', name: 'Drake', imageUrl: 'https://picsum.photos/203', genres: ['hip hop', 'rap'], followers: 71000000 },
      { id: '5', name: 'Ed Sheeran', imageUrl: 'https://picsum.photos/204', genres: ['pop', 'folk'], followers: 69000000 },
      { id: '6', name: 'Ariana Grande', imageUrl: 'https://picsum.photos/205', genres: ['pop', 'r&b'], followers: 68000000 },
      { id: '7', name: 'Justin Bieber', imageUrl: 'https://picsum.photos/206', genres: ['pop'], followers: 66000000 },
      { id: '8', name: 'Billie Eilish', imageUrl: 'https://picsum.photos/207', genres: ['pop', 'alternative'], followers: 64000000 },
    ];

    let filtered = allArtists;

    if (query) {
      filtered = filtered.filter(artist => 
        artist.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (genre && genre !== 'Todo') {
      filtered = filtered.filter(artist => 
        artist.genres.some(g => g.toLowerCase().includes(genre.toLowerCase()))
      );
    }

    return filtered;
  }

  /**
   * Obtiene artistas recomendados
   */
  static async getRecommendedArtists(limit: number = 12): Promise<Artist[]> {
    await delay(500);
    return this.searchArtists('', undefined).then(artists => artists.slice(0, limit));
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
