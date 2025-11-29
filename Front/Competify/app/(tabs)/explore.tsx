import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArtistCard } from '@/components/ui/artist-card';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Artist } from '@/types';

const GENRE_FILTERS = ['All', 'Pop', 'Hip Hop', 'Reggaeton', 'R&B', 'Latin', 'Alternative', 'Rock'];

// Mock data de fallback
const MOCK_ARTISTS: Artist[] = [
  { id: '1', name: 'Taylor Swift', imageUrl: 'https://picsum.photos/200', genres: ['pop', 'country'], followers: 92000000 },
  { id: '2', name: 'The Weeknd', imageUrl: 'https://picsum.photos/201', genres: ['r&b', 'pop'], followers: 78000000 },
  { id: '3', name: 'Bad Bunny', imageUrl: 'https://picsum.photos/202', genres: ['reggaeton', 'latin'], followers: 74000000 },
  { id: '4', name: 'Drake', imageUrl: 'https://picsum.photos/203', genres: ['hip hop', 'rap'], followers: 71000000 },
  { id: '5', name: 'Ed Sheeran', imageUrl: 'https://picsum.photos/204', genres: ['pop', 'folk'], followers: 69000000 },
  { id: '6', name: 'Ariana Grande', imageUrl: 'https://picsum.photos/205', genres: ['pop', 'r&b'], followers: 68000000 },
  { id: '7', name: 'Justin Bieber', imageUrl: 'https://picsum.photos/206', genres: ['pop'], followers: 66000000 },
  { id: '8', name: 'Billie Eilish', imageUrl: 'https://picsum.photos/207', genres: ['pop', 'alternative'], followers: 64000000 },
];

export default function ArtistsScreen() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);
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
      
      // Intentar cargar datos reales del backend
      const [topShort, tracked, discover, topLong] = await Promise.all([
        ApiService.getTopArtists(10, 'short_term').catch(() => MOCK_ARTISTS.slice(0, 5)),
        ApiService.getTrackedArtists().catch(() => []),
        ApiService.getDiscoverArtists().catch(() => MOCK_ARTISTS.slice(2, 7)),
        ApiService.getTopArtists(10, 'long_term').catch(() => MOCK_ARTISTS.slice(1, 6))
      ]);

      setTopArtists(topShort);
      setTrackedArtists(tracked);
      setDiscoverArtists(discover);
      setLongTermArtists(topLong);
      setTrackedArtistIds(tracked.map(a => a.id));
    } catch (error) {
      console.error('Error loading artists:', error);
      // Si falla todo, usar mock data
      setTopArtists(MOCK_ARTISTS.slice(0, 5));
      setDiscoverArtists(MOCK_ARTISTS.slice(2, 7));
      setLongTermArtists(MOCK_ARTISTS.slice(1, 6));
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
});
