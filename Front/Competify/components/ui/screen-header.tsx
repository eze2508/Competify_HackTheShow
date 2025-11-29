import React from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { ThemedText } from '../themed-text';
import { SpotifyColors } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: {
    icon: string;
    onPress: () => void;
  };
}

export function ScreenHeader({ title, subtitle, rightAction }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
      </View>
      {rightAction && (
        <Pressable
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
          onPress={rightAction.onPress}
        >
          <ThemedText style={styles.actionIcon}>{rightAction.icon}</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: SpotifyColors.darkGray,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
  subtitle: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
    marginTop: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SpotifyColors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  actionIcon: {
    fontSize: 20,
  },
});
