-- Script SQL para crear la tabla de artistas trackeados

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
CREATE INDEX idx_tracked_artists_user_id ON tracked_artists(user_id);
CREATE INDEX idx_tracked_artists_artist_id ON tracked_artists(artist_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tracked_artists_updated_at
BEFORE UPDATE ON tracked_artists
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
