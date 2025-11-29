import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useAuthDeepLink } from '@/hooks/use-auth-deep-link';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Escuchar deep links de autenticación
  useAuthDeepLink();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inLogin = segments[0] === 'login';
    const inTokenInput = segments[0] === 'token-input';
    const inArtistRanking = segments[0] === 'artist-ranking';
    const inClubDetail = segments[0] === 'club-detail';

    if (!isAuthenticated) {
      // Si no está autenticado, debe ir al login o token-input
      if (!inLogin && !inTokenInput) {
        router.replace('/login');
      }
    } else {
      // Si está autenticado, debe ir a la app
      // Permitir artist-ranking y club-detail como pantallas válidas cuando está autenticado
      if (inLogin || inTokenInput) {
        router.replace('/(tabs)/explore');
      } else if (!inAuthGroup && !inArtistRanking && !inClubDetail) {
        router.replace('/(tabs)/explore');
      }
    }
  }, [isAuthenticated, segments, isLoading]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="token-input" options={{ headerShown: false }} />
        <Stack.Screen name="artist-ranking" options={{ headerShown: false }} />
        <Stack.Screen name="club-detail" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
