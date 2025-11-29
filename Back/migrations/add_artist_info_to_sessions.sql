-- Agregar columnas de información de artista a listening_sessions
-- Ejecutar esto en Supabase SQL Editor

ALTER TABLE listening_sessions 
ADD COLUMN IF NOT EXISTS track_name TEXT,
ADD COLUMN IF NOT EXISTS artist_name TEXT,
ADD COLUMN IF NOT EXISTS artist_id TEXT;

-- Crear índice para búsquedas por artista
CREATE INDEX IF NOT EXISTS idx_listening_sessions_artist_name 
ON listening_sessions(artist_name);

CREATE INDEX IF NOT EXISTS idx_listening_sessions_artist_id 
ON listening_sessions(artist_id);

-- Crear índice compuesto para agregaciones por usuario y artista
CREATE INDEX IF NOT EXISTS idx_listening_sessions_user_artist 
ON listening_sessions(user_id, artist_name);

-- Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'listening_sessions'
ORDER BY ordinal_position;
