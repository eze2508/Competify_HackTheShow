/**
 * GUÍA DE INTEGRACIÓN CON SPOTIFY API
 * 
 * Este archivo contiene ejemplos de cómo integrar la API de Spotify
 * en las pantallas existentes.
 */

// ============================================
// 1. AUTENTICACIÓN CON SPOTIFY
// ============================================

/**
 * Configurar OAuth 2.0 con Spotify
 * Docs: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
 */

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

export const useSpotifyAuth = () => {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: 'TU_CLIENT_ID',
      scopes: [
        'user-read-private',
        'user-read-email',
        'user-top-read',
        'user-read-recently-played',
      ],
      redirectUri: AuthSession.makeRedirectUri({ useProxy: true }),
    },
    discovery
  );

  return { request, response, promptAsync };
};

// ============================================
// 2. LLAMADAS A LA API DE SPOTIFY
// ============================================

/**
 * Cliente HTTP para Spotify API
 */
class SpotifyClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async fetch(endpoint: string) {
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
    return response.json();
  }

  // Obtener perfil del usuario
  async getCurrentUser() {
    return this.fetch('/me');
  }

  // Obtener top artistas
  async getTopArtists(timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term') {
    return this.fetch(`/me/top/artists?time_range=${timeRange}&limit=50`);
  }

  // Obtener historial de reproducción
  async getRecentlyPlayed() {
    return this.fetch('/me/player/recently-played?limit=50');
  }

  // Buscar artistas
  async searchArtists(query: string) {
    return this.fetch(`/search?q=${encodeURIComponent(query)}&type=artist&limit=20`);
  }
}

// ============================================
// 3. EJEMPLO: ACTUALIZAR PERFIL CON DATOS REALES
// ============================================

/**
 * En profile.tsx, reemplaza MOCK_USER_DATA con:
 */

import { useEffect, useState } from 'react';

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [topArtists, setTopArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Obtener token guardado (AsyncStorage)
      const token = await AsyncStorage.getItem('spotify_token');
      const client = new SpotifyClient(token);

      // Cargar datos del usuario
      const user = await client.getCurrentUser();
      
      // Cargar top artistas
      const artists = await client.getTopArtists('medium_term');

      // Calcular horas (necesitas backend para esto)
      const stats = await fetch(`${BACKEND_URL}/users/${user.id}/stats`).then(r => r.json());

      setUserData({
        username: user.display_name,
        avatarUrl: user.images[0]?.url,
        ...stats,
      });

      setTopArtists(artists.items.slice(0, 5));
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando perfil..." />;
  }

  // ... resto del componente
}

// ============================================
// 4. EJEMPLO: ACTUALIZAR RANKING CON DATOS REALES
// ============================================

/**
 * En ranking.tsx, reemplaza MOCK_RANKINGS con:
 */

