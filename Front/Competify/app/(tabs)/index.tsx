import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { token } = useLocalSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    // Si hay un token en la URL (callback de Spotify), guardarlo
    if (token && typeof token === 'string') {
      login(token);
    }
  }, [token]);

  // Redirect to artists (explore) as the main screen
  return <Redirect href="/explore" />;
}
