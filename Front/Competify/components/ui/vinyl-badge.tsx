import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { ThemedText } from '../themed-text';
import { SpotifyColors } from '@/constants/theme';

export type VinylRank = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

interface VinylBadgeProps {
  rank: VinylRank;
  size?: 'small' | 'medium' | 'large';
  hideLabel?: boolean;
}

const vinylImages = {
  bronze: require('@/assets/images/vinilos/bronze.png'),
  silver: require('@/assets/images/vinilos/silver.png'),
  gold: require('@/assets/images/vinilos/gold.png'),
  platinum: require('@/assets/images/vinilos/gold.png'), // Usar gold como fallback
  diamond: require('@/assets/images/vinilos/gold.png'), // Usar gold como fallback
};

export function VinylBadge({ rank, size = 'medium', hideLabel = false }: VinylBadgeProps) {
  const sizeStyles = {
    small: { width: 80, height: 80 },
    medium: { width: 126, height: 126 },
    large: { width: 200, height: 200 },
  };

  const fontSize = {
    small: 10,
    medium: 14,
    large: 20,
  };

  return (
    <View style={styles.container}>
      <Image 
        source={vinylImages[rank]} 
        style={[styles.vinylImage, sizeStyles[size]]}
        resizeMode="contain"
      />
      {!hideLabel && (
        <ThemedText style={[styles.rankText, { fontSize: fontSize[size] }]}>
          {rank.toUpperCase()}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  vinylImage: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  rankText: {
    fontWeight: 'bold',
    color: SpotifyColors.white,
    letterSpacing: 2,
  },
});
