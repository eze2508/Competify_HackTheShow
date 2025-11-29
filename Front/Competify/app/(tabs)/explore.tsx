import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, FlatList, Pressable, ActivityIndicator, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArtistCard } from '@/components/ui/artist-card';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Artist } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

const warningIcon = require('@/assets/images/warning.png');

const GENRE_FILTERS = ['All', 'Pop', 'Hip Hop', 'Reggaeton', 'R&B', 'Latin', 'Alternative', 'Rock'];

export default function ArtistsScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackedArtistIds, setTrackedArtistIds] = useState<string[]>([]);
  
  // Artistas de diferentes secciones
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [trackedArtists, setTrackedArtists] = useState<Artist[]>([]);
  const [discoverArtists, setDiscoverArtists] = useState<Artist[]>([]);
  const [longTermArtists, setLongTermArtists] = useState<Artist[]>([]);
  const [similarArtists, setSimilarArtists] = useState<Artist[]>([]);
  const [similarBasedOn, setSimilarBasedOn] = useState<string | null>(null);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Cargar cada sección independientemente para que si una falla, las otras se carguen
      const results = await Promise.allSettled([
        ApiService.getTopArtists(10, 'short_term'),
        ApiService.getTrackedArtists(),
        ApiService.getDiscoverArtists(),
        ApiService.getTopArtists(10, 'long_term'),
        ApiService.getSimilarArtists()
      ]);

      // Procesar resultados
      if (results[0].status === 'fulfilled') setTopArtists(results[0].value);
      if (results[1].status === 'fulfilled') {
        setTrackedArtists(results[1].value);
        setTrackedArtistIds(results[1].value.map(a => a.id));
      }
      if (results[2].status === 'fulfilled') setDiscoverArtists(results[2].value);
      if (results[3].status === 'fulfilled') setLongTermArtists(results[3].value);
      if (results[4].status === 'fulfilled') {
        setSimilarArtists(results[4].value.artists);
        setSimilarBasedOn(results[4].value.basedOn?.name || null);
      }

      // Si todas fallaron, mostrar error
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        const firstError: any = results.find(r => r.status === 'rejected');
        const errorMessage = firstError?.reason?.message || 'Error desconocido';
        
        console.error('All requests failed. First error:', errorMessage);
        
        if (errorMessage.includes('No authentication token')) {
          setError('Debes iniciar sesión para ver tus artistas');
        } else if (errorMessage.includes('Session expired')) {
          setError('Tu sesión ha expirado. Por favor, vuelve a iniciar sesión');
        } else if (errorMessage.includes('Network') || errorMessage.includes('Failed to fetch')) {
          setError('No se pudo conectar al servidor. Verifica tu conexión a internet');
        } else {
          setError(`Error: ${errorMessage}`);
        }
      }
    } catch (error: any) {
      console.error('Error loading artists:', error);
      setError('Error inesperado al cargar los artistas');
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
    { 
      title: similarBasedOn ? `Similar Vibes to ${similarBasedOn}` : 'Similar Vibes', 
      artists: filterArtistsByGenre(similarArtists) 
    },
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

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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
          
          {error.includes('sesión') || error.includes('iniciar sesión') ? (
            <Pressable 
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed
              ]}
              onPress={handleLogout}
            >
              <ThemedText style={styles.logoutButtonText}>Volver a Login</ThemedText>
            </Pressable>
          ) : null}
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
        {artistSections.map((section, index) => {
          // Mostrar mensaje especial para Tracked Artists si está vacío
          if (section.title === 'Your Tracked Artists' && section.artists.length === 0) {
            return (
              <View key={index} style={styles.section}>
                <ThemedText style={styles.sectionTitle}>{section.title}</ThemedText>
                <View style={styles.emptyTrackedContainer}>
                  <ThemedText style={styles.emptyTrackedText}>
                    Aún no has trackeado artistas
                  </ThemedText>
                  <ThemedText style={styles.emptyTrackedHint}>
                    Toca el ✓ en cualquier artista para añadirlo aquí
                  </ThemedText>
                </View>
              </View>
            );
          }

          return section.artists.length > 0 ? (
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
          ) : null;
        })}
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
  logoutButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: SpotifyColors.lightGray,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 12,
  },
  logoutButtonPressed: {
    opacity: 0.6,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: SpotifyColors.lightGray,
  },
  emptyTrackedContainer: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTrackedText: {
    fontSize: 16,
    color: SpotifyColors.lightGray,
    marginBottom: 8,
  },
  emptyTrackedHint: {
    fontSize: 14,
    color: SpotifyColors.mediumGray,
    textAlign: 'center',
  },
});
