import React from 'react';
import { StyleSheet, ScrollView, View, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatsCard } from '@/components/ui/stats-card';
import { VinylBadge, VinylRank } from '@/components/ui/vinyl-badge';
import { SpotifyColors } from '@/constants/theme';

const achievementIcons = {
  trophy: require('@/assets/images/trophy.png'),
  flame: require('@/assets/images/flame.png'),
  star: require('@/assets/images/star.png'),
};

const statsIcons = {
  music: require('@/assets/images/music.png'),
  calendar: require('@/assets/images/calendar.png'),
  stats: require('@/assets/images/stats.png'),
  microphone: require('@/assets/images/microphone.png'),
};

// Mock data - reemplazar con datos reales de la API
const MOCK_USER_DATA = {
  username: 'Usuario123',
  avatarUrl: 'https://i.pravatar.cc/300',
  rank: 'gold' as VinylRank,
  totalHours: 1234,
  currentMonthHours: 87,
  currentWeekHours: 23,
  totalArtists: 156,
  topArtists: [
    { id: '1', name: 'Taylor Swift', imageUrl: 'https://picsum.photos/200', hours: 245 },
    { id: '2', name: 'The Weeknd', imageUrl: 'https://picsum.photos/201', hours: 198 },
    { id: '3', name: 'Bad Bunny', imageUrl: 'https://picsum.photos/202', hours: 176 },
    { id: '4', name: 'Drake', imageUrl: 'https://picsum.photos/203', hours: 154 },
    { id: '5', name: 'Rosalía', imageUrl: 'https://picsum.photos/204', hours: 132 },
  ],
};

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con avatar y nombre */}
        <View style={styles.header}>
          <Image 
            source={{ uri: MOCK_USER_DATA.avatarUrl }} 
            style={styles.avatar}
          />
          <ThemedText style={styles.username}>{MOCK_USER_DATA.username}</ThemedText>
          <View style={styles.vinylContainer}>
            <VinylBadge rank={MOCK_USER_DATA.rank} size="medium" />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Estadísticas</ThemedText>
          <View style={styles.statsGrid}>
            <StatsCard 
              label="Horas Totales" 
              value={MOCK_USER_DATA.totalHours.toLocaleString()}
              icon={statsIcons.music}
              gradient
            />
            <StatsCard 
              label="Este Mes" 
              value={MOCK_USER_DATA.currentMonthHours}
              icon={statsIcons.calendar}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard 
              label="Esta Semana" 
              value={MOCK_USER_DATA.currentWeekHours}
              icon={statsIcons.stats}
            />
            <StatsCard 
              label="Artistas Únicos" 
              value={MOCK_USER_DATA.totalArtists}
              icon={statsIcons.microphone}
            />
          </View>
        </View>

        {/* Top Artistas */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Artistas Más Escuchados</ThemedText>
          {MOCK_USER_DATA.topArtists.map((artist, index) => (
            <View key={artist.id} style={styles.artistItem}>
              <View style={styles.artistLeft}>
                <ThemedText style={styles.artistRank}>#{index + 1}</ThemedText>
                <Image source={{ uri: artist.imageUrl }} style={styles.artistImage} />
                <ThemedText style={styles.artistName}>{artist.name}</ThemedText>
              </View>
              <View style={styles.artistRight}>
                <ThemedText style={styles.artistHours}>{artist.hours}h</ThemedText>
              </View>
            </View>
          ))}
        </View>

        {/* Logros */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Logros Recientes</ThemedText>
          <View style={styles.achievementsContainer}>
            <View style={styles.achievement}>
              <Image source={achievementIcons.trophy} style={styles.achievementIcon} />
              <ThemedText style={styles.achievementText}>Top 10 del Mes</ThemedText>
            </View>
            <View style={styles.achievement}>
              <Image source={achievementIcons.flame} style={styles.achievementIcon} />
              <ThemedText style={styles.achievementText}>7 días seguidos</ThemedText>
            </View>
            <View style={styles.achievement}>
              <Image source={achievementIcons.star} style={styles.achievementIcon} />
              <ThemedText style={styles.achievementText}>100 artistas</ThemedText>
            </View>
          </View>
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
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: SpotifyColors.darkGray,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: SpotifyColors.green,
  },
  username: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 16,
  },
  vinylContainer: {
    marginTop: 8,
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
  achievementsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  achievement: {
    flex: 1,
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  achievementIcon: {
    width: 32,
    height: 32,
  },
  achievementText: {
    fontSize: 12,
    color: SpotifyColors.white,
    textAlign: 'center',
    fontWeight: '600',
  },
});
