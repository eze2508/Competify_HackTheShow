import React, { useState } from 'react';
import { StyleSheet, View, TextInput, Pressable, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SpotifyColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';

export default function TokenInputScreen() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!token.trim()) {
      Alert.alert('Error', 'Por favor ingresa un token válido');
      return;
    }

    try {
      setLoading(true);
      await login(token.trim());
      router.replace('/(tabs)/explore');
    } catch (error) {
      Alert.alert('Error', 'Token inválido. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ThemedText style={styles.title}>Pegar Token</ThemedText>
        <ThemedText style={styles.subtitle}>
          Copia el token desde el navegador y pégalo aquí
        </ThemedText>

        <TextInput
          style={styles.input}
          value={token}
          onChangeText={setToken}
          placeholder="Pega tu token aquí..."
          placeholderTextColor={SpotifyColors.lightGray}
          multiline
          numberOfLines={4}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Pressable
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.submitButtonPressed,
            loading && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <ThemedText style={styles.submitButtonText}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </ThemedText>
        </Pressable>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ThemedText style={styles.backButtonText}>Volver</ThemedText>
        </Pressable>
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
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: SpotifyColors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    backgroundColor: SpotifyColors.darkGray,
    borderRadius: 8,
    padding: 16,
    color: SpotifyColors.white,
    fontSize: 14,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: SpotifyColors.mediumGray,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: SpotifyColors.green,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonPressed: {
    opacity: 0.8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: SpotifyColors.black,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 14,
    color: SpotifyColors.lightGray,
  },
});
