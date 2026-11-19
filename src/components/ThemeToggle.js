import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing } from '../utils/theme';

// Écrans dont le coin supérieur droit contient déjà des boutons : le bouton
// flottant les recouvrait (avatar du Header, bouton téléchargements du lecteur,
// « Tout lire », champ de recherche…). Le Header affiche sa propre version.
const HIDDEN_ON = ['/medias', '/produits', '/product-detail', '/PlayerScreen', '/ExploreScreen', '/LibraryScreen', '/NotificationsScreen', '/SearchScreen'];

export default function ThemeToggle({ inline = false }) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isDark, palette, toggleTheme } = useTheme();
  const [anim] = useState(() => new Animated.Value(isDark ? 1 : 0));

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isDark, anim]);

  if (!inline && HIDDEN_ON.includes(pathname)) return null;

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        inline ? styles.inline : { position: 'absolute', right: spacing.base, zIndex: 9999, top: insets.top + 8 },
        { backgroundColor: palette.white, borderColor: palette.greyLight },
      ]}
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={isDark ? palette.gold : palette.greyDark} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38, height: 38, borderRadius: radius.full,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
  inline: { width: 32, height: 32, shadowOpacity: 0, elevation: 0, marginLeft: 4 },
});
