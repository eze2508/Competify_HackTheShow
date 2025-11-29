import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { SpotifyColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TabIcon = ({ source, focused }: { source: any; focused: boolean }) => (
  <Image
    source={source}
    style={{
      width: 28,
      height: 28,
      tintColor: focused ? SpotifyColors.green : SpotifyColors.lightGray,
    }}
    resizeMode="contain"
  />
);

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: SpotifyColors.green,
        tabBarInactiveTintColor: SpotifyColors.lightGray,
        tabBarStyle: {
          backgroundColor: SpotifyColors.black,
          borderTopColor: SpotifyColors.darkGray,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 12,
          height: 68,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Artists',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/album.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/loupe.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/podio.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/escuchar-musica.png')} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          href: null, // Hide from tabs
        }}
      />
    </Tabs>
  );
}
