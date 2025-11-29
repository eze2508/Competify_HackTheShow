# Spotify Listening Tracker (Backend)

Backend Node.js + Express para trackear tiempo escuchado en Spotify y guardar sesiones en Supabase (Postgres).

## Características
- OAuth 2.0 con Spotify
- Refresh automático de tokens
- Servicio `ListeningTracker` que consulta `GET /v1/me/player/currently-playing` cada 1s
- Guarda sesiones en Supabase: `listening_sessions`
- Endpoints:
  - `GET /auth/login`
  - `GET /auth/callback`
  - `GET /me/current` (Bearer JWT)
  - `GET /me/stats`   (Bearer JWT)

## Setup local (development)

1. Clona el repo.
2. Copia `.env.example` a `.env` y completa variables:
   - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
   - `FRONTEND_URL` (donde tu frontend recibirá el token luego del login)
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (usa service role key para escribir)
   - `APP_JWT_SECRET`
3. Crea las tablas en Supabase (usa el SQL provisto en README).
4. `npm install`
5. `npm run dev`
6. Abre `http://localhost:4000/auth/login` para conectar tu cuenta Spotify.

## Deploy en Render
1. Nuevo servicio -> **Web Service**.
2. Conectar repo, branch.
3. Build Command: `npm install && npm run build` (si no hay build usar `npm install`)
4. Start Command: `npm start` (o `node src/index.js`)
5. En Environment Variables de Render, añade:
   - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI`
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_JWT_SECRET`, `FRONTEND_URL`
6. Asegurate que `SPOTIFY_REDIRECT_URI` esté registrado en tu app de Spotify (la URL que te provea Render + `/auth/callback`).

## Notas importantes
- Este backend usa la **Service Role Key** de Supabase: mantenela segura y NO exponer en frontend.
- La `APP_JWT_SECRET` la usás para crear un token que el frontend recibirá en la URL `?token=...`. Almacenar este token en frontend de forma segura (ej. localStorage o cookies seguras según tu arquitectura).
- El `ListeningTracker` corre en el proceso de Node y hace polling cada segundo. Es simple y pensado para un MVP/hackathon. Para producción considerar:
  - reducir frecuencia,
  - usar webhooks / Real-time (si disponible),
  - correr worker separado (que se escale),
  - manejar límites de rate de Spotify.

## Scripts útiles
- `npm run dev` : modo desarrollo (nodemon)
- `npm start` : iniciar el servidor
- `npm run docker:build` : build docker
- `npm run docker:up` : docker-compose up --build

### Nuevo endpoint: Recommendations

**GET** `/spotify/recommendations` (Protected — Bearer JWT)

- Descripción: devuelve una lista de canciones recomendadas basadas en los "liked songs" del usuario en Spotify.
- Lógica servidor:
  - Usa el `access_token` del usuario (refresca si hace falta).
  - Llama a `GET https://api.spotify.com/v1/me/tracks?limit=10` para obtener liked songs.
  - Obtiene artistas y géneros (vía `/v1/artists`) y usa `seed_tracks`, `seed_artists`, `seed_genres` para llamar:
    `GET https://api.spotify.com/v1/recommendations`.
  - Si no hay liked songs, usa `seed_genres=pop` como fallback.
- Respuesta (array):
  ```json
  [
    {
      "track_id": "...",
      "name": "...",
      "artist": "...",
      "album": "...",
      "album_image_url": "...",
      "preview_url": "..."
    }
  ]
