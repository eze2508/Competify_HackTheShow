import React from 'react';
import { StyleSheet, Image, Pressable, View, Dimensions } from 'react-native';
import { ThemedText } from '../themed-text';
import { SpotifyColors } from '@/constants/theme';

const checkIcon = require('@/assets/images/check.png');

const screenWidth = Dimensions.get('window').width;
const cardWidth = (screenWidth - 48) / 2.5; // Para que entren 2.5 cards

interface ArtistCardProps {
  id: string;
  name: string;
  imageUrl: string;
  genres?: string[];
  followers?: number;
  isTracked?: boolean;
  onToggleTrack?: () => void;
  onPress?: () => void;
}

export function ArtistCard({ name, imageUrl, genres, followers, isTracked = false, onToggleTrack, onPress }: ArtistCardProps) {
  return (
    <View style={styles.wrapper}>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        <Image source={{ uri: imageUrl }} style={styles.image} />
        <View style={styles.info}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {name}
          </ThemedText>
        </View>
      </Pressable>
      
      {onToggleTrack && (
        <Pressable 
          style={[styles.trackButton, isTracked && styles.trackButtonActive]}
          onPress={(e) => {
            e.stopPropagation();
            onToggleTrack();
          }}
        >
          {isTracked ? (
            <Image source={checkIcon} style={styles.checkIcon} />
          ) : (
            <ThemedText style={styles.trackButtonText}>+</ThemedText>
          )}
        </Pressable>
      )}
    </View>
  );
}

function formatFollowers(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

const styles = StyleSheet.create({
  wrapper: {
    width: cardWidth,
    marginRight: 12,
    position: 'relative',
  },
  container: {
    width: '100%',
    backgroundColor: SpotifyColors.black,
    borderRadius: 4,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
  },
  info: {
    padding: 8,
    paddingTop: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: SpotifyColors.white,
  },
  trackButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: SpotifyColors.lightGray,
  },
  trackButtonActive: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  trackButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
  checkIcon: {
    width: 32,
    height: 32,
  },
});
