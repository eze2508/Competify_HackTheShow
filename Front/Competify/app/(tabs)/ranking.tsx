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

// Función para generar rankings mock por artista (igual probabilidad para bronze/silver/gold)
const generateArtistRanking = (artistId: string) => {
  const hash = Math.abs(parseInt(artistId) || 1);

  function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const ranks: VinylRank[] = ['bronze', 'silver', 'gold'];

  const generateUsers = (count: number, baseHours: number, hourVariation: number, currentUserPosition: number, seed: number) => {
    const users: any[] = [];
    const rng = mulberry32(hash + seed);
    for (let i = 1; i <= count; i++) {
      const isCurrentUser = i === currentUserPosition;
      const hours = baseHours - (i - 1) * 2 + (hash % hourVariation);
      // Rank aleatorio con igual probabilidad, determinístico por seed
      const randomRank = ranks[Math.floor(rng() * ranks.length)];

      users.push({
        id: String(i),
        username: isCurrentUser ? 'Usuario123' : `User${hash % 100}_${i}`,
        avatarUrl: `https://i.pravatar.cc/100?img=${(hash + i) % 70}`,
        hours: Math.max(1, hours),
        rank: randomRank,
        isCurrentUser: isCurrentUser
      });
    }
    return users;
  };

  const rankings = {
    week: generateUsers(20, 35, 15, 3, 1),
    month: generateUsers(20, 140, 40, 5, 2),
    year: generateUsers(20, 1500, 200, 7, 3),
    'all-time': generateUsers(20, 3500, 500, 10, 4),
  };
  return rankings;
};

// Mock data de rankings por artista
const MOCK_ARTIST_RANKINGS: Record<string, any> = {};

// Función auxiliar para generar rankings globales (igual probabilidad para bronze/silver/gold)
const generateGlobalRanking = () => {
  function mulberry32(a: number) {
    return function() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const ranks: VinylRank[] = ['bronze', 'silver', 'gold'];

  const generateUsers = (count: number, baseHours: number, currentUserPosition: number, seed: number) => {
    const users: any[] = [];
    const rng = mulberry32(seed);
    for (let i = 1; i <= count; i++) {
      const isCurrentUser = i === currentUserPosition;
      const hours = baseHours - (i - 1) * 2;
      const randomRank = ranks[Math.floor(rng() * ranks.length)];

      users.push({
        id: String(i),
        username: isCurrentUser ? 'Usuario123' : `User${i}`,
        avatarUrl: `https://i.pravatar.cc/100?img=${i}`,
        hours: Math.max(1, hours),
        rank: randomRank,
        isCurrentUser: isCurrentUser
      });
    }
    return users;
  };

  return {
    week: generateUsers(20, 45, 3, 1),
    month: generateUsers(20, 170, 5, 2),
    year: generateUsers(20, 1900, 7, 3),
    'all-time': generateUsers(20, 5500, 10, 4),
  };
};

// Mock data - reemplazar con datos reales de la API
const MOCK_RANKINGS = generateGlobalRanking();

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
