import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { ThemedText } from '../themed-text';
import { SpotifyColors } from '@/constants/theme';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: string | number; // string para emoji, number para require()
  gradient?: boolean;
}

export function StatsCard({ label, value, icon, gradient }: StatsCardProps) {
  return (
    <View style={[styles.container, gradient && styles.gradientBorder]}>
      <View style={styles.content}>
        {icon && (
          typeof icon === 'string' ? (
            <ThemedText style={styles.iconText}>{icon}</ThemedText>
          ) : (
            <Image source={icon} style={styles.iconImage} />
          )
        )}
        <ThemedText style={styles.value}>{value}</ThemedText>
        <ThemedText style={styles.label}>{label}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SpotifyColors.mediumGray,
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: 150,
  },
  gradientBorder: {
    borderWidth: 2,
    borderColor: SpotifyColors.green,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconText: {
    fontSize: 32,
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
  label: {
    fontSize: 12,
    color: SpotifyColors.lightGray,
    textAlign: 'center',
  },
});
