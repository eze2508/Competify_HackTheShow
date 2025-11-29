import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para manejar el deep linking de autenticación
 * Escucha URLs del tipo: competify://callback?token=JWT_TOKEN
 */
export function useAuthDeepLink() {
  const { login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Manejar URL inicial (cuando la app se abre desde un link)
    const handleInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        handleUrl(initialUrl);
      }
    };

    // Manejar URLs entrantes (cuando la app ya está abierta)
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    handleInitialUrl();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUrl = (url: string) => {
    const { hostname, queryParams } = Linking.parse(url);
    
    // Verificar si es un callback de autenticación
    if (hostname === 'callback' && queryParams?.token) {
      const token = queryParams.token as string;
      login(token).then(() => {
        router.push('/(tabs)/explore');
      });
    }
  };
}
