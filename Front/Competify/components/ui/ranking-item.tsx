import React from 'react';
import { StyleSheet, View, Image, Pressable } from 'react-native';
import { ThemedText } from '../themed-text';
import { SpotifyColors } from '@/constants/theme';

interface RankingItemProps {
  position: number;
  username: string;
  avatarUrl?: string;
  hours: number;
  isCurrentUser?: boolean;
  onPress?: () => void;
}

export function RankingItem({ position, username, avatarUrl, hours, isCurrentUser, onPress }: RankingItemProps) {
  const getMedalEmoji = (pos: number) => {
    switch (pos) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isCurrentUser && styles.currentUser,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.leftSection}>
        <View style={styles.positionContainer}>
          {getMedalEmoji(position) ? (
            <ThemedText style={styles.medal}>{getMedalEmoji(position)}</ThemedText>
          ) : (
            <ThemedText style={styles.position}>#{position}</ThemedText>
          )}
        </View>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <ThemedText style={styles.avatarText}>
              {username.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
        <View style={styles.userInfo}>
          <ThemedText style={styles.username} numberOfLines={1}>
            {username}
          </ThemedText>
          {isCurrentUser && (
            <ThemedText style={styles.youBadge}>Tú</ThemedText>
          )}
        </View>
      </View>
      <View style={styles.rightSection}>
        <ThemedText style={styles.hours}>{hours.toLocaleString()}h</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
  },
  currentUser: {
    backgroundColor: SpotifyColors.darkGray,
    borderWidth: 2,
    borderColor: SpotifyColors.green,
  },
  pressed: {
    opacity: 0.7,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  positionContainer: {
    width: 28,
    alignItems: 'center',
  },
  position: {
    fontSize: 14,
    fontWeight: 'bold',
    color: SpotifyColors.lightGray,
  },
  medal: {
    fontSize: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: SpotifyColors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: SpotifyColors.white,
    flex: 1,
  },
  youBadge: {
    fontSize: 11,
    color: SpotifyColors.green,
    fontWeight: 'bold',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  hours: {
    fontSize: 18,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
});
