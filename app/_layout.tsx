// app/_layout.tsx
import { useRouter, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationProvider, useNotifications } from '../src/contexts/NotificationContext';
import { PlayerProvider } from '../src/contexts/PlayerContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import ErrorBoundary from '../src/components/ErrorBoundary';

import ThemeToggle from '../src/components/ThemeToggle';
import { registerForPushNotifications, sendTokenToServer, setupNotificationListeners } from '../src/services/notifications';
import { getStoredAuth } from '../src/services/auth';

function NotifInit() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    (async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          const auth = await getStoredAuth();
          await sendTokenToServer(token, auth?.user?.id ?? auth?.user?.id_user ?? null);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => setupNotificationListeners(
    (notification: any) => {
      const data = notification.request.content.data || {};
      addNotification({
        type: data.type || 'update',
        title: notification.request.content.title || 'Notification',
        description: notification.request.content.body || '',
        route: data.route || '/',
      });
    },
    (response: any) => {
      const data = response.notification.request.content.data || {};
      const route = data.route || '/';
      router.push(route as any);
    }
  ), [addNotification, router]);

  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <SettingsProvider>
          <PlayerProvider>
            <ThemeProvider>
              <NotificationProvider>
                <NetworkProvider>
                    <NotifInit />
                    <ThemeToggle />
                    <Stack>
                      <Stack.Screen name="index" options={{ headerShown: false }} />
                      <Stack.Screen name="medias" options={{ headerShown: false }} />
                      <Stack.Screen name="produits" options={{ headerShown: false }} />
                      <Stack.Screen name="product-detail" options={{ headerShown: false }} />
                      <Stack.Screen name="PlayerScreen" options={{ headerShown: false }} />
                      <Stack.Screen name="consultation" options={{ headerShown: false }} />
                      <Stack.Screen name="SearchScreen" options={{ headerShown: false }} />
                      <Stack.Screen name="OfflineScreen" options={{ headerShown: false }} />
                      <Stack.Screen name="ExploreScreen" options={{ headerShown: false }} />
                      <Stack.Screen name="LibraryScreen" options={{ headerShown: false }} />
                      <Stack.Screen name="temoignages" options={{ headerShown: false }} />
                      <Stack.Screen name="login" options={{ headerShown: false }} />
                      <Stack.Screen name="NotificationsScreen" options={{ headerShown: false }} />
                      <Stack.Screen name="profile" options={{ headerShown: false }} />
                    </Stack>
                </NetworkProvider>
              </NotificationProvider>
            </ThemeProvider>
          </PlayerProvider>
        </SettingsProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
