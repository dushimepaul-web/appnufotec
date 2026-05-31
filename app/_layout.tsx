// app/_layout.tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayerProvider } from '../src/contexts/PlayerContext';
import { SettingsProvider } from '../src/contexts/SettingsContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { NetworkProvider } from '../src/contexts/NetworkContext';
import ThemeToggle from '../src/components/ThemeToggle';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
    <SettingsProvider>
    <PlayerProvider>
    <ThemeProvider>
    <NetworkProvider>
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
      </Stack>
    </NetworkProvider>
    </ThemeProvider>
    </PlayerProvider>
    </SettingsProvider>
    </SafeAreaProvider>
  );
}