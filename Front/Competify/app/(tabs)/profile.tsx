import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, Pressable, Alert, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { StatsCard } from '@/components/ui/stats-card';
import { VinylBadge, VinylRank } from '@/components/ui/vinyl-badge';
import { SpotifyColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { ApiService } from '@/services/api';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';

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
// Función para obtener el color del borde según el rango
const getRankBorderColor = (rank: VinylRank) => {
  switch (rank) {
    case 'bronze': return '#CD7F32';
    case 'silver': return '#C0C0C0';
    case 'gold': return '#FFD700';
    case 'platinum': return '#E5E4E2';
    case 'diamond': return '#B9F2FF';
    default: return SpotifyColors.green;
  }
};

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
  const { logout } = useAuth();
  const router = useRouter();
  const [userId, setUserId] = useState<string>('');
  const [userData, setUserData] = useState<any>(null);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔵 [Profile] Cargando datos del perfil...');
      const [user, realArtists, spotifyArtists] = await Promise.all([
        ApiService.getCurrentUser(),
        ApiService.getTopArtistsReal().catch(() => []),
        ApiService.getTopArtists(5, 'medium_term').catch(() => []),
      ]);
      
      console.log('🟢 [Profile] Datos recibidos:', JSON.stringify({
        user_id: user.id,
        username: user.username,
        total_hours: user.total_hours ?? user.totalHours,
        total_ms: user.total_ms ?? user.totalMs ?? user.totalMilliseconds,
        current_month_hours: user.current_month_hours ?? user.currentMonthHours,
        current_week_hours: user.current_week_hours ?? user.currentWeekHours,
        total_artists: user.total_artists ?? user.totalArtists,
        rank: user.rank
      }, null, 2));
      
      console.log('🟢 [Profile] Artistas reales:', realArtists.length);
      console.log('🟢 [Profile] Artistas Spotify:', spotifyArtists.length);
      
      setUserId(user.id);
      setUserData(user);
      // Priorizar artistas reales si existen, sino usar Spotify
      setTopArtists(realArtists.length > 0 ? realArtists : spotifyArtists);
    } catch (error) {
      console.error('🔴 [Profile] Error loading profile data:', error);
      Alert.alert('Error', `No se pudo cargar el perfil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔵 [Profile] Refrescando datos del perfil...');
      const [user, realArtists, spotifyArtists] = await Promise.all([
        ApiService.getCurrentUser(),
        ApiService.getTopArtistsReal().catch(() => []),
        ApiService.getTopArtists(5, 'medium_term').catch(() => []),
      ]);
      
      console.log('🟢 [Profile] Datos refrescados:', JSON.stringify({
        total_hours: user.total_hours ?? user.totalHours,
        total_ms: user.total_ms ?? user.totalMs ?? user.totalMilliseconds,
        current_month_hours: user.current_month_hours ?? user.currentMonthHours,
        current_week_hours: user.current_week_hours ?? user.currentWeekHours,
        total_artists: user.total_artists ?? user.totalArtists
      }, null, 2));
      
      setUserId(user.id);
      setUserData(user);
      setTopArtists(realArtists.length > 0 ? realArtists : spotifyArtists);
    } catch (error) {
      console.error('🔴 [Profile] Error refreshing profile data:', error);
      Alert.alert('Error', `No se pudo actualizar el perfil: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const copyUserId = async () => {
    if (userId) {
      await Clipboard.setStringAsync(userId);
      Alert.alert('Copiado', 'Tu ID de usuario fue copiado al portapapeles');
    }
  };

  const handleLogout = async () => {
    await logout();
    // El AuthContext se encargará de redirigir al login
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
    // accept either backend snake_case or ApiService camelCase fields
    totalHours: userData.totalHours ?? userData.total_hours ?? 0,
    total_ms: userData.total_ms ?? userData.totalMs ?? userData.totalMilliseconds ?? 0,
    currentMonthHours: userData.currentMonthHours ?? userData.current_month_hours ?? 0,
    currentWeekHours: userData.currentWeekHours ?? userData.current_week_hours ?? 0,
    totalArtists: userData.totalArtists ?? userData.total_artists ?? 0,
    rank: userData.rank || 'bronze'
  } : MOCK_USER_DATA;
  
  console.log('🟡 [Profile] displayData final:', {
    usando_mock: !userData,
    totalHours: displayData.totalHours,
    total_ms: displayData.total_ms,
    currentMonthHours: displayData.currentMonthHours,
    currentWeekHours: displayData.currentWeekHours,
    totalArtists: displayData.totalArtists
  });
  
  const displayArtists = topArtists.length > 0 ? topArtists : MOCK_USER_DATA.topArtists;

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
        {/* Header con avatar y nombre */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('@/assets/images/GoldBorder.png')} 
              style={styles.borderImage}
              resizeMode="contain"
            />
            {displayData.avatarUrl && !displayData.avatarUrl.includes('pravatar') ? (
              <Image 
                source={{ uri: displayData.avatarUrl }} 
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <ThemedText style={styles.avatarInitial}>
                  {displayData.username.charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}
          </View>
          <ThemedText style={styles.username}>{displayData.username}</ThemedText>
          <ThemedText style={styles.rankText}>{displayData.rank.toUpperCase()}</ThemedText>
          
          {/* User ID Section */}
          {userId && (
            <Pressable onPress={copyUserId} style={styles.userIdContainer}>
              <ThemedText style={styles.userIdLabel}>ID: {userId}</ThemedText>
              <Ionicons name="copy-outline" size={20} color={SpotifyColors.green} />
            </Pressable>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Estadísticas</ThemedText>
          <View style={styles.statsGrid}>
            <StatsCard 
              label="Este Mes" 
              value={displayData.currentMonthHours}
              icon={statsIcons.calendar}
            />
            <StatsCard 
              label="Esta Semana" 
              value={displayData.currentWeekHours}
              icon={statsIcons.stats}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard 
              label="Horas Totales" 
              value={displayData.totalHours}
              icon={statsIcons.music}
            />
            <StatsCard 
              label="Artistas Únicos" 
              value={displayData.totalArtists}
              icon={statsIcons.microphone}
            />
          </View>
        </View>

        {/* Top Artistas */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Artistas Más Escuchados</ThemedText>
          {displayArtists.map((artist, index) => (
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

        {/* Logros */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Logros Recientes</ThemedText>
          <View style={styles.achievementsContainer}>
            <View style={styles.achievement}>
              <Image source={achievementIcons.trophy} style={styles.achievementIcon} />
              <ThemedText style={styles.achievementText}>Top 10{'\n'}del Mes</ThemedText>
            </View>
            <View style={styles.achievement}>
              <Image source={achievementIcons.star} style={styles.achievementIcon} />
              <ThemedText style={styles.achievementText}>100{'\n'}artistas</ThemedText>
            </View>
            <View style={styles.achievement}>
              <Image source={achievementIcons.flame} style={styles.achievementIcon} />
              <ThemedText style={styles.achievementText}>7 días{'\n'}seguidos</ThemedText>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Pressable 
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed
            ]}
            onPress={handleLogout}
          >
            <ThemedText style={styles.logoutButtonText}>Cerrar Sesión</ThemedText>
          </Pressable>
        </View>

        {/* Detailed Time Breakdown */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tiempo Total de Escucha</ThemedText>
          <View style={styles.timeBreakdown}>
            <View style={styles.timeCard}>
              <ThemedText style={styles.timeValue}>
                {Math.floor((displayData.total_ms || displayData.totalHours * 3600000) / (1000 * 60 * 60 * 24))}
              </ThemedText>
              <ThemedText style={styles.timeLabel}>Días</ThemedText>
            </View>
            <View style={styles.timeSeparator}>
              <ThemedText style={styles.timeSeparatorText}>:</ThemedText>
            </View>
            <View style={styles.timeCard}>
              <ThemedText style={styles.timeValue}>
                {Math.floor(((displayData.total_ms || displayData.totalHours * 3600000) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}
              </ThemedText>
              <ThemedText style={styles.timeLabel}>Horas</ThemedText>
            </View>
            <View style={styles.timeSeparator}>
              <ThemedText style={styles.timeSeparatorText}>:</ThemedText>
            </View>
            <View style={styles.timeCard}>
              <ThemedText style={styles.timeValue}>
                {Math.floor(((displayData.total_ms || displayData.totalHours * 3600000) % (1000 * 60 * 60)) / (1000 * 60))}
              </ThemedText>
              <ThemedText style={styles.timeLabel}>Min</ThemedText>
            </View>
            <View style={styles.timeSeparator}>
              <ThemedText style={styles.timeSeparatorText}>:</ThemedText>
            </View>
            <View style={styles.timeCard}>
              <ThemedText style={styles.timeValue}>
                {Math.floor(((displayData.total_ms || displayData.totalHours * 3600000) % (1000 * 60)) / 1000)}
              </ThemedText>
              <ThemedText style={styles.timeLabel}>Seg</ThemedText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: SpotifyColors.darkGray,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 8,
  },
  rankText: {
    fontSize: 14,
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
  timeBreakdown: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  timeCard: {
    alignItems: 'center',
    minWidth: 50,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SpotifyColors.green,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: SpotifyColors.lightGray,
    textTransform: 'uppercase',
  },
  timeSeparator: {
    paddingHorizontal: 4,
  },
  timeSeparatorText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.green,
    opacity: 0.5,
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
    lineHeight: 16,
  },
  logoutButton: {
    backgroundColor: SpotifyColors.mediumGray,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SpotifyColors.lightGray,
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: SpotifyColors.white,
  },
});
