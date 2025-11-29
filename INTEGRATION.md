# Integración Frontend-Backend con Spotify API

## Resumen

Se ha completado la integración entre el frontend (React Native/Expo) y el backend (Node.js/Express) para conectar con la Spotify API.

## Cambios Realizados

### Backend

#### Nuevos Endpoints - `/artists`

1. **GET /artists/top** - Obtiene los top artistas del usuario desde Spotify
   - Parámetros: `limit` (opcional), `time_range` (short_term/medium_term/long_term)
   - Autenticación: Requerida
   - Respuesta: Array de artistas con géneros

2. **GET /artists/tracked** - Obtiene artistas trackeados por el usuario
   - Autenticación: Requerida
   - Respuesta: Array de artistas guardados en DB

3. **POST /artists/track** - Trackear un artista
   - Body: `{ artistId, artistName, artistImageUrl, genres }`
   - Autenticación: Requerida

4. **DELETE /artists/track/:artistId** - Dejar de trackear
   - Autenticación: Requerida

5. **GET /artists/discover** - Descubrir artistas (recomendaciones)
   - Autenticación: Requerida
   - Usa related artists de Spotify

#### Archivos Creados/Modificados

- `src/routes/artists.js` - Rutas de artistas
- `src/controllers/artistsController.js` - Lógica de negocio
- `src/index.js` - Agregado router de artistas
- `sql/tracked_artists.sql` - Script SQL para tabla

### Frontend

#### Autenticación

1. **AuthContext** (`contexts/AuthContext.tsx`)
   - Maneja estado de autenticación
   - Guarda token JWT en AsyncStorage
   - Provee `login`, `logout`, `isAuthenticated`

2. **Pantalla de Login** (`app/login.tsx`)
   - UI de Spotify-style
   - Botón que abre el flujo OAuth en el navegador
   - Logo y diseño con vinilo

3. **Layout Principal** (`app/_layout.tsx`)
   - Protección de rutas
   - Redirige a login si no autenticado
   - Redirige a app si ya autenticado

#### Servicio API

**Actualizado** `services/api.ts`:
- Conecta con backend real en lugar de mock data
- `fetchWithAuth()` - Helper para peticiones autenticadas
- Métodos:
  - `getTopArtists(limit, timeRange)` - Top artistas de Spotify
  - `getDiscoverArtists()` - Recomendaciones
  - `getTrackedArtists()` - Artistas guardados
  - `trackArtist(artist)` - Guardar artista
  - `untrackArtist(artistId)` - Eliminar artista

#### Pantalla Artists (Explore)

**Actualizado** `app/(tabs)/explore.tsx`:
- Carga datos reales desde API
- 4 secciones: Top Picks, Tracked, Discover, All Time
- Loading state con spinner
- Filtros por género funcionales
- Tracking/untracking persistente en DB

#### Componentes

**Actualizado** `components/ui/artist-card.tsx`:
- Botón de tracking con check.png
- Props: `isTracked`, `onToggleTrack`
- Evento de click separado del tracking

#### Profile

**Actualizado** `app/(tabs)/profile.tsx`:
- Botón "Cerrar Sesión"
- Usa hook `useAuth()` para logout

## Flujo de Autenticación

1. Usuario abre la app → ve pantalla de login
2. Click en "Iniciar sesión con Spotify"
3. Se abre navegador con OAuth de Spotify
4. Usuario autoriza la app
5. Backend recibe código, obtiene tokens, crea/actualiza usuario en DB
6. Backend genera JWT y redirige a: `FRONTEND_URL?token=JWT_TOKEN`
7. Frontend detecta el token en URL y lo guarda
8. Usuario redirigido a la app autenticada

## Variables de Entorno Requeridas

### Backend (.env)

```env
SPOTIFY_CLIENT_ID=tu_client_id
SPOTIFY_CLIENT_SECRET=tu_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:4000/auth/callback
FRONTEND_URL=exp://localhost:8081
APP_JWT_SECRET=tu_jwt_secret
```

### Frontend

El frontend detecta automáticamente el entorno:
- Desarrollo: `http://localhost:4000`
- Producción: `https://competify-hacktheshow.onrender.com`

## Base de Datos

### Nueva Tabla: `tracked_artists`

```sql
- id (BIGSERIAL)
- user_id (FK a users)
- artist_id (TEXT) - ID de Spotify
- artist_name (TEXT)
- artist_image_url (TEXT)
- genres (TEXT[])
- created_at, updated_at
- UNIQUE(user_id, artist_id)
```

Ejecutar: `Back/sql/tracked_artists.sql` en Supabase

## Dependencias Instaladas

### Frontend

```bash
npm install @react-native-async-storage/async-storage
```

## Próximos Pasos

1. **Implementar deep linking** para callback de Spotify en móvil
2. **Agregar refresh de access token** automático en el frontend
3. **Implementar rankings reales** usando datos de listening_sessions
4. **Cachear respuestas** de Spotify para reducir rate limits
5. **Agregar manejo de errores** más robusto (token expirado, etc.)
6. **Testing** en dispositivo físico para OAuth flow

## Testing Local

1. Iniciar backend: `cd Back && npm run dev`
2. Iniciar frontend: `cd Front/Competify && npx expo start`
3. En navegador, ir a `http://localhost:4000/auth/login`
4. Autorizar en Spotify
5. Copiar el token del redirect
6. Guardarlo en AsyncStorage del dispositivo

## Notas Importantes

- El OAuth de Spotify requiere configuración en el Spotify Developer Dashboard
- Agregar `exp://localhost:8081` como redirect URI autorizado
- Para producción, usar deep links apropiados (myapp://callback)
- Los filtros de género filtran localmente, considerar filtrado server-side
