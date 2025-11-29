# Configuración de Supabase

## Crear la tabla tracked_artists

Ve a tu proyecto de Supabase → SQL Editor y ejecuta este SQL:

```sql
-- Crear tabla de artistas trackeados
CREATE TABLE IF NOT EXISTS tracked_artists (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  artist_image_url TEXT,
  genres TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, artist_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_tracked_artists_user_id ON tracked_artists(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_artists_artist_id ON tracked_artists(artist_id);

-- Habilitar Row Level Security (RLS)
ALTER TABLE tracked_artists ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios artistas trackeados
CREATE POLICY "Users can view their own tracked artists"
  ON tracked_artists FOR SELECT
  USING (true);  -- Por ahora permitir todo, tu backend maneja la autenticación

-- Política: Los usuarios pueden insertar sus propios artistas
CREATE POLICY "Users can insert their own tracked artists"
  ON tracked_artists FOR INSERT
  WITH CHECK (true);

-- Política: Los usuarios pueden actualizar sus propios artistas
CREATE POLICY "Users can update their own tracked artists"
  ON tracked_artists FOR UPDATE
  USING (true);

-- Política: Los usuarios pueden eliminar sus propios artistas
CREATE POLICY "Users can delete their own tracked artists"
  ON tracked_artists FOR DELETE
  USING (true);
```

## Verificar que exista la tabla users

Si no existe la tabla `users`, créala primero:

```sql
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  spotify_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  email TEXT,
  avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);
```

## Pasos:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Crea una nueva query
5. Copia y pega el SQL de arriba
6. Ejecuta la query
7. Ve a "Table Editor" y verifica que la tabla `tracked_artists` aparezca
