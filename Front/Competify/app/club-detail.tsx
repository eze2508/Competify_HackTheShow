import { StyleSheet, ScrollView, View, Pressable, TextInput, Alert, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { ClubMember, ClubMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'chat' | 'members';

export default function ClubDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const clubId = params.clubId as string;
  const clubName = params.clubName as string;

  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messageText, setMessageText] = useState('');

  const loadClubData = useCallback(async () => {
    try {
      setLoading(true);
      const [membersData, messagesData] = await Promise.all([
        ApiService.getClubMembers(clubId),
        ApiService.getClubMessages(clubId),
      ]);

      setMembers(membersData.members || []);
      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error('Error loading club data:', error);
      Alert.alert('Error', 'No se pudo cargar la información del club');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadClubData();
    
    // Auto-refresh messages every 5 seconds when on chat tab
    const interval = setInterval(() => {
      if (activeTab === 'chat') {
        loadMessages();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeTab, clubId]);

  const loadMessages = async () => {
    try {
      const messagesData = await ApiService.getClubMessages(clubId);
      setMessages(messagesData.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClubData();
    setRefreshing(false);
  }, [loadClubData]);

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    const tempMessage = messageText;
    setMessageText('');

    try {
      await ApiService.sendClubMessage(clubId, tempMessage);
      await loadMessages();
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje');
      setMessageText(tempMessage);
    }
  };

  const renderMembers = () => {
    if (members.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={SpotifyColors.lightGray} />
          <ThemedText style={styles.emptyText}>No hay miembros</ThemedText>
        </View>
      );
    }

    return members.map((member) => (
      <View key={member.user_id} style={styles.memberCard}>
        <View style={styles.memberInfo}>
          <Ionicons name="person-circle-outline" size={40} color={SpotifyColors.green} />
          <View style={styles.memberDetails}>
            <ThemedText style={styles.memberName}>{member.username}</ThemedText>
            <ThemedText style={styles.memberDate}>
              Desde {new Date(member.joined_at).toLocaleDateString()}
            </ThemedText>
          </View>
        </View>
      </View>
    ));
  };

  const renderChat = () => {
    if (messages.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={SpotifyColors.lightGray} />
          <ThemedText style={styles.emptyText}>No hay mensajes aún</ThemedText>
          <ThemedText style={styles.emptySubtext}>Sé el primero en escribir</ThemedText>
        </View>
      );
    }

    return messages.map((message) => (
      <View key={message.id} style={styles.messageCard}>
        <View style={styles.messageHeader}>
          <ThemedText style={styles.messageSender}>{message.username}</ThemedText>
          <ThemedText style={styles.messageTime}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </ThemedText>
        </View>
        <ThemedText style={styles.messageText}>{message.message}</ThemedText>
      </View>
    ));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={SpotifyColors.white} />
          </Pressable>
          <ThemedText style={styles.title}>{clubName}</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            onPress={() => setActiveTab('chat')}
            style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
          >
            <ThemedText style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
              Chat
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('members')}
            style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          >
            <ThemedText style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
              Miembros ({members.length})
            </ThemedText>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onContentSizeChange={() => {
            if (activeTab === 'chat') {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }
          }}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ThemedText>Cargando...</ThemedText>
            </View>
          ) : (
            <>
              {activeTab === 'members' && renderMembers()}
              {activeTab === 'chat' && renderChat()}
            </>
          )}
        </ScrollView>

        {/* Message Input (only show in chat tab) */}
        {activeTab === 'chat' && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={SpotifyColors.lightGray}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
            />
            <Pressable onPress={handleSendMessage} style={styles.sendButton}>
              <Ionicons name="send" size={20} color="#fff" />
            </Pressable>
          </View>
        )}
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpotifyColors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SpotifyColors.white,
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
  contentContainer: {
    paddingBottom: 20,
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
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  memberCard: {
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: SpotifyColors.white,
    marginBottom: 4,
  },
  memberDate: {
    fontSize: 12,
    color: SpotifyColors.lightGray,
  },
  messageCard: {
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 14,
    fontWeight: '600',
    color: SpotifyColors.green,
  },
  messageTime: {
    fontSize: 11,
    color: SpotifyColors.lightGray,
  },
  messageText: {
    fontSize: 14,
    color: SpotifyColors.white,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: SpotifyColors.mediumGray,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: SpotifyColors.black,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: SpotifyColors.white,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: SpotifyColors.green,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
