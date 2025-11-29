import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Pressable, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RankingItem } from '@/components/ui/ranking-item';
import { VinylBadge, VinylRank } from '@/components/ui/vinyl-badge';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Artist } from '@/types';

type TimePeriod = 'week' | 'month' | 'year' | 'all-time';
type RankingMode = 'global' | 'artist';

// Función para generar rankings mock por artista
const generateArtistRanking = (artistId: string) => {
  const rankings = {
    week: [
      { id: '1', username: 'SuperFan_' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2), hours: 28 + parseInt(artistId), rank: 'gold' as VinylRank },
      { id: '2', username: 'MusicLover' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2 + 1), hours: 24 + parseInt(artistId), rank: 'silver' as VinylRank },
      { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 20 + parseInt(artistId), rank: 'bronze' as VinylRank, isCurrentUser: true },
      { id: '4', username: 'Fan4Ever', avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2 + 2), hours: 18 + parseInt(artistId), rank: 'bronze' as VinylRank },
      { id: '5', username: 'Listener' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2 + 3), hours: 15 + parseInt(artistId), rank: 'bronze' as VinylRank },
    ],
    month: [
      { id: '1', username: 'SuperFan_' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2), hours: 112 + parseInt(artistId) * 4, rank: 'gold' as VinylRank },
      { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 98 + parseInt(artistId) * 4, rank: 'silver' as VinylRank, isCurrentUser: true },
      { id: '3', username: 'MusicLover' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2 + 1), hours: 85 + parseInt(artistId) * 4, rank: 'bronze' as VinylRank },
    ],
    year: [
      { id: '1', username: 'SuperFan_' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2), hours: 1342 + parseInt(artistId) * 20, rank: 'gold' as VinylRank },
      { id: '2', username: 'MusicLover' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2 + 1), hours: 1198 + parseInt(artistId) * 20, rank: 'gold' as VinylRank },
      { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 1067 + parseInt(artistId) * 20, rank: 'silver' as VinylRank, isCurrentUser: true },
    ],
    'all-time': [
      { id: '1', username: 'SuperFan_' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2), hours: 3245 + parseInt(artistId) * 50, rank: 'gold' as VinylRank },
      { id: '2', username: 'MusicLover' + artistId, avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2 + 1), hours: 2876 + parseInt(artistId) * 50, rank: 'gold' as VinylRank },
      { id: '3', username: 'Fan4Ever', avatarUrl: 'https://i.pravatar.cc/100?img=' + (parseInt(artistId) * 2 + 2), hours: 2543 + parseInt(artistId) * 50, rank: 'silver' as VinylRank },
      { id: '4', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 2198 + parseInt(artistId) * 50, rank: 'silver' as VinylRank, isCurrentUser: true },
    ],
  };
  return rankings;
};

// Mock data de rankings por artista
const MOCK_ARTIST_RANKINGS: Record<string, any> = {};

// Mock data - reemplazar con datos reales de la API
const MOCK_RANKINGS = {
  week: [
    { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 42, rank: 'gold' as VinylRank },
    { id: '2', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 38, rank: 'gold' as VinylRank },
    { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 35, rank: 'gold' as VinylRank, isCurrentUser: true },
    { id: '4', username: 'RockStar', avatarUrl: 'https://i.pravatar.cc/100?img=4', hours: 32, rank: 'silver' as VinylRank },
    { id: '5', username: 'PopQueen', avatarUrl: 'https://i.pravatar.cc/100?img=5', hours: 28, rank: 'silver' as VinylRank },
    { id: '6', username: 'JazzMaster', avatarUrl: 'https://i.pravatar.cc/100?img=6', hours: 25, rank: 'bronze' as VinylRank },
    { id: '7', username: 'ReggaeVibes', avatarUrl: 'https://i.pravatar.cc/100?img=7', hours: 22, rank: 'bronze' as VinylRank },
    { id: '8', username: 'EDMAddict', avatarUrl: 'https://i.pravatar.cc/100?img=8', hours: 20, rank: 'bronze' as VinylRank },
  ],
  month: [
    { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 156, rank: 'gold' as VinylRank },
    { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 142, rank: 'silver' as VinylRank, isCurrentUser: true },
    { id: '3', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 138, rank: 'silver' as VinylRank },
  ],
  year: [
    { id: '1', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 1876, rank: 'gold' as VinylRank },
    { id: '2', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 1654, rank: 'gold' as VinylRank },
    { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 1432, rank: 'silver' as VinylRank, isCurrentUser: true },
  ],
  'all-time': [
    { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 5432, rank: 'gold' as VinylRank },
    { id: '2', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 4876, rank: 'gold' as VinylRank },
    { id: '3', username: 'RockStar', avatarUrl: 'https://i.pravatar.cc/100?img=4', hours: 3987, rank: 'silver' as VinylRank },
    { id: '4', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 3456, rank: 'bronze' as VinylRank, isCurrentUser: true },
  ],
};

