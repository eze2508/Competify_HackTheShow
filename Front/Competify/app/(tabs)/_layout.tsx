import { Tabs } from 'expo-router';
import React from 'react';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { SpotifyColors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TabIcon = ({ source, focused, size = 28 }: { source: any; focused: boolean; size?: number }) => (
  <Image
    source={source}
    style={{
      width: size,
      height: size,
      tintColor: focused ? SpotifyColors.green : SpotifyColors.lightGray,
      marginBottom: 4,
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
            <TabIcon source={require('@/assets/images/loupe.png')} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ focused }) => (
            <TabIcon source={require('@/assets/images/podio.png')} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ focused }) => (
            <Ionicons 
              name="people-outline" 
              size={28} 
              color={focused ? SpotifyColors.green : SpotifyColors.lightGray}
              style={{ marginBottom: 4 }}
            />
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
      <Tabs.Screen
        name="friends"
        options={{
          href: null, // Hide from tabs (replaced by social)
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          href: null, // Hide from tabs (replaced by social)
        }}
      />
    </Tabs>
  );
}
