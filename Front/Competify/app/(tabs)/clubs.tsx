import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Alert, RefreshControl, FlatList } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { Club } from '@/types';
import { Ionicons } from '@expo/vector-icons';

export default function ClubsScreen() {
  const router = useRouter();
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [searchResults, setSearchResults] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createClubName, setCreateClubName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadMyClubs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiService.getUserClubs();
      setMyClubs(data.clubs || []);
    } catch (error) {
      console.error('Error loading clubs:', error);
      Alert.alert('Error', 'No se pudo cargar los clubes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyClubs();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMyClubs();
    setRefreshing(false);
  }, [loadMyClubs]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await ApiService.searchClubs(searchQuery);
      setSearchResults(data.clubs || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo buscar clubes');
    }
  };

  const handleCreateClub = async () => {
    if (!createClubName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el club');
      return;
    }

    try {
      await ApiService.createClub(createClubName.trim());
      Alert.alert('Éxito', 'Club creado');
      setCreateClubName('');
      setShowCreateModal(false);
      await loadMyClubs();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear el club');
    }
  };

  const handleJoinClub = async (clubId: string, clubName: string) => {
    Alert.alert(
      'Unirse al club',
      `¿Quieres unirte a ${clubName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Unirse',
          onPress: async () => {
            try {
              await ApiService.joinClub(clubId);
              Alert.alert('Éxito', 'Te has unido al club');
              await loadMyClubs();
              setSearchResults([]);
              setSearchQuery('');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo unirse al club');
            }
          },
        },
      ]
    );
  };

  const handleLeaveClub = async (clubId: string, clubName: string) => {
    Alert.alert(
      'Salir del club',
      `¿Estás seguro de salir de ${clubName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.leaveClub(clubId);
              Alert.alert('Éxito', 'Has salido del club');
              await loadMyClubs();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo salir del club');
            }
          },
        },
      ]
    );
  };

  const handleOpenClub = (clubId: string, clubName: string) => {
    router.push({
      pathname: '/club-detail',
      params: { clubId, clubName },
    });
  };

  const renderClubCard = (club: Club, isMember: boolean) => (
    <Pressable
      key={club.id}
      style={styles.clubCard}
      onPress={() => isMember && handleOpenClub(club.id, club.name)}
    >
      <View style={styles.clubInfo}>
        <View style={styles.clubHeader}>
          <Ionicons name="people" size={24} color={SpotifyColors.green} />
          <ThemedText style={styles.clubName}>{club.name}</ThemedText>
        </View>
        <ThemedText style={styles.clubMembers}>
          {club.cantidad_de_miembros || 0} miembros
        </ThemedText>
      </View>
      {isMember ? (
        <View style={styles.clubActions}>
          <Pressable
            onPress={() => handleOpenClub(club.id, club.name)}
            style={styles.openButton}
          >
            <Ionicons name="chevron-forward" size={20} color={SpotifyColors.white} />
          </Pressable>
          <Pressable
            onPress={() => handleLeaveClub(club.id, club.name)}
            style={styles.leaveButton}
          >
            <Ionicons name="exit-outline" size={20} color="#E22134" />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => handleJoinClub(club.id, club.name)}
          style={styles.joinButton}
        >
          <ThemedText style={styles.joinButtonText}>Unirse</ThemedText>
        </Pressable>
      )}
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Clubes</ThemedText>
        <Pressable onPress={() => setShowCreateModal(true)} style={styles.createButton}>
          <Ionicons name="add-circle" size={32} color={SpotifyColors.green} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar clubes..."
          placeholderTextColor={SpotifyColors.lightGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <Pressable onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Create Club Modal */}
      {showCreateModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ThemedText style={styles.modalTitle}>Crear Club</ThemedText>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre del club"
              placeholderTextColor={SpotifyColors.lightGray}
              value={createClubName}
              onChangeText={setCreateClubName}
            />
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => {
                  setShowCreateModal(false);
                  setCreateClubName('');
                }}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <ThemedText style={styles.modalButtonText}>Cancelar</ThemedText>
              </Pressable>
              <Pressable onPress={handleCreateClub} style={[styles.modalButton, styles.confirmButton]}>
                <ThemedText style={styles.modalButtonText}>Crear</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Resultados de búsqueda</ThemedText>
            {searchResults.map((club) => renderClubCard(club, false))}
          </View>
        )}

        {/* My Clubs */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Mis Clubes ({myClubs.length})</ThemedText>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText>Cargando...</ThemedText>
            </View>
          ) : myClubs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={SpotifyColors.lightGray} />
              <ThemedText style={styles.emptyText}>No estás en ningún club</ThemedText>
              <ThemedText style={styles.emptySubtext}>Busca clubes o crea uno nuevo</ThemedText>
            </View>
          ) : (
            myClubs.map((club) => renderClubCard(club, true))
          )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
  createButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: SpotifyColors.white,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: SpotifyColors.green,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 16,
    padding: 24,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: SpotifyColors.black,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: SpotifyColors.white,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: SpotifyColors.lightGray,
  },
  confirmButton: {
    backgroundColor: SpotifyColors.green,
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: SpotifyColors.white,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: SpotifyColors.lightGray,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  clubInfo: {
    flex: 1,
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
    color: SpotifyColors.white,
  },
  clubMembers: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
    marginLeft: 36,
  },
  clubActions: {
    flexDirection: 'row',
    gap: 8,
  },
  openButton: {
    padding: 8,
  },
  leaveButton: {
    padding: 8,
  },
  joinButton: {
    backgroundColor: SpotifyColors.green,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