export default function RankingScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [rankingMode, setRankingMode] = useState<RankingMode>('global');
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [loadingArtists, setLoadingArtists] = useState(false);
  
  // Cargar top artists al montar el componente
  useEffect(() => {
    loadTopArtists();
  }, []);

  const loadTopArtists = async () => {
    try {
      setLoadingArtists(true);
      const artists = await ApiService.getTopArtists(10, 'short_term');
      setTopArtists(artists);
      if (artists.length > 0 && !selectedArtist) {
        setSelectedArtist(artists[0].id);
      }
    } catch (error) {
      console.error('Error loading top artists:', error);
    } finally {
      setLoadingArtists(false);
    }
  };
  
  // Generar ranking de artista dinámicamente si no existe
  if (rankingMode === 'artist' && selectedArtist && !MOCK_ARTIST_RANKINGS[selectedArtist]) {
    MOCK_ARTIST_RANKINGS[selectedArtist] = generateArtistRanking(selectedArtist);
  }
  
  const currentRanking = rankingMode === 'global' 
    ? MOCK_RANKINGS[selectedPeriod]
    : (MOCK_ARTIST_RANKINGS[selectedArtist]?.[selectedPeriod] || []);
  
  const currentUser = currentRanking.find((user: any) => user.isCurrentUser);
  const userRank = currentUser?.rank || 'bronze';
  const selectedArtistData = topArtists.find(a => a.id === selectedArtist);

  return (
    <ThemedView style={styles.container}>
      {/* Header con vinilo */}
      <View style={styles.header}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {rankingMode === 'global' ? 'Ranking Global' : `Ranking: ${selectedArtistData?.name || 'Artista'}`}
        </ThemedText>
        <View style={styles.vinylContainer}>
          <VinylBadge rank={userRank} size="large" />
          <ThemedText style={styles.yourRank}>Tu Rango</ThemedText>
        </View>
      </View>

      {/* Selector de modo */}
      <View style={styles.modeSelector}>
        <Pressable
          style={[styles.modeButton, rankingMode === 'global' && styles.modeButtonActive]}
          onPress={() => setRankingMode('global')}
        >
          <ThemedText style={[styles.modeButtonText, rankingMode === 'global' && styles.modeButtonTextActive]}>
            Global
          </ThemedText>
        </Pressable>
        <Pressable
          style={[styles.modeButton, rankingMode === 'artist' && styles.modeButtonActive]}
          onPress={() => setRankingMode('artist')}
        >
          <ThemedText style={[styles.modeButtonText, rankingMode === 'artist' && styles.modeButtonTextActive]}>
            Por Artista
          </ThemedText>
        </Pressable>
      </View>

      {/* Selector de artista (solo visible en modo artist) */}
      {rankingMode === 'artist' && (
        <View style={styles.artistSelector}>
          {loadingArtists ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={SpotifyColors.green} />
              <ThemedText style={styles.loadingText}>Cargando artistas...</ThemedText>
            </View>
          ) : topArtists.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistList}>
              {topArtists.map((artist) => (
                <Pressable
                  key={artist.id}
                  style={[styles.artistItem, selectedArtist === artist.id && styles.artistItemActive]}
                  onPress={() => setSelectedArtist(artist.id)}
                >
                  <ThemedText style={[styles.artistItemText, selectedArtist === artist.id && styles.artistItemTextActive]}>
                    {artist.name}
                  </ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <ThemedText style={styles.emptyText}>No se encontraron artistas</ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Filtros de periodo */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <FilterButton
            label="Semana"
            isActive={selectedPeriod === 'week'}
            onPress={() => setSelectedPeriod('week')}
          />
          <FilterButton
            label="Mes"
            isActive={selectedPeriod === 'month'}
            onPress={() => setSelectedPeriod('month')}
          />
          <FilterButton
            label="Año"
            isActive={selectedPeriod === 'year'}
            onPress={() => setSelectedPeriod('year')}
          />
          <FilterButton
            label="Histórico"
            isActive={selectedPeriod === 'all-time'}
            onPress={() => setSelectedPeriod('all-time')}
          />
        </ScrollView>
      </View>

      {/* Lista de ranking */}
      <ScrollView style={styles.rankingList} showsVerticalScrollIndicator={false}>
        <View style={styles.rankingContent}>
          {currentRanking.map((user: any, index: number) => (
            <RankingItem
              key={user.id}
              position={index + 1}
              username={user.username}
              avatarUrl={user.avatarUrl}
              hours={user.hours}
              isCurrentUser={user.isCurrentUser}
            />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

interface FilterButtonProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
}

function FilterButton({ label, isActive, onPress }: FilterButtonProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.filterButton,
        isActive && styles.filterButtonActive,
        pressed && styles.filterButtonPressed,
      ]}
      onPress={onPress}
    >
      <ThemedText style={[styles.filterText, isActive && styles.filterTextActive]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpotifyColors.black,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 16,
    backgroundColor: SpotifyColors.darkGray,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 16,
    lineHeight: 34,
    textAlign: 'center',
  },
  vinylContainer: {
    alignItems: 'center',
    gap: 12,
  },
  yourRank: {
    fontSize: 16,
    color: SpotifyColors.lightGray,
    fontWeight: '600',
  },
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: SpotifyColors.mediumGray,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: SpotifyColors.green,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: SpotifyColors.lightGray,
  },
  modeButtonTextActive: {
    color: SpotifyColors.black,
  },
  artistSelector: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  artistList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  artistItem: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 20,
    backgroundColor: SpotifyColors.mediumGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  artistItemActive: {
    backgroundColor: SpotifyColors.darkGray,
    borderColor: SpotifyColors.green,
  },
  artistItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: SpotifyColors.lightGray,
  },
  artistItemTextActive: {
    color: SpotifyColors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  filtersContainer: {
    backgroundColor: SpotifyColors.black,
    paddingVertical: 16,
  },
  filters: {
    paddingHorizontal: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: SpotifyColors.mediumGray,
  },
  filterButtonActive: {
    backgroundColor: SpotifyColors.green,
  },
  filterButtonPressed: {
    opacity: 0.7,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: SpotifyColors.lightGray,
  },
  filterTextActive: {
    color: SpotifyColors.black,
  },
  rankingList: {
    flex: 1,
  },
  rankingContent: {
    padding: 16,
    paddingBottom: 32,
  },
});
