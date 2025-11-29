import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Pressable } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RankingItem } from '@/components/ui/ranking-item';
import { VinylBadge, VinylRank } from '@/components/ui/vinyl-badge';
import { SpotifyColors } from '@/constants/theme';

type TimePeriod = 'week' | 'month' | 'year' | 'all-time';

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
  
  const currentRanking = MOCK_RANKINGS[selectedPeriod];
  const currentUser = currentRanking.find(user => user.isCurrentUser);
  const userRank = currentUser?.rank || 'bronze';

  return (
    <ThemedView style={styles.container}>
      {/* Header con vinilo */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Ranking Global</ThemedText>
        <View style={styles.vinylContainer}>
          <VinylBadge rank={userRank} size="large" />
          <ThemedText style={styles.yourRank}>Tu Rango</ThemedText>
        </View>
      </View>

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
    marginBottom: 24,
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
