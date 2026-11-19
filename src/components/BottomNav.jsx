import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const NAV_ITEMS = [
  { name: 'Accueil', icon: 'home', route: '/' },
  { name: 'Médias', icon: 'play-circle', route: '/medias' },
  { name: 'Consultation', icon: 'calendar', route: '/consultation' },
  { name: 'Produits', icon: 'cube', route: '/produits' },
  { name: 'A propos', icon: 'information-circle', route: '/profile' },
];

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);

  const isActive = (route) => {
    if (route === '/') return pathname === '/';
    return pathname === route;
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 6 }]}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.route);
        return (
          <TouchableOpacity
            key={item.route}
            style={styles.item}
            onPress={() => router.push(item.route)}
            activeOpacity={0.6}
          >
            <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
              <Ionicons
                name={active ? item.icon : `${item.icon}-outline`}
                size={22}
                color={active ? palette.white : palette.grey}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = (p) => StyleSheet.create({
  container: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingTop: 8, backgroundColor: p.white,
    borderTopWidth: 1, borderTopColor: p.greyLight,
  },
  item: { alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8, gap: 2 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  iconWrapActive: { backgroundColor: p.green },
  label: { fontSize: 10, fontWeight: '600', color: p.grey },
  labelActive: { color: p.green, fontWeight: '700' },
});
