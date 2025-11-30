import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, Pressable, Alert, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatsCard } from '@/components/ui/stats-card';
import { VinylBadge, VinylRank } from '@/components/ui/vinyl-badge';
import { SpotifyColors } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ApiService } from '@/services/api';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

export default function PublicProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userIdParam = params.userId as string;
  // Optional fallback values passed from other screens to avoid an extra fetch delay
  const fallbackUsername = (params.username as string) || (params.display_name as string) || undefined;
  const fallbackAvatar = (params.avatarUrl as string) || (params.avatar_url as string) || undefined;

  const [userId, setUserId] = useState<string>(userIdParam || '');
  // Mock user as requested
  const MOCK_USER_DATA = {
    username: 'Azorin Lopa',
    avatarUrl: 'https://i.pravatar.cc/300?u=azorin-lopa',
    rank: 'gold' as VinylRank,
    totalHours: 123,
    currentMonthHours: 12,
    currentWeekHours: 3,
    totalArtists: 45,
    topArtists: [
      { id: 'a1', name: 'Mock Artist 1', imageUrl: 'https://picsum.photos/200?1', hours: 34 },
      { id: 'a2', name: 'Mock Artist 2', imageUrl: 'https://picsum.photos/200?2', hours: 28 },
      { id: 'a3', name: 'Mock Artist 3', imageUrl: 'https://picsum.photos/200?3', hours: 21 },
    ],
  };

  const [userData, setUserData] = useState<any>(MOCK_USER_DATA);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Instead of fetching, use the mock immediately so the profile opens fast
  useEffect(() => {
    setUserId(userIdParam || '');
    setUserData(MOCK_USER_DATA);
    // no network fetch for the mock
  }, [userIdParam]);

  const loadProfileData = async () => {
    // noop for mock profile (kept for compatibility)
    setUserData(MOCK_USER_DATA);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const copyUserId = async () => {
    if (userId) {
      await Clipboard.setStringAsync(userId);
      Alert.alert('Copiado', 'El ID de usuario fue copiado al portapapeles');
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Cargando...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const displayData = userData ? {
    ...userData,
    username: userData.username || userData.display_name || 'Usuario',
    avatarUrl: userData.avatar_url || userData.avatarUrl || 'https://i.pravatar.cc/300',
    totalHours: userData.totalHours ?? userData.total_hours ?? 0,
    total_ms: userData.total_ms ?? userData.totalMs ?? userData.totalMilliseconds ?? 0,
    currentMonthHours: userData.currentMonthHours ?? userData.current_month_hours ?? 0,
    currentWeekHours: userData.currentWeekHours ?? userData.current_week_hours ?? 0,
    totalArtists: userData.totalArtists ?? userData.total_artists ?? 0,
    rank: userData.rank || 'bronze'
  } : null;
  // If we don't have fetched data yet, use the passed fallback props (username/avatar)
  if (!displayData) {
    const fallback = {
      username: fallbackUsername || 'Usuario',
      avatarUrl: fallbackAvatar || 'https://i.pravatar.cc/300',
      totalHours: 0,
      total_ms: 0,
      currentMonthHours: 0,
      currentWeekHours: 0,
      totalArtists: 0,
      rank: 'bronze' as VinylRank,
    };
    // assign to displayData variable for rendering
    // @ts-ignore
    displayData = fallback;
  }

  const totalMs = displayData ? (displayData.total_ms || displayData.totalHours * 3600000) : 0;
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));

  const displayArtists = topArtists.length > 0 ? topArtists : [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={SpotifyColors.green}
            colors={[SpotifyColors.green]}
            progressBackgroundColor={SpotifyColors.darkGray}
          />
        }
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={SpotifyColors.white} />
          </Pressable>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={styles.avatarContainer}>
              <Image 
                source={require('@/assets/images/GoldBorder.png')} 
                style={styles.borderImage}
                resizeMode="contain"
              />
              {displayData?.avatarUrl && !displayData.avatarUrl.includes('pravatar') ? (
                <Image 
                  source={{ uri: displayData.avatarUrl }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <ThemedText style={styles.avatarInitial}>
                    {displayData?.username?.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.username}>{displayData?.username}</ThemedText>
            <ThemedText style={styles.rankText}>{(displayData?.rank || '').toUpperCase()}</ThemedText>
            {userId && (
              <Pressable onPress={copyUserId} style={styles.userIdContainer}>
                <ThemedText style={styles.userIdLabel}>ID: {userId}</ThemedText>
                <Ionicons name="copy-outline" size={20} color={SpotifyColors.green} />
              </Pressable>
            )}
          </View>

          <View style={{ width: 24 }} />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Estadísticas</ThemedText>
          <View style={styles.statsGrid}>
            <StatsCard 
              label="Este Mes" 
              value={displayData?.currentMonthHours}
              icon={require('@/assets/images/calendar.png')}
            />
            <StatsCard 
              label="Esta Semana" 
              value={displayData?.currentWeekHours}
              icon={require('@/assets/images/stats.png')}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard 
              label="Horas Totales" 
              value={displayData?.totalHours}
              icon={require('@/assets/images/music.png')}
            />
            <StatsCard 
              label="Artistas Únicos" 
              value={displayData?.totalArtists}
              icon={require('@/assets/images/microphone.png')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Artistas Más Escuchados</ThemedText>
          {displayArtists.map((artist: any, index: number) => (
            <View key={artist.id} style={styles.artistItem}>
              <View style={styles.artistLeft}>
                <ThemedText style={styles.artistRank}>#{index + 1}</ThemedText>
                <Image 
                  source={{ uri: artist.imageUrl || artist.image_url || 'https://picsum.photos/200' }} 
                  style={styles.artistImage} 
                />
                <ThemedText style={styles.artistName}>{artist.name}</ThemedText>
              </View>
              <View style={styles.artistRight}>
                <ThemedText style={styles.artistHours}>
                  {artist.hours ? `${artist.hours}h` : ''}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpotifyColors.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: SpotifyColors.darkGray,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  borderImage: {
    width: 400,
    height: 400,
    position: 'absolute',
    zIndex: 2,
    top: -170,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    zIndex: 1,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: SpotifyColors.green,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    overflow: 'visible',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    lineHeight: 52,
    textAlign: 'center',
    includeFontPadding: false,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: SpotifyColors.lightGray,
    letterSpacing: 2,
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SpotifyColors.mediumGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    gap: 8,
  },
  userIdLabel: {
    fontSize: 12,
    color: SpotifyColors.lightGray,
    fontFamily: 'monospace',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  artistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  artistRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: SpotifyColors.lightGray,
    width: 28,
  },
  artistImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  artistName: {
    fontSize: 14,
    fontWeight: '600',
    color: SpotifyColors.white,
    flex: 1,
  },
  artistRight: {
    alignItems: 'flex-end',
  },
  artistHours: {
    fontSize: 14,
    fontWeight: 'bold',
    color: SpotifyColors.green,
  },
});
