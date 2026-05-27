// app/_layout.tsx
import { Stack } from 'expo-router';
import { PlayerProvider } from '../src/contexts/PlayerContext';

export default function RootLayout() {
  return (
    <PlayerProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="medias" options={{ headerShown: false }} />
        <Stack.Screen name="produits" options={{ headerShown: false }} />
        <Stack.Screen name="product-detail" options={{ headerShown: false }} />
        <Stack.Screen name="PlayerScreen" options={{ headerShown: false }} />
        <Stack.Screen name="consultation" options={{ headerShown: false }} />
        {/* Supprimez favoris et profil s'ils n'existent pas */}
      </Stack>
    </PlayerProvider>
  );
}