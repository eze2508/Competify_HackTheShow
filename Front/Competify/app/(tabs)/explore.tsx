import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArtistCard } from '@/components/ui/artist-card';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Artist } from '@/types';

const warningIcon = require('@/assets/images/warning.png');

const GENRE_FILTERS = ['All', 'Pop', 'Hip Hop', 'Reggaeton', 'R&B', 'Latin', 'Alternative', 'Rock'];

export default function ArtistsScreen() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackedArtistIds, setTrackedArtistIds] = useState<string[]>([]);
  
  // Artistas de diferentes secciones
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [trackedArtists, setTrackedArtists] = useState<Artist[]>([]);
  const [discoverArtists, setDiscoverArtists] = useState<Artist[]>([]);
  const [longTermArtists, setLongTermArtists] = useState<Artist[]>([]);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar datos del backend
      const [topShort, tracked, discover, topLong] = await Promise.all([
        ApiService.getTopArtists(10, 'short_term'),
        ApiService.getTrackedArtists(),
        ApiService.getDiscoverArtists(),
        ApiService.getTopArtists(10, 'long_term')
      ]);

      setTopArtists(topShort);
      setTrackedArtists(tracked);
      setDiscoverArtists(discover);
      setLongTermArtists(topLong);
      setTrackedArtistIds(tracked.map(a => a.id));
    } catch (error: any) {
      console.error('Error loading artists:', error);
      const errorMessage = error?.message || 'Error desconocido';
      
      if (errorMessage.includes('No authentication token')) {
        setError('Debes iniciar sesión para ver tus artistas');
      } else if (errorMessage.includes('Session expired')) {
        setError('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión');
      } else if (errorMessage.includes('Network')) {
        setError('No se pudo conectar al servidor. Verifica tu conexión a internet');
      } else {
        setError('No se pudieron cargar los artistas. Intenta nuevamente');
      }
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
        setTrackedArtists(prev => prev.filter(a => a.id !== artist.id));
      } else {
        await ApiService.trackArtist(artist);
        setTrackedArtistIds(prev => [...prev, artist.id]);
        setTrackedArtists(prev => [...prev, artist]);
      }
    } catch (error) {
      console.error('Error toggling track:', error);
    }
  };

  const filterArtistsByGenre = (artists: Artist[]) => {
    if (selectedGenre === 'All') return artists;
    return artists.filter(artist => 
      artist.genres?.some(g => g.toLowerCase().includes(selectedGenre.toLowerCase()))
    );
  };

  const artistSections = [
    { title: 'Your Top Picks', artists: filterArtistsByGenre(topArtists) },
    { title: 'Your Tracked Artists', artists: filterArtistsByGenre(trackedArtists) },
    { title: 'Discover', artists: filterArtistsByGenre(discoverArtists) },
    { title: 'All Time Favorites', artists: filterArtistsByGenre(longTermArtists) },
  ];
  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Artists</ThemedText>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SpotifyColors.green} />
          <ThemedText style={styles.loadingText}>Loading your artists...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Artists</ThemedText>
        </View>
        <View style={styles.errorContainer}>
          <Image source={warningIcon} style={styles.errorIcon} />
          <ThemedText style={styles.errorTitle}>Error</ThemedText>
          <ThemedText style={styles.errorMessage}>{error}</ThemedText>
          <Pressable 
            style={({ pressed }) => [
              styles.retryButton,
              pressed && styles.retryButtonPressed
            ]}
            onPress={loadArtists}
          >
            <ThemedText style={styles.retryButtonText}>Reintentar</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Artists</ThemedText>
      </View>

      {/* Genre Filters */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {GENRE_FILTERS.map(genre => (
            <Pressable
              key={genre}
              style={({ pressed }) => [
                styles.filterChip,
                selectedGenre === genre && styles.filterChipActive,
                pressed && styles.filterChipPressed,
              ]}
              onPress={() => setSelectedGenre(genre)}
            >
              <ThemedText style={[
                styles.filterText,
                selectedGenre === genre && styles.filterTextActive,
              ]}>
                {genre}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Sections */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {artistSections.map((section, index) => (
          section.artists.length > 0 && (
            <View key={index} style={styles.section}>
              <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
              <FlatList
                horizontal
                data={section.artists}
                renderItem={({ item }) => (
                  <ArtistCard
                    id={item.id}
                    name={item.name}
                    imageUrl={item.imageUrl}
                    genres={item.genres}
                    followers={item.followers}
                    isTracked={trackedArtistIds.includes(item.id)}
                    onToggleTrack={() => toggleTrackArtist(item)}
                    onPress={() => console.log('Pressed artist:', item.name)}
                  />
                )}
                keyExtractor={item => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              />
            </View>
          )
        ))}
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
    paddingBottom: 20,
    backgroundColor: SpotifyColors.black,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
  filtersContainer: {
    paddingVertical: 12,
    backgroundColor: SpotifyColors.black,
  },
  filters: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: SpotifyColors.mediumGray,
  },
  filterChipActive: {
    backgroundColor: SpotifyColors.green,
  },
  filterChipPressed: {
    opacity: 0.7,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: SpotifyColors.lightGray,
  },
  filterTextActive: {
    color: SpotifyColors.black,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  horizontalList: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIcon: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: SpotifyColors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: SpotifyColors.green,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SpotifyColors.black,
  },
});
