# Guía de Conexión con Backend en Render

## Configuración Actual

- **Backend (Render):** `https://competify-hacktheshow.onrender.com`
- **Frontend:** App móvil React Native con Expo
- **Deep Link Scheme:** `competify://`

## Flujo de Autenticación

### 1. Usuario Hace Login

```
Usuario → Botón "Iniciar sesión" → 
Abre navegador → https://competify-hacktheshow.onrender.com/auth/login →
Spotify OAuth → Usuario autoriza →
Backend recibe tokens →
Backend genera JWT →
Redirige a: competify://callback?token=JWT_TOKEN →
App intercepta el deep link →
Guarda el token →
Redirige a explore
```

## Configuración Requerida

### 1. Spotify Developer Dashboard

Ir a: https://developer.spotify.com/dashboard

Agregar las siguientes **Redirect URIs**:

```
https://competify-hacktheshow.onrender.com/auth/callback
```

### 2. Variables de Entorno en Render

En el dashboard de Render, configurar:

```env
SPOTIFY_CLIENT_ID=tu_client_id_de_spotify
SPOTIFY_CLIENT_SECRET=tu_client_secret_de_spotify
SPOTIFY_REDIRECT_URI=https://competify-hacktheshow.onrender.com/auth/callback
FRONTEND_URL=competify://callback
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
APP_JWT_SECRET=un_secret_largo_y_aleatorio
PORT=4000
```

### 3. Frontend (app.json)

Ya está configurado con:
- `scheme: "competify"` - Para deep linking
- `extra.apiUrl` - URL del backend en producción

### 4. Supabase

Asegurarse de tener la tabla `tracked_artists` creada:

```sql
-- Ejecutar en Supabase SQL Editor
-- (Ver archivo Back/sql/tracked_artists.sql)
```

## Testing

### Opción 1: Dispositivo Físico (Recomendado)

1. **Iniciar la app con Expo:**
   ```bash
   cd Front/Competify
   npx expo start
   ```

2. **Escanear QR con Expo Go** en tu dispositivo móvil

3. **Hacer login:**
   - Click en "Iniciar sesión con Spotify"
   - Se abre el navegador
   - Autorizar la app en Spotify
   - El navegador redirige a `competify://callback?token=...`
   - La app se abre automáticamente con el token
   - Login completado ✅

### Opción 2: Desarrollo Local

Para desarrollo sin el backend de Render:

1. **Iniciar backend local:**
   ```bash
   cd Back
   npm run dev
   ```

2. **Configurar variables locales en Back/.env:**
   ```env
   SPOTIFY_REDIRECT_URI=http://localhost:4000/auth/callback
   FRONTEND_URL=exp://localhost:8081
   ```

3. **Modificar frontend temporalmente:**
   En `services/api.ts`, cambiar `API_BASE_URL` a:
   ```typescript
   const API_BASE_URL = 'http://TU_IP_LOCAL:4000';
   // Ejemplo: 'http://192.168.1.10:4000'
   ```

4. **Abrir login en navegador:**
   ```
   http://localhost:4000/auth/login
   ```

## Verificación

### Endpoints a Probar

1. **Health Check:**
   ```
   GET https://competify-hacktheshow.onrender.com/
   ```

2. **Login (abre en navegador):**
   ```
   https://competify-hacktheshow.onrender.com/auth/login
   ```

3. **User Info (requiere token):**
   ```
   GET https://competify-hacktheshow.onrender.com/me/current
   Headers: Authorization: Bearer YOUR_JWT_TOKEN
   ```

4. **Top Artists (requiere token):**
   ```
   GET https://competify-hacktheshow.onrender.com/artists/top?limit=10&time_range=short_term
   Headers: Authorization: Bearer YOUR_JWT_TOKEN
   ```

## Troubleshooting

### Error: "No authentication token found"
- El usuario no está logueado
- Hacer login desde la pantalla de login de la app

### Error: "Session expired"
- El token JWT expiró (30 días)
- Hacer logout y login nuevamente

### Error al abrir el deep link
- Verificar que la app esté instalada
- En iOS, puede requerir permisos adicionales
- Verificar que `scheme: "competify"` esté en app.json

### El navegador no redirige a la app
1. **Verificar que FRONTEND_URL en Render sea:** `competify://callback`
2. **Probar manualmente el deep link:**
   ```bash
   # Android (ADB)
   adb shell am start -W -a android.intent.action.VIEW -d "competify://callback?token=test"
   
   # iOS (Simulator)
   xcrun simctl openurl booted "competify://callback?token=test"
   ```

### Backend en Render demora mucho
- Render puede "dormir" servicios gratuitos después de inactividad
- Primera petición puede tardar 30-60 segundos
- Considerar upgrade a plan pago para instancias siempre activas

## Próximos Pasos

1. ✅ Deep linking configurado
2. ✅ Backend en Render conectado
3. ⏳ Implementar refresh automático de tokens
4. ⏳ Agregar manejo de errores de red
5. ⏳ Implementar cache de datos con AsyncStorage
6. ⏳ Agregar analytics y error tracking

## Arquitectura Final

```
[Usuario] 
   ↓ (1. Tap login)
[App Móvil] → (2. Abre navegador) → [Spotify OAuth]
                                           ↓ (3. Autoriza)
                                    [Backend Render]
                                           ↓ (4. Genera JWT)
                                    [competify://callback?token=JWT]
   ↑ (5. Deep link interceptado)
[App Móvil]
   ↓ (6. Guarda token + peticiones API)
[Backend Render] ↔ [Spotify API]
   ↓
[Supabase DB]
```

## Contacto con Backend

Todos los métodos en `ApiService` ahora usan la URL de Render automáticamente:

```typescript
// Ejemplo de uso
import { ApiService } from '@/services/api';

// Login (abre navegador)
const loginUrl = ApiService.getLoginUrl();
await Linking.openURL(loginUrl);

// Después del login, usar endpoints protegidos
const topArtists = await ApiService.getTopArtists(10, 'short_term');
const tracked = await ApiService.getTrackedArtists();
await ApiService.trackArtist(artist);
```

El token JWT se maneja automáticamente por `fetchWithAuth()`.
