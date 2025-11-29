# Competify - App de Competencia Musical 🎵

Una aplicación móvil estilo Spotify donde los usuarios compiten por quién escucha más a sus artistas favoritos.

## 🎨 Características Implementadas

### ✅ Diseño estilo Spotify
- Paleta de colores: Negro (#191414), Verde Spotify (#1DB954), Grises
- Sistema de rangos con vinilos: Bronce, Plata, Oro, Platino, Diamante

### 📱 Tres Pantallas Principales

#### 1. **Profile** (Perfil)
- Avatar de usuario y nombre
- Vinilo mostrando el rango actual
- Estadísticas:
  - Horas totales escuchadas
  - Horas este mes
  - Horas esta semana
  - Artistas únicos
- Top 5 artistas más escuchados con horas
- Logros recientes

#### 2. **Ranking** (Clasificación)
- Vinilo grande mostrando tu rango actual
- Filtros por período: Semana, Mes, Año, Histórico
- Lista de usuarios ordenados por horas
- Medallas para top 3 (🥇🥈🥉)
- Destacado especial para el usuario actual

#### 3. **Explore** (Explorar)
- Barra de búsqueda de artistas
- Filtros por género: Pop, Hip Hop, Reggaeton, R&B, Latin, Alternative
- Grid de cards de artistas con:
  - Imagen del artista
  - Nombre
  - Género principal
  - Número de seguidores

## 🏗️ Estructura del Proyecto

```
app/
├── (tabs)/
│   ├── _layout.tsx      # Navegación de pestañas
│   ├── profile.tsx      # Pantalla de perfil
│   ├── ranking.tsx      # Pantalla de ranking
│   ├── explore.tsx      # Pantalla de exploración
│   └── index.tsx        # Redirige a profile
│
components/
├── ui/
│   ├── artist-card.tsx  # Card de artista
│   ├── ranking-item.tsx # Item de ranking
│   ├── stats-card.tsx   # Card de estadísticas
│   └── vinyl-badge.tsx  # Badge de vinilo con rango
│
constants/
└── theme.ts             # Colores y tema Spotify
```

## 🎨 Componentes UI

### VinylBadge
Componente de vinilo 3D con efecto de surcos.
- Tamaños: small, medium, large
- Rangos: bronze, silver, gold, platinum, diamond

### ArtistCard
Card de artista con imagen, nombre, género y seguidores.

### RankingItem
Item de lista con posición, avatar, nombre y horas.
- Medallas para top 3
- Destacado especial para usuario actual

### StatsCard
Card de estadística con icono, valor y etiqueta.

## 🔜 Próximos Pasos - Integración API

### 1. Autenticación con Spotify
```typescript
// Implementar OAuth 2.0 con Spotify
- Client ID y Client Secret
- Redirect URI
- Scopes necesarios: user-read-recently-played, user-top-read
```

### 2. Endpoints a Integrar

#### Perfil de Usuario
```typescript
GET /me
GET /me/top/artists?time_range=short_term|medium_term|long_term
```

#### Historial de Reproducción
```typescript
GET /me/player/recently-played?limit=50
// Calcular horas por artista
```

#### Explorar Artistas
```typescript
GET /search?q={query}&type=artist
GET /browse/categories/{category_id}/playlists
GET /recommendations/available-genre-seeds
```

### 3. Backend Necesario

Crear un backend para:
- Almacenar horas acumuladas por usuario
- Calcular rankings globales
- Implementar sistema de rangos (vinilos)
- Históricos por semana/mes/año
- Leaderboard en tiempo real

### 4. Estructura de Datos

```typescript
interface User {
  id: string;
  spotifyId: string;
  username: string;
  avatar: string;
  totalHours: number;
  rank: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
}

interface UserStats {
  userId: string;
  period: 'week' | 'month' | 'year' | 'all-time';
  hours: number;
  topArtists: Array<{
    artistId: string;
    name: string;
    hours: number;
  }>;
}

interface Ranking {
  period: 'week' | 'month' | 'year' | 'all-time';
  users: Array<{
    position: number;
    userId: string;
    hours: number;
  }>;
}
```

## 🚀 Cómo Ejecutar

```bash
# Instalar dependencias
cd Front/Competify
npm install

# Ejecutar en desarrollo
npm start

# Para iOS
npm run ios

# Para Android
npm run android
```

## 📦 Dependencias Principales

- React Native (Expo)
- Expo Router (navegación)
- React Native Reanimated
- Expo Image

## 🎯 Sistema de Rangos (Vinilos)

Los rangos se asignan según las horas totales escuchadas:

- 🥉 **Bronce**: 0-100 horas
- 🥈 **Plata**: 101-500 horas
- 🥇 **Oro**: 501-1000 horas
- 💎 **Platino**: 1001-5000 horas
- 💠 **Diamante**: 5000+ horas

## 🔐 Variables de Entorno (Próximas)

Crear archivo `.env`:
```
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=tu_redirect_uri
API_BASE_URL=tu_backend_url
```

## 📝 Notas

- Actualmente usa datos mock para demostración
- Los colores siguen la paleta oficial de Spotify
- La UI está optimizada para modo oscuro
- Todos los componentes son reutilizables y tipados con TypeScript
