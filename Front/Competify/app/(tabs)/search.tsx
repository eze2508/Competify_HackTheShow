import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TextInput, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArtistCard } from '@/components/ui/artist-card';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Artist } from '@/types';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [trackedArtistIds, setTrackedArtistIds] = useState<string[]>([]);

  // Cargar artistas trackeados al inicio
  useEffect(() => {
    loadTrackedArtists();
  }, []);

  const loadTrackedArtists = async () => {
    try {
      const tracked = await ApiService.getTrackedArtists();
      setTrackedArtistIds(tracked.map(a => a.id));
    } catch (error) {
      console.error('Error loading tracked artists:', error);
    }
  };

  // Buscar artistas cuando cambia el query
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchArtists();
      } else {
        setArtists([]);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const searchArtists = async () => {
    try {
      setLoading(true);
      const results = await ApiService.searchArtists(searchQuery);
      setArtists(results);
    } catch (error) {
      console.error('Error searching artists:', error);
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleTrackArtist = async (artist: Artist) => {
    const isTracked = trackedArtistIds.includes(artist.id);
    
    try {
      if (isTracked) {
        await ApiService.untrackArtist(artist.id);
        setTrackedArtistIds(prev => prev.filter(id => id !== artist.id));
      } else {
        await ApiService.trackArtist(artist);
        setTrackedArtistIds(prev => [...prev, artist.id]);
      }
    } catch (error) {
      console.error('Error toggling track:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Buscar</ThemedText>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Artistas, géneros..."
            placeholderTextColor={SpotifyColors.lightGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
        </View>
      </View>

      {/* Results */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.trim().length < 2 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              Busca tus artistas favoritos
            </ThemedText>
            <ThemedText style={styles.emptyHint}>
              Escribe al menos 2 caracteres
            </ThemedText>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SpotifyColors.green} />
            <ThemedText style={styles.loadingText}>Buscando...</ThemedText>
          </View>
        ) : (
          <View style={styles.grid}>
            {artists.map(artist => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                name={artist.name}
                imageUrl={artist.imageUrl}
                genres={artist.genres}
                followers={artist.followers}
                isTracked={trackedArtistIds.includes(artist.id)}
                onToggleTrack={() => toggleTrackArtist(artist)}
                onPress={() => console.log('Pressed artist:', artist.name)}
                variant="search"
              />
            ))}
            {artists.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  No se encontraron resultados para "{searchQuery}"
                </ThemedText>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpotifyColors.black,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: SpotifyColors.darkGray,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 16,
  },
  searchContainer: {
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 8,
    padding: 12,
  },
  searchInput: {
    fontSize: 16,
    color: SpotifyColors.white,
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    width: '100%',
  },
  emptyText: {
    fontSize: 16,
    color: SpotifyColors.lightGray,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    color: SpotifyColors.mediumGray,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
    marginTop: 12,
  },
});
