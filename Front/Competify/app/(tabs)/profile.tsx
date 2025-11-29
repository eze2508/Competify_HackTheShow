import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, Pressable, Alert } from 'react-native';
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

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const [user, artists] = await Promise.all([
        ApiService.getCurrentUser(),
        ApiService.getTopArtists(5, 'medium_term').catch(() => []),
      ]);
      
      setUserId(user.id);
      setUserData(user);
      setTopArtists(artists);
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
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

  const displayData = userData || MOCK_USER_DATA;
  const displayArtists = topArtists.length > 0 ? topArtists : MOCK_USER_DATA.topArtists;

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header con avatar y nombre */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={require('@/assets/images/GoldBorder.png')} 
              style={styles.borderImage}
              resizeMode="contain"
            />
            <Image 
              source={{ uri: displayData.avatarUrl }} 
              style={styles.avatar}
            />
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
              label="Horas Totales" 
              value={displayData.totalHours.toLocaleString()}
              icon={statsIcons.music}
              gradient
            />
            <StatsCard 
              label="Este Mes" 
              value={displayData.currentMonthHours}
              icon={statsIcons.calendar}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatsCard 
              label="Esta Semana" 
              value={displayData.currentWeekHours}
              icon={statsIcons.stats}
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
