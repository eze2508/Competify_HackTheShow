import React from 'react';
import { StyleSheet, View, Pressable, Linking, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SpotifyColors } from '@/constants/theme';
import { ApiService } from '@/services/api';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const loginUrl = ApiService.getLoginUrl();
      const canOpen = await Linking.canOpenURL(loginUrl);
      
      if (canOpen) {
        await Linking.openURL(loginUrl);
      } else {
        console.error('Cannot open URL:', loginUrl);
      }
    } catch (error) {
      console.error('Error opening login URL:', error);
    }
  };

  const handleManualToken = () => {
    router.push('/token-input');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Logo / Title */}
        <View style={styles.logoContainer}>
          <ThemedText style={styles.title}>Competify</ThemedText>
          <ThemedText style={styles.subtitle}>
            Compite con tus amigos
          </ThemedText>
          <ThemedText style={styles.description}>
            ¿Quién escucha más música?
          </ThemedText>
        </View>

        {/* Vinyl illustration */}
        <View style={styles.vinylContainer}>
          <View style={styles.vinylCircle}>
            <View style={styles.vinylInner} />
          </View>
        </View>

        {/* Login Button */}
        <Pressable 
          style={({ pressed }) => [
            styles.loginButton,
            pressed && styles.loginButtonPressed
          ]}
          onPress={handleLogin}
        >
          <Image 
            source={require('@/assets/images/spotify.png')}
            style={styles.spotifyLogo}
            resizeMode="contain"
          />
          <ThemedText style={styles.loginButtonText}>
            Iniciar sesión con Spotify
          </ThemedText>
        </Pressable>

        {/* Manual Token Button for Expo Go */}
        <Pressable 
          style={({ pressed }) => [
            styles.manualButton,
            pressed && styles.manualButtonPressed
          ]}
          onPress={handleManualToken}
        >
          <ThemedText style={styles.manualButtonText}>
            Pegar token manualmente (Expo Go)
          </ThemedText>
        </Pressable>

        <ThemedText style={styles.footer}>
          Necesitas una cuenta de Spotify para continuar
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpotifyColors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: SpotifyColors.green,
    marginBottom: 8,
    lineHeight: 56,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: SpotifyColors.white,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
  vinylContainer: {
    marginBottom: 60,
  },
  vinylCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: SpotifyColors.black,
    borderWidth: 3,
    borderColor: SpotifyColors.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vinylInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: SpotifyColors.darkGray,
    borderWidth: 2,
    borderColor: SpotifyColors.green,
  },
  loginButton: {
    backgroundColor: SpotifyColors.black,
    borderWidth: 2,
    borderColor: SpotifyColors.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 350,
  },
  loginButtonPressed: {
    opacity: 0.8,
  },
  spotifyLogo: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SpotifyColors.white,
  },
  footer: {
    fontSize: 12,
    color: SpotifyColors.lightGray,
    textAlign: 'center',
  },
  manualButton: {
    backgroundColor: SpotifyColors.black,
    borderWidth: 2,
    borderColor: SpotifyColors.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 16,
    width: '100%',
    maxWidth: 350,
  },
  manualButtonPressed: {
    opacity: 0.6,
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SpotifyColors.green,
    textAlign: 'center',
  },
});
