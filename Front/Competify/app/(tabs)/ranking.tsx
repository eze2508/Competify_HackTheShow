import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RankingItem } from '@/components/ui/ranking-item';
import { VinylBadge, VinylRank } from '@/components/ui/vinyl-badge';
import { SpotifyColors } from '@/constants/theme';

type TimePeriod = 'week' | 'month' | 'year' | 'all-time';
type RankingMode = 'global' | 'artist';

// Mock data de artistas populares
const POPULAR_ARTISTS = [
  { id: '1', name: 'Taylor Swift', imageUrl: 'https://picsum.photos/200' },
  { id: '2', name: 'Bad Bunny', imageUrl: 'https://picsum.photos/201' },
  { id: '3', name: 'The Weeknd', imageUrl: 'https://picsum.photos/202' },
  { id: '4', name: 'Drake', imageUrl: 'https://picsum.photos/203' },
];

// Mock data de rankings por artista
const MOCK_ARTIST_RANKINGS: Record<string, any> = {
  '1': {
    week: [
      { id: '1', username: 'SwiftieForever', avatarUrl: 'https://i.pravatar.cc/100?img=11', hours: 28, rank: 'platinum' as VinylRank },
      { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 24, rank: 'gold' as VinylRank, isCurrentUser: true },
      { id: '3', username: 'PopLover', avatarUrl: 'https://i.pravatar.cc/100?img=12', hours: 20, rank: 'gold' as VinylRank },
    ],
  },
  '2': {
    week: [
      { id: '1', username: 'LatinVibes', avatarUrl: 'https://i.pravatar.cc/100?img=13', hours: 32, rank: 'platinum' as VinylRank },
      { id: '2', username: 'ReggaetonFan', avatarUrl: 'https://i.pravatar.cc/100?img=14', hours: 28, rank: 'gold' as VinylRank },
      { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 15, rank: 'silver' as VinylRank, isCurrentUser: true },
    ],
  },
};

// Mock data - reemplazar con datos reales de la API
const MOCK_RANKINGS = {
  week: [
    { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 42, rank: 'platinum' as VinylRank },
    { id: '2', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 38, rank: 'gold' as VinylRank },
    { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 35, rank: 'gold' as VinylRank, isCurrentUser: true },
    { id: '4', username: 'RockStar', avatarUrl: 'https://i.pravatar.cc/100?img=4', hours: 32, rank: 'silver' as VinylRank },
    { id: '5', username: 'PopQueen', avatarUrl: 'https://i.pravatar.cc/100?img=5', hours: 28, rank: 'silver' as VinylRank },
    { id: '6', username: 'JazzMaster', avatarUrl: 'https://i.pravatar.cc/100?img=6', hours: 25, rank: 'bronze' as VinylRank },
    { id: '7', username: 'ReggaeVibes', avatarUrl: 'https://i.pravatar.cc/100?img=7', hours: 22, rank: 'bronze' as VinylRank },
    { id: '8', username: 'EDMAddict', avatarUrl: 'https://i.pravatar.cc/100?img=8', hours: 20, rank: 'bronze' as VinylRank },
  ],
  month: [
    { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 156, rank: 'diamond' as VinylRank },
    { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 142, rank: 'platinum' as VinylRank, isCurrentUser: true },
    { id: '3', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 138, rank: 'platinum' as VinylRank },
  ],
  year: [
    { id: '1', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 1876, rank: 'diamond' as VinylRank },
    { id: '2', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 1654, rank: 'diamond' as VinylRank },
    { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 1432, rank: 'platinum' as VinylRank, isCurrentUser: true },
  ],
  'all-time': [
    { id: '1', username: 'MusicLover99', avatarUrl: 'https://i.pravatar.cc/100?img=1', hours: 5432, rank: 'diamond' as VinylRank },
    { id: '2', username: 'SpotifyFan', avatarUrl: 'https://i.pravatar.cc/100?img=2', hours: 4876, rank: 'diamond' as VinylRank },
    { id: '3', username: 'RockStar', avatarUrl: 'https://i.pravatar.cc/100?img=4', hours: 3987, rank: 'diamond' as VinylRank },
    { id: '4', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 3456, rank: 'platinum' as VinylRank, isCurrentUser: true },
  ],
};

export default function RankingScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  const [rankingMode, setRankingMode] = useState<RankingMode>('global');
  const [selectedArtist, setSelectedArtist] = useState<string>(POPULAR_ARTISTS[0].id);
  
  const currentRanking = rankingMode === 'global' 
    ? MOCK_RANKINGS[selectedPeriod]
    : (MOCK_ARTIST_RANKINGS[selectedArtist]?.[selectedPeriod] || MOCK_ARTIST_RANKINGS[selectedArtist]?.week || []);
  
  const currentUser = currentRanking.find((user: any) => user.isCurrentUser);
  const userRank = currentUser?.rank || 'bronze';
  const selectedArtistData = POPULAR_ARTISTS.find(a => a.id === selectedArtist);

  return (
    <ThemedView style={styles.container}>
      {/* Header con vinilo */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.artistList}>
            {POPULAR_ARTISTS.map((artist) => (
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
          {currentRanking.map((user, index) => (
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
    backgroundColor: SpotifyColors.darkGray,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 16,
    lineHeight: 34,
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
    paddingVertical: 16,
  },
  artistList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  artistItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: SpotifyColors.mediumGray,
  },
  artistItemActive: {
    backgroundColor: SpotifyColors.darkGray,
    borderWidth: 2,
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
