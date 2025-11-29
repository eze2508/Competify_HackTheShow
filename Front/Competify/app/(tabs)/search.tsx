import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TextInput } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ArtistCard } from '@/components/ui/artist-card';
import { SpotifyColors } from '@/constants/theme';

// Mock data - reemplazar con datos reales de la API de Spotify
const ALL_ARTISTS = [
  { id: '1', name: 'Taylor Swift', imageUrl: 'https://picsum.photos/200', genres: ['pop', 'country'], followers: 92000000 },
  { id: '2', name: 'The Weeknd', imageUrl: 'https://picsum.photos/201', genres: ['r&b', 'pop'], followers: 78000000 },
  { id: '3', name: 'Bad Bunny', imageUrl: 'https://picsum.photos/202', genres: ['reggaeton', 'latin'], followers: 74000000 },
  { id: '4', name: 'Drake', imageUrl: 'https://picsum.photos/203', genres: ['hip hop', 'rap'], followers: 71000000 },
  { id: '5', name: 'Ed Sheeran', imageUrl: 'https://picsum.photos/204', genres: ['pop', 'folk'], followers: 69000000 },
  { id: '6', name: 'Ariana Grande', imageUrl: 'https://picsum.photos/205', genres: ['pop', 'r&b'], followers: 68000000 },
  { id: '7', name: 'Justin Bieber', imageUrl: 'https://picsum.photos/206', genres: ['pop'], followers: 66000000 },
  { id: '8', name: 'Billie Eilish', imageUrl: 'https://picsum.photos/207', genres: ['pop', 'alternative'], followers: 64000000 },
  { id: '9', name: 'Dua Lipa', imageUrl: 'https://picsum.photos/208', genres: ['pop', 'dance'], followers: 62000000 },
  { id: '10', name: 'Post Malone', imageUrl: 'https://picsum.photos/209', genres: ['hip hop', 'pop'], followers: 60000000 },
  { id: '11', name: 'Rosalía', imageUrl: 'https://picsum.photos/210', genres: ['flamenco', 'latin'], followers: 28000000 },
  { id: '12', name: 'Peso Pluma', imageUrl: 'https://picsum.photos/211', genres: ['corridos', 'regional mexican'], followers: 25000000 },
];

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredArtists = ALL_ARTISTS.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        {searchQuery === '' ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              Busca tus artistas favoritos
            </ThemedText>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredArtists.map(artist => (
              <ArtistCard
                key={artist.id}
                id={artist.id}
                name={artist.name}
                imageUrl={artist.imageUrl}
                genres={artist.genres}
                followers={artist.followers}
                onPress={() => console.log('Pressed artist:', artist.name)}
              />
            ))}
            {filteredArtists.length === 0 && (
              <View style={styles.emptyState}>
                <ThemedText style={styles.emptyText}>
                  No se encontraron resultados
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
    padding: 16,
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
  },
});