export default function RankingScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRankings();
  }, [selectedPeriod]);

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      // Llamar a tu backend
      const response = await fetch(`${BACKEND_URL}/rankings?period=${selectedPeriod}`);
      const data = await response.json();

      setRankings(data);
    } catch (error) {
      console.error('Error loading rankings:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del componente
}

// ============================================
// 5. EJEMPLO: ACTUALIZAR EXPLORE CON DATOS REALES
// ============================================

/**
 * En explore.tsx, reemplaza MOCK_ARTISTS con:
 */

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchArtists(searchQuery);
      } else {
        loadRecommendedArtists();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchArtists = async (query: string) => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('spotify_token');
      const client = new SpotifyClient(token);

      const results = await client.searchArtists(query);
      
      setArtists(results.artists.items.map(artist => ({
        id: artist.id,
        name: artist.name,
        imageUrl: artist.images[0]?.url,
        genres: artist.genres,
        followers: artist.followers.total,
      })));
    } catch (error) {
      console.error('Error searching artists:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... resto del componente
}

// ============================================
// 6. CALCULAR HORAS DE ESCUCHA (BACKEND)
// ============================================

/**
 * Endpoint de backend necesario para calcular horas
 * 
 * Este proceso debe ejecutarse periódicamente (cada hora o día):
 */

// Node.js / Express ejemplo:
app.post('/api/users/:userId/sync-listening-hours', async (req, res) => {
  const { userId } = req.params;
  
  // 1. Obtener token de Spotify del usuario
  const userToken = await getUserSpotifyToken(userId);
  const client = new SpotifyClient(userToken);
  
  // 2. Obtener historial reciente
  const recentlyPlayed = await client.getRecentlyPlayed();
  
  // 3. Calcular tiempo por artista
  const artistHours = {};
  
  for (const item of recentlyPlayed.items) {
    const artistId = item.track.artists[0].id;
    const durationMs = item.track.duration_ms;
    const durationHours = durationMs / (1000 * 60 * 60);
    
    if (!artistHours[artistId]) {
      artistHours[artistId] = 0;
    }
    artistHours[artistId] += durationHours;
  }
  
  // 4. Guardar en base de datos
  await saveUserListeningHours(userId, artistHours);
  
  // 5. Actualizar ranking global
  await updateGlobalRanking();
  
  res.json({ success: true });
});

// ============================================
// 7. USAR REACT QUERY PARA CACHÉ
// ============================================

/**
 * Instalar: npm install @tanstack/react-query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Hook para obtener perfil
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const token = await AsyncStorage.getItem('spotify_token');
      const client = new SpotifyClient(token);
      return client.getCurrentUser();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para obtener rankings
export const useRankings = (period: TimePeriod) => {
  return useQuery({
    queryKey: ['rankings', period],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/rankings?period=${period}`);
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minuto
  });
};

// Hook para buscar artistas
export const useSearchArtists = (query: string) => {
  return useQuery({
    queryKey: ['searchArtists', query],
    queryFn: async () => {
      if (!query) return [];
      const token = await AsyncStorage.getItem('spotify_token');
      const client = new SpotifyClient(token);
      const results = await client.searchArtists(query);
      return results.artists.items;
    },
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// ============================================
// 8. ESTRUCTURA DE BASE DE DATOS
// ============================================

/**
 * Tablas necesarias en tu backend:
 */

// PostgreSQL ejemplo:
`
CREATE TABLE users (
  id UUID PRIMARY KEY,
  spotify_id VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  avatar_url TEXT,
  total_hours DECIMAL(10, 2) DEFAULT 0,
  rank VARCHAR(50) DEFAULT 'bronze',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE listening_history (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  artist_id VARCHAR(255),
  artist_name VARCHAR(255),
  duration_ms INTEGER,
  played_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rankings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  period VARCHAR(50), -- 'week', 'month', 'year', 'all-time'
  position INTEGER,
  hours DECIMAL(10, 2),
  rank VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rankings_period ON rankings(period, position);
CREATE INDEX idx_listening_history_user ON listening_history(user_id, played_at);
`

// ============================================
// 9. VARIABLES DE ENTORNO
// ============================================

/**
 * Crear archivo .env en la raíz del proyecto:
 */

`
# Spotify API
SPOTIFY_CLIENT_ID=tu_client_id_aqui
SPOTIFY_CLIENT_SECRET=tu_client_secret_aqui
SPOTIFY_REDIRECT_URI=competify://callback

# Backend API
BACKEND_API_URL=https://api.tudominio.com
`

// Y en app.json agregar:
`
{
  "expo": {
    "scheme": "competify",
    "extra": {
      "spotifyClientId": process.env.SPOTIFY_CLIENT_ID
    }
  }
}
`

// ============================================
// 10. PRÓXIMOS PASOS
// ============================================

/**
 * Checklist de integración:
 * 
 * [ ] 1. Crear app en Spotify Developer Dashboard
 * [ ] 2. Configurar OAuth y redirect URI
 * [ ] 3. Implementar flujo de autenticación
 * [ ] 4. Guardar tokens en AsyncStorage
 * [ ] 5. Crear backend con base de datos
 * [ ] 6. Implementar endpoints de rankings
 * [ ] 7. Crear job para sincronizar historial
 * [ ] 8. Reemplazar mock data en pantallas
 * [ ] 9. Agregar manejo de errores
 * [ ] 10. Implementar React Query para caché
 * [ ] 11. Agregar refresh de datos
 * [ ] 12. Implementar notificaciones
 * [ ] 13. Testing y debugging
 * [ ] 14. Deploy!
 */
