/**
 * Configuración de la aplicación
 */

// Configuración de Spotify API
export const SPOTIFY_CONFIG = {
  CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
  CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || '',
  REDIRECT_URI: process.env.SPOTIFY_REDIRECT_URI || 'competify://callback',
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-read-recently-played',
    'user-library-read',
  ],
};

// URLs de API
export const API_URLS = {
  SPOTIFY_API: 'https://api.spotify.com/v1',
  SPOTIFY_AUTH: 'https://accounts.spotify.com',
  BACKEND_API: process.env.BACKEND_API_URL || 'http://localhost:3000/api',
};

// Configuración de rangos (vinilos)
export const RANK_THRESHOLDS = {
  BRONZE: 0,
  SILVER: 100,
  GOLD: 500,
  PLATINUM: 1000,
  DIAMOND: 5000,
};

// Límites y configuraciones de UI
export const UI_CONFIG = {
  MAX_TOP_ARTISTS: 5,
  MAX_RANKING_ITEMS: 100,
  SEARCH_DEBOUNCE_MS: 300,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutos
};

// Períodos de tiempo disponibles
export const TIME_PERIODS = {
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL_TIME: 'all-time',
} as const;

// Géneros musicales disponibles
export const MUSIC_GENRES = [
  'Todo',
  'Pop',
  'Hip Hop',
  'Reggaeton',
  'R&B',
  'Latin',
  'Alternative',
  'Rock',
  'Electronic',
  'Jazz',
  'Country',
  'Indie',
];

// Textos y traducciones
export const TEXTS = {
  PROFILE: {
    TITLE: 'Perfil',
    STATS_TITLE: 'Estadísticas',
    TOP_ARTISTS_TITLE: 'Artistas Más Escuchados',
    ACHIEVEMENTS_TITLE: 'Logros Recientes',
  },
  RANKING: {
    TITLE: 'Ranking Global',
    YOUR_RANK: 'Tu Rango',
    WEEK: 'Semana',
    MONTH: 'Mes',
    YEAR: 'Año',
    ALL_TIME: 'Histórico',
  },
  EXPLORE: {
    TITLE: 'Explorar Artistas',
    SEARCH_PLACEHOLDER: 'Buscar artistas...',
    NO_RESULTS: 'No se encontraron artistas',
  },
  COMMON: {
    LOADING: 'Cargando...',
    ERROR: 'Ocurrió un error',
    RETRY: 'Reintentar',
    HOURS: 'horas',
    FOLLOWERS: 'seguidores',
  },
};

// Configuración de logros
export const ACHIEVEMENTS = {
  TOP_10: {
    id: 'top_10',
    title: 'Top 10 del Mes',
    icon: '🏆',
    description: 'Llegaste al top 10 mensual',
  },
  STREAK_7: {
    id: 'streak_7',
    title: '7 días seguidos',
    icon: '🔥',
    description: 'Escuchaste música 7 días consecutivos',
  },
  ARTISTS_100: {
    id: 'artists_100',
    title: '100 artistas',
    icon: '⭐',
    description: 'Escuchaste 100 artistas diferentes',
  },
  HOURS_1000: {
    id: 'hours_1000',
    title: '1000 horas',
    icon: '💎',
    description: 'Acumulaste 1000 horas de música',
  },
};
