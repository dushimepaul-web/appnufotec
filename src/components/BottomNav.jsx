// src/components/BottomNav.jsx
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../utils/theme';

export default function BottomNav() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const navItems = [
    { name: 'Accueil',      icon: 'home',          route: '/' },
    { name: 'Médias',       icon: 'play-circle',   route: '/medias' },
    { name: 'Consultation', icon: 'calendar',      route: '/consultation' },
    { name: 'Produits',     icon: 'cube',          route: '/produits' },
    { name: 'Téléchargés',  icon: 'cloud-offline', route: '/OfflineScreen' }, // ← Remplace Profil
  ];

  const isActive = (route) => {
    if (route === '/') return pathname === '/';
    return pathname === route;
  };

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom || 8 }]}>
      {navItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.navItem}
          onPress={() => router.push(item.route)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isActive(item.route) ? item.icon : `${item.icon}-outline`}
            size={24}
            color={isActive(item.route) ? '#4CAF50' : colors.textSub}
          />
          <View style={[
            styles.navIndicator,
            isActive(item.route) && styles.navIndicatorActive,
          ]} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  navIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  navIndicatorActive: {
    backgroundColor: '#4CAF50',
    width: 20,
  },
});