import { StyleSheet, ScrollView, View, Text, Pressable, TextInput, Alert, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { FriendRequest, Friend } from '@/types';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'friends' | 'received' | 'sent';

export default function FriendsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [friendsData, receivedData, sentData] = await Promise.all([
        ApiService.getFriendsList(),
        ApiService.getReceivedRequests(),
        ApiService.getSentRequests(),
      ]);

      setFriends(friendsData.friends || []);
      setReceivedRequests(receivedData.requests || []);
      setSentRequests(sentData.requests || []);
    } catch (error) {
      console.error('Error loading friends data:', error);
      Alert.alert('Error', 'No se pudo cargar la información de amigos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleSendRequest = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Ingresa el ID de usuario');
      return;
    }

    try {
      await ApiService.sendFriendRequest(searchQuery.trim());
      Alert.alert('Éxito', 'Solicitud enviada');
      setSearchQuery('');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await ApiService.acceptFriendRequest(requestId);
      Alert.alert('Éxito', 'Solicitud aceptada');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo aceptar la solicitud');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await ApiService.rejectFriendRequest(requestId);
      Alert.alert('Éxito', 'Solicitud rechazada');
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo rechazar la solicitud');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await ApiService.cancelFriendRequest(requestId);
      Alert.alert('Éxito', 'Solicitud cancelada');
      await loadData();
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
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el amigo');
            }
          },
        },
      ]
    );
  };

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
      <View key={friend.user_id} style={styles.friendCard}>
        <View style={styles.friendInfo}>
          <ThemedText style={styles.friendName}>{friend.username}</ThemedText>
          {friend.hours !== undefined && (
            <ThemedText style={styles.friendHours}>{friend.hours.toFixed(0)} horas</ThemedText>
          )}
        </View>
        <Pressable
          onPress={() => handleRemoveFriend(friend.user_id, friend.username)}
          style={styles.removeButton}
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
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestInfo}>
          <ThemedText style={styles.requestName}>
            {request.from_user_data?.username || request.from_user}
          </ThemedText>
          <ThemedText style={styles.requestDate}>
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
      <View key={request.id} style={styles.requestCard}>
        <View style={styles.requestInfo}>
          <ThemedText style={styles.requestName}>
            {request.to_user_data?.username || request.to_user}
          </ThemedText>
          <ThemedText style={styles.requestDate}>
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

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>Amigos</ThemedText>
      </View>

      {/* Search/Add Friend */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="ID de usuario"
          placeholderTextColor={SpotifyColors.lightGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Pressable onPress={handleSendRequest} style={styles.sendButton}>
          <Ionicons name="person-add" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab('friends')}
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        >
          <ThemedText style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            Amigos ({friends.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('received')}
          style={[styles.tab, activeTab === 'received' && styles.activeTab]}
        >
          <ThemedText style={[styles.tabText, activeTab === 'received' && styles.activeTabText]}>
            Recibidas ({receivedRequests.length})
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('sent')}
          style={[styles.tab, activeTab === 'sent' && styles.activeTab]}
        >
          <ThemedText style={[styles.tabText, activeTab === 'sent' && styles.activeTabText]}>
            Enviadas ({sentRequests.length})
          </ThemedText>
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Cargando...</ThemedText>
          </View>
        ) : (
          <>
            {activeTab === 'friends' && renderFriendsList()}
            {activeTab === 'received' && renderReceivedRequests()}
            {activeTab === 'sent' && renderSentRequests()}
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
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
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: SpotifyColors.white,
    marginBottom: 4,
  },
  friendHours: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  removeButton: {
    padding: 8,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: SpotifyColors.white,
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: SpotifyColors.lightGray,
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
});
