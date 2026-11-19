import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import MediaCard from '../src/components/MediaCard';
import ThemeToggle from '../src/components/ThemeToggle';
import { useNotifications } from '../src/contexts/NotificationContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { useMedias } from '../src/hooks/useMedias';
import { radius, spacing, typography } from '../src/utils/theme';

// Filtres façon YouTube. Les deux derniers mènent vers d'autres écrans.
const CHIPS = [
  { key: 'all', label: 'Tout' },
  { key: 'video', label: 'Vidéos', icon: 'logo-youtube' },
  { key: 'audio', label: 'Audio', icon: 'musical-notes' },
  { key: 'pdf', label: 'Documents', icon: 'document-text' },
  { key: 'temoignages', label: 'Témoignages', icon: 'star', route: '/temoignages' },
  { key: 'downloads', label: 'Téléchargés', icon: 'cloud-download', route: '/OfflineScreen' },
];

export default function MediasScreen() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();
  const [selected, setSelected] = useState('all');

  const { data = [], loading, refreshing, loadingMore, error, refresh, loadMore } = useMedias({ type: selected, limit: 20 });

  const handlePress = useCallback((item) => {
    router.push({ pathname: '/PlayerScreen', params: { slug: item.slug || item.id_media } });
  }, []);

  const onChip = (chip) => {
    if (chip.route) { router.push(chip.route); return; }
    setSelected(chip.key);
  };

  const renderItem = useCallback(({ item }) => <MediaCard item={item} onPress={handlePress} />, [handlePress]);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name={error ? 'cloud-offline-outline' : 'play-circle-outline'} size={34} color={error ? palette.red : palette.green} />
        </View>
        <Text style={styles.emptyTitle}>{error ? 'Vous êtes hors connexion' : 'Aucun média disponible'}</Text>
        <Text style={styles.emptySub}>
          {error ? 'Connectez-vous à Internet pour voir les médias.' : 'Explorez une autre catégorie ou revenez plus tard.'}
        </Text>
        {error ? (
          <TouchableOpacity style={styles.retry} onPress={refresh}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={styles.brand} onPress={() => router.push('/')} activeOpacity={0.8}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandText}>NUFOTEC</Text>
          <Text style={styles.brandSub}>Médias</Text>
        </TouchableOpacity>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/SearchScreen')}>
            <Ionicons name="search-outline" size={22} color={palette.dark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/NotificationsScreen')}>
            <Ionicons name="notifications-outline" size={22} color={palette.dark} />
            {unreadCount > 0 ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text></View>
            ) : null}
          </TouchableOpacity>
          <ThemeToggle inline />
        </View>
      </View>

      <View style={styles.chipsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CHIPS.map((chip) => {
            const active = selected === chip.key;
            return (
              <TouchableOpacity key={chip.key} style={[styles.chip, active && styles.chipActive]} onPress={() => onChip(chip)} activeOpacity={0.8}>
                {chip.icon ? <Ionicons name={chip.icon} size={14} color={active ? palette.white : chip.route ? palette.gold : palette.dark} /> : null}
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item, index) => (item.slug ? String(item.slug) : `idx-${index}`)}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={loadingMore ? <ActivityIndicator style={{ paddingVertical: spacing.xl }} color={palette.green} /> : <View style={{ height: 90 }} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.green} colors={[palette.green]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.sm }}
      />

      {loading && data.length === 0 ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={palette.green} /></View>
      ) : null}

      <BottomNav />
    </View>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm, backgroundColor: p.white,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  logo: { width: 30, height: 30 },
  brandText: { color: p.dark, fontSize: 20, fontWeight: '900', letterSpacing: -0.6 },
  brandSub: { color: p.gold, fontSize: typography.sm, fontWeight: '700', marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  badge: {
    position: 'absolute', top: 5, right: 5, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: p.red, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  chipsBar: { backgroundColor: p.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: p.greyLight },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 14,
    borderRadius: radius.sm, backgroundColor: p.whiteOff,
  },
  chipActive: { backgroundColor: p.dark },
  chipText: { color: p.dark, fontSize: typography.sm + 1, fontWeight: '600' },
  chipTextActive: { color: p.white },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: spacing.xl, gap: spacing.sm },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: p.greenSoft, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { color: p.dark, fontSize: typography.lg, fontWeight: '700', textAlign: 'center' },
  emptySub: { color: p.greyDark, fontSize: typography.sm, textAlign: 'center' },
  retry: { marginTop: spacing.sm, backgroundColor: p.green, paddingHorizontal: 20, paddingVertical: 10, borderRadius: radius.full },
  retryText: { color: '#fff', fontWeight: '700' },
  loading: { ...StyleSheet.absoluteFillObject, top: 120, justifyContent: 'flex-start', paddingTop: 80, alignItems: 'center' },
});
