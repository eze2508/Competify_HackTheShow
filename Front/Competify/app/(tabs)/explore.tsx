import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, FlatList, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArtistCard } from '@/components/ui/artist-card';
import { SpotifyColors } from '@/constants/theme';

// Mock data - reemplazar con datos reales de la API de Spotify
const MOCK_ARTISTS = [
  { id: '1', name: 'Taylor Swift', imageUrl: 'https://picsum.photos/200', genres: ['pop', 'country'], followers: 92000000 },
  { id: '2', name: 'The Weeknd', imageUrl: 'https://picsum.photos/201', genres: ['r&b', 'pop'], followers: 78000000 },
  { id: '3', name: 'Bad Bunny', imageUrl: 'https://picsum.photos/202', genres: ['reggaeton', 'latin'], followers: 74000000 },
  { id: '4', name: 'Drake', imageUrl: 'https://picsum.photos/203', genres: ['hip hop', 'rap'], followers: 71000000 },
  { id: '5', name: 'Ed Sheeran', imageUrl: 'https://picsum.photos/204', genres: ['pop', 'folk'], followers: 69000000 },
  { id: '6', name: 'Ariana Grande', imageUrl: 'https://picsum.photos/205', genres: ['pop', 'r&b'], followers: 68000000 },
  { id: '7', name: 'Justin Bieber', imageUrl: 'https://picsum.photos/206', genres: ['pop'], followers: 66000000 },
  { id: '8', name: 'Billie Eilish', imageUrl: 'https://picsum.photos/207', genres: ['pop', 'alternative'], followers: 64000000 },
];

const GENRE_FILTERS = ['All', 'Pop', 'Hip Hop', 'Reggaeton', 'R&B', 'Latin', 'Alternative'];

const getArtistSections = (trackedIds: string[]) => [
  { title: 'Your Top Picks', artists: MOCK_ARTISTS.slice(0, 5) },
  { title: 'Your Tracked Artists', artists: MOCK_ARTISTS.filter(a => trackedIds.includes(a.id)) },
  { title: 'Similar Vibes', artists: MOCK_ARTISTS.slice(1, 6) },
  { title: 'Trending Now', artists: MOCK_ARTISTS.slice(3, 8) },
];

export default function ArtistsScreen() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [trackedArtists, setTrackedArtists] = useState<string[]>(['1', '3']); // IDs de artistas trackeados

  const toggleTrackArtist = (artistId: string) => {
    setTrackedArtists(prev => 
      prev.includes(artistId) 
        ? prev.filter(id => id !== artistId)
        : [...prev, artistId]
    );
  };

  const artistSections = getArtistSections(trackedArtists);
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
                    isTracked={trackedArtists.includes(item.id)}
                    onToggleTrack={() => toggleTrackArtist(item.id)}
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
});
