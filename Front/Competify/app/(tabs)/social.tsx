import { StyleSheet, ScrollView, View, Pressable, TextInput, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { FriendRequest, Friend, Club } from '@/types';
import { Ionicons } from '@expo/vector-icons';

type SocialMode = 'friends' | 'clubs';
type FriendsTab = 'friends' | 'received' | 'sent';

export default function SocialScreen() {
  const router = useRouter();
  
  // Mode selector
  const [mode, setMode] = useState<SocialMode>('friends');
  
  // Friends state
  const [friendsTab, setFriendsTab] = useState<FriendsTab>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  
  // Clubs state
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [searchResults, setSearchResults] = useState<Club[]>([]);
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [createClubName, setCreateClubName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFriendsData = useCallback(async () => {
    try {
      setLoading(true);
      const [friendsData, receivedData, sentData] = await Promise.all([
        ApiService.getFriendsList().catch(() => ({ friends: [] })),
        ApiService.getReceivedRequests().catch(() => ({ requests: [] })),
        ApiService.getSentRequests().catch(() => ({ requests: [] })),
      ]);

      setFriends(friendsData.friends || []);
      setReceivedRequests(receivedData.requests || []);
      setSentRequests(sentData.requests || []);
    } catch (error) {
      console.error('Error loading friends data:', error);
      // Silenciar el error y usar datos vacíos como fallback
      setFriends([]);
      setReceivedRequests([]);
      setSentRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadClubsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ApiService.getUserClubs().catch(() => ({ clubs: [] }));
      setMyClubs(data.clubs || []);
    } catch (error) {
      console.error('Error loading clubs:', error);
      // Silenciar el error y usar datos vacíos como fallback
      setMyClubs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'friends') {
      loadFriendsData();
    } else {
      loadClubsData();
    }
  }, [mode]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (mode === 'friends') {
      await loadFriendsData();
    } else {
      await loadClubsData();
    }
    setRefreshing(false);
  }, [mode, loadFriendsData, loadClubsData]);

  // Friends handlers
  const handleSendFriendRequest = async () => {
    if (!friendSearchQuery.trim()) {
      Alert.alert('Error', 'Ingresa el ID de usuario');
      return;
    }

    try {
      await ApiService.sendFriendRequest(friendSearchQuery.trim());
      Alert.alert('Éxito', 'Solicitud enviada');
      setFriendSearchQuery('');
      await loadFriendsData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await ApiService.acceptFriendRequest(requestId);
      Alert.alert('Éxito', 'Solicitud aceptada');
      await loadFriendsData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo aceptar la solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await ApiService.rejectFriendRequest(requestId);
      Alert.alert('Éxito', 'Solicitud rechazada');
      await loadFriendsData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo rechazar la solicitud');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await ApiService.cancelFriendRequest(requestId);
      Alert.alert('Éxito', 'Solicitud cancelada');
      await loadFriendsData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo cancelar la solicitud');
    }
  };

  const handleRemoveFriend = async (friendUserId: string, username: string) => {
    Alert.alert(
      'Eliminar amigo',
      `¿Estás seguro de eliminar a ${username}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.removeFriend(friendUserId);
              Alert.alert('Éxito', 'Amigo eliminado');
              await loadFriendsData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el amigo');
            }
          },
        },
      ]
    );
  };

  // Clubs handlers
  const handleSearchClubs = async () => {
    if (!clubSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const data = await ApiService.searchClubs(clubSearchQuery);
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
      await loadClubsData();
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
              await loadClubsData();
              setSearchResults([]);
              setClubSearchQuery('');
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
              await loadClubsData();
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

  // Render functions
  const renderFriendsList = () => {
    if (friends.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={SpotifyColors.lightGray} />
          <ThemedText style={styles.emptyText}>No tienes amigos aún</ThemedText>
        </View>
      );
    }

    return friends.map((friend) => (
      <View key={friend.user_id} style={styles.card}>
        <View style={styles.cardInfo}>
          <ThemedText style={styles.cardName}>{friend.username}</ThemedText>
          {friend.hours !== undefined && (
            <ThemedText style={styles.cardSubtext}>{friend.hours.toFixed(0)} horas</ThemedText>
          )}
        </View>
        <Pressable
          onPress={() => handleRemoveFriend(friend.user_id, friend.username)}
          style={styles.iconButton}
        >
          <Ionicons name="trash-outline" size={20} color="#E22134" />
        </Pressable>
      </View>
    ));
  };

  const renderReceivedRequests = () => {
    if (receivedRequests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="mail-outline" size={48} color={SpotifyColors.lightGray} />
          <ThemedText style={styles.emptyText}>No tienes solicitudes pendientes</ThemedText>
        </View>
      );
    }

    return receivedRequests.map((request) => (
      <View key={request.id} style={styles.card}>
        <View style={styles.cardInfo}>
          <ThemedText style={styles.cardName}>
            {request.from_user_spotify_id || request.from_user_id || 'Usuario'}
          </ThemedText>
          <ThemedText style={styles.cardDate}>
            {new Date(request.created_at).toLocaleDateString()}
          </ThemedText>
        </View>
        <View style={styles.requestActions}>
          <Pressable
            onPress={() => handleAcceptRequest(request.id)}
            style={[styles.actionButton, styles.acceptButton]}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => handleRejectRequest(request.id)}
            style={[styles.actionButton, styles.rejectButton]}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    ));
  };

  const renderSentRequests = () => {
    if (sentRequests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="paper-plane-outline" size={48} color={SpotifyColors.lightGray} />
          <ThemedText style={styles.emptyText}>No has enviado solicitudes</ThemedText>
        </View>
      );
    }

    return sentRequests.map((request) => (
      <View key={request.id} style={styles.card}>
        <View style={styles.cardInfo}>
          <ThemedText style={styles.cardName}>
            {request.to_user_spotify_id || request.to_user_id || 'Usuario'}
          </ThemedText>
          <ThemedText style={styles.cardDate}>
            {new Date(request.created_at).toLocaleDateString()}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => handleCancelRequest(request.id)}
          style={[styles.actionButton, styles.cancelButton]}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>
      </View>
    ));
  };

  const renderClubCard = (club: Club, isMember: boolean) => (
    <Pressable
      key={club.id}
      style={styles.card}
      onPress={() => isMember && handleOpenClub(club.id, club.name)}
    >
      <View style={styles.cardInfo}>
        <View style={styles.clubHeader}>
          <Ionicons name="people" size={24} color={SpotifyColors.green} />
          <ThemedText style={styles.cardName}>{club.name}</ThemedText>
        </View>
        <ThemedText style={styles.clubMembers}>
          {club.cantidad_de_miembros || 0} miembros
        </ThemedText>
      </View>
      {isMember ? (
        <View style={styles.clubActions}>
          <Pressable
            onPress={() => handleOpenClub(club.id, club.name)}
            style={styles.iconButton}
          >
            <Ionicons name="chevron-forward" size={20} color={SpotifyColors.white} />
          </Pressable>
          <Pressable
            onPress={() => handleLeaveClub(club.id, club.name)}
            style={styles.iconButton}
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
        <ThemedText style={styles.title}>Social</ThemedText>
        <Pressable 
          onPress={() => mode === 'clubs' && setShowCreateModal(true)} 
          style={styles.createButton}
          disabled={mode !== 'clubs'}
        >
          {mode === 'clubs' ? (
            <Ionicons name="add-circle" size={32} color={SpotifyColors.green} />
          ) : (
            <View style={{ width: 32, height: 32 }} />
          )}
        </Pressable>
      </View>

      {/* Mode Selector */}
      <View style={styles.modeSelector}>
        <Pressable
          onPress={() => setMode('friends')}
          style={[styles.modeButton, mode === 'friends' && styles.modeButtonActive]}
        >
          <ThemedText style={[styles.modeButtonText, mode === 'friends' && styles.modeButtonTextActive]}>
            Amigos
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setMode('clubs')}
          style={[styles.modeButton, mode === 'clubs' && styles.modeButtonActive]}
        >
          <ThemedText style={[styles.modeButtonText, mode === 'clubs' && styles.modeButtonTextActive]}>
            Clubes
          </ThemedText>
        </Pressable>
      </View>

      {/* Search/Add Section */}
      {mode === 'friends' ? (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="ID de usuario"
            placeholderTextColor={SpotifyColors.lightGray}
            value={friendSearchQuery}
            onChangeText={setFriendSearchQuery}
          />
          <Pressable onPress={handleSendFriendRequest} style={styles.sendButton}>
            <Ionicons name="person-add" size={20} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar clubes..."
            placeholderTextColor={SpotifyColors.lightGray}
            value={clubSearchQuery}
            onChangeText={setClubSearchQuery}
            onSubmitEditing={handleSearchClubs}
          />
          <Pressable onPress={handleSearchClubs} style={styles.sendButton}>
            <Ionicons name="search" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* Sub-tabs for Friends */}
      {mode === 'friends' && (
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setFriendsTab('friends')}
            style={[styles.tab, friendsTab === 'friends' && styles.activeTab]}
          >
            <ThemedText style={[styles.tabText, friendsTab === 'friends' && styles.activeTabText]}>
              Amigos ({friends.length})
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setFriendsTab('received')}
            style={[styles.tab, friendsTab === 'received' && styles.activeTab]}
          >
            <ThemedText style={[styles.tabText, friendsTab === 'received' && styles.activeTabText]}>
              Recibidas ({receivedRequests.length})
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setFriendsTab('sent')}
            style={[styles.tab, friendsTab === 'sent' && styles.activeTab]}
          >
            <ThemedText style={[styles.tabText, friendsTab === 'sent' && styles.activeTabText]}>
              Enviadas ({sentRequests.length})
            </ThemedText>
          </Pressable>
        </View>
      )}

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
                style={[styles.modalButton, styles.cancelModalButton]}
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

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Cargando...</ThemedText>
          </View>
        ) : mode === 'friends' ? (
          <>
            {friendsTab === 'friends' && renderFriendsList()}
            {friendsTab === 'received' && renderReceivedRequests()}
            {friendsTab === 'sent' && renderSentRequests()}
          </>
        ) : (
          <>
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
              {myClubs.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={48} color={SpotifyColors.lightGray} />
                  <ThemedText style={styles.emptyText}>No estás en ningún club</ThemedText>
                  <ThemedText style={styles.emptySubtext}>Busca clubes o crea uno nuevo</ThemedText>
                </View>
              ) : (
                myClubs.map((club) => renderClubCard(club, true))
              )}
            </View>
          </>
        )}
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
  modeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: SpotifyColors.mediumGray,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: SpotifyColors.green,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: SpotifyColors.lightGray,
  },
  modeButtonTextActive: {
    color: SpotifyColors.white,
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
  sendButton: {
    backgroundColor: SpotifyColors.green,
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: SpotifyColors.green,
  },
  tabText: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  activeTabText: {
    color: SpotifyColors.green,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: SpotifyColors.white,
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  cardDate: {
    fontSize: 12,
    color: SpotifyColors.lightGray,
  },
  iconButton: {
    padding: 8,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#1DB954',
  },
  rejectButton: {
    backgroundColor: '#E22134',
  },
  cancelButton: {
    backgroundColor: '#E22134',
  },
  clubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: SpotifyColors.white,
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
  cancelModalButton: {
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
});
