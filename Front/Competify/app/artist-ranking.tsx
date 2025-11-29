import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { RankingItem } from '@/components/ui/ranking-item';
import { VinylBadge, VinylRank } from '@/components/ui/vinyl-badge';
import { SpotifyColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

type TimePeriod = 'week' | 'month' | 'year' | 'all-time';

// Función para generar rankings mock por artista
const generateArtistRanking = (artistId: string) => {
  const rankings = {
    week: [
      { id: '1', username: 'SuperFan_' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50), hours: 28 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 10), rank: 'gold' as VinylRank },
      { id: '2', username: 'MusicLover' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + ((Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50) + 1), hours: 24 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 10), rank: 'silver' as VinylRank },
      { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 20 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 10), rank: 'bronze' as VinylRank, isCurrentUser: true },
      { id: '4', username: 'Fan4Ever', avatarUrl: 'https://i.pravatar.cc/100?img=' + ((Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50) + 2), hours: 18 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 10), rank: 'bronze' as VinylRank },
      { id: '5', username: 'Listener' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + ((Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50) + 3), hours: 15 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 10), rank: 'bronze' as VinylRank },
    ],
    month: [
      { id: '1', username: 'SuperFan_' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50), hours: 112 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 40), rank: 'gold' as VinylRank },
      { id: '2', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 98 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 40), rank: 'silver' as VinylRank, isCurrentUser: true },
      { id: '3', username: 'MusicLover' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + ((Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50) + 1), hours: 85 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 40), rank: 'bronze' as VinylRank },
    ],
    year: [
      { id: '1', username: 'SuperFan_' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50), hours: 1342 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 200), rank: 'gold' as VinylRank },
      { id: '2', username: 'MusicLover' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + ((Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50) + 1), hours: 1198 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 200), rank: 'gold' as VinylRank },
      { id: '3', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 1067 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 200), rank: 'silver' as VinylRank, isCurrentUser: true },
    ],
    'all-time': [
      { id: '1', username: 'SuperFan_' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50), hours: 3245 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 500), rank: 'gold' as VinylRank },
      { id: '2', username: 'MusicLover' + artistId.slice(0, 5), avatarUrl: 'https://i.pravatar.cc/100?img=' + ((Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50) + 1), hours: 2876 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 500), rank: 'gold' as VinylRank },
      { id: '3', username: 'Fan4Ever', avatarUrl: 'https://i.pravatar.cc/100?img=' + ((Math.abs(parseInt(artistId.slice(0, 8), 36)) % 50) + 2), hours: 2543 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 500), rank: 'silver' as VinylRank },
      { id: '4', username: 'Usuario123', avatarUrl: 'https://i.pravatar.cc/100?img=3', hours: 2198 + (Math.abs(parseInt(artistId.slice(0, 8), 36)) % 500), rank: 'silver' as VinylRank, isCurrentUser: true },
    ],
  };
  return rankings;
};

export default function ArtistRankingScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const artistId = params.id as string;
  const artistName = params.name as string;
  const artistImage = params.image as string;
  
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('week');
  
  // Generar ranking del artista
  const artistRankings = generateArtistRanking(artistId);
  const currentRanking = artistRankings[selectedPeriod];
  
  const currentUser = currentRanking.find((user: any) => user.isCurrentUser);
  const userRank = currentUser?.rank || 'bronze';

  return (
    <ThemedView style={styles.container}>
      {/* Header con botón de volver */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={SpotifyColors.white} />
        </Pressable>
        
        <ThemedText style={styles.title} numberOfLines={2}>
          {artistName}
        </ThemedText>
        
        {/* Imagen del artista y vinilo en fila */}
        <View style={styles.rankingRow}>
          {artistImage && (
            <View style={styles.artistImageContainer}>
              <Image 
                source={{ uri: artistImage }} 
                style={styles.artistImage}
              />
            </View>
          )}
          
          <View style={styles.vinylImageContainer}>
            <VinylBadge rank={userRank} size="medium" hideLabel={true} />
          </View>
        </View>
        
        {/* Texto centrado debajo */}
        <View style={styles.rankInfoContainer}>
          <ThemedText style={styles.rankText}>{userRank.toUpperCase()}</ThemedText>
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
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    textAlign: 'center',
    lineHeight: 34,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 16,
  },
  artistImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: SpotifyColors.green,
  },
  artistImage: {
    width: '100%',
    height: '100%',
  },
  vinylImageContainer: {
    width: 126,
    height: 126,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankInfoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    letterSpacing: 2,
  },
  yourRank: {
    fontSize: 14,
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
