# Configuración de Supabase

## Crear la tabla tracked_artists

Ve a tu proyecto de Supabase → SQL Editor y ejecuta este SQL:

```sql
-- Crear tabla de artistas trackeados
CREATE TABLE IF NOT EXISTS tracked_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Política: Permitir todas las operaciones (tu backend maneja la autenticación)
CREATE POLICY "Allow all operations on tracked_artists"
  ON tracked_artists FOR ALL
  USING (true)
  WITH CHECK (true);
```

## Verificar el tipo de ID de la tabla users

Primero verifica qué tipo de ID usa tu tabla users:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'id';
```

Si muestra `uuid`, usa el SQL de arriba.
Si muestra `bigint`, cambia `UUID` por `BIGINT` en el SQL de tracked_artists.

## Pasos:

1. Ve a https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a "SQL Editor" en el menú lateral
4. Crea una nueva query
5. Copia y pega el SQL de arriba
6. Ejecuta la query
7. Ve a "Table Editor" y verifica que la tabla `tracked_artists` aparezca
