import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav';
import { useSettings } from '../src/contexts/SettingsContext';
import { useOfflineMedia } from '../src/hooks/useOfflineMedia';
import { radius, spacing, typography } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';

const typeIcon = (type) => {
  switch (type) {
    case 'audio': return 'musical-notes';
    case 'video': return 'film';
    case 'pdf': return 'document-text';
    default: return 'play-circle';
  }
};

function OfflineCard({ item, onPlay, onDelete }) {
  const { palette } = useTheme();
  const styles = useMemo(() => cs(palette), [palette]);
  const typeColor = (type) => {
    switch (type) {
      case 'audio': return palette.gold;
      case 'video': return palette.green;
      case 'pdf': return palette.red;
      default: return palette.green;
    }
  };
  const date = new Date(item.downloadedAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const sizeText = item.size
    ? item.size < 1024 * 1024
      ? `${(item.size / 1024).toFixed(0)} Ko`
      : `${(item.size / (1024 * 1024)).toFixed(1)} Mo`
    : '';
  const color = typeColor(item.type);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPlay(item)} activeOpacity={0.75}>
      <View style={styles.cardThumb}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <View style={[styles.cardThumbOverlay, { backgroundColor: `${color}15` }]}>
          <Ionicons name={typeIcon(item.type)} size={26} color={color} />
        </View>
      </View>
      <View style={styles.cardInfo}>
        <View style={[styles.cardTypePill, { backgroundColor: `${color}12` }]}>
          <Ionicons name={typeIcon(item.type)} size={10} color={color} />
          <Text style={[styles.cardTypeText, { color }]}>{item.type?.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
        {item.credits ? <Text style={styles.cardSub} numberOfLines={1}>{item.credits}</Text> : null}
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={11} color={palette.grey} />
          <Text style={styles.cardMetaText}>{date}</Text>
          {sizeText ? (
            <>
              <View style={[styles.dot, { backgroundColor: palette.grey }]} />
              <Ionicons name="save-outline" size={11} color={palette.grey} />
              <Text style={styles.cardMetaText}>{sizeText}</Text>
            </>
          ) : null}
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={palette.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function OfflineScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const s = useSettings().offline;
  const styles = useMemo(() => cs(palette), [palette]);
  const { offlineList, totalSizeFormatted, removeOfflineMedia, clearAllOffline, initialized } = useOfflineMedia();

  const handlePlay = useCallback((item) => {
    router.push({ pathname: '/PlayerScreen', params: { id: item.id_media, offline: '1' } });
  }, []);

  const handleDelete = useCallback((item) => {
    Alert.alert(s.delete_title, `Voulez-vous supprimer "${item.titre}" de vos médias hors-ligne ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeOfflineMedia(item.id_media) },
    ]);
  }, [removeOfflineMedia]);

  const handleClearAll = useCallback(() => {
    if (offlineList.length === 0) return;
    Alert.alert(s.clear_all, `Supprimer les ${offlineList.length} médias téléchargés (${totalSizeFormatted}) ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: s.clear_all, style: 'destructive', onPress: clearAllOffline },
    ]);
  }, [offlineList.length, totalSizeFormatted, clearAllOffline]);

  const ListHeader = () => (
    <View style={styles.listHeader}>
      {offlineList.length > 0 ? (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{offlineList.length}</Text>
            <Text style={styles.statLabel}>médias</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalSizeFormatted}</Text>
            <Text style={styles.statLabel}>stockage</Text>
          </View>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll}>
            <Ionicons name="trash" size={14} color={palette.red} />
            <Text style={styles.clearBtnText}>{s.clear_all}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const Empty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cloud-offline-outline" size={42} color={palette.grey} />
      </View>
      <Text style={styles.emptyTitle}>{s.empty_title}</Text>
      <Text style={styles.emptyText}>{s.empty_text}</Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={16} color={palette.white} />
        <Text style={styles.emptyBtnText}>{s.empty_button}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={palette.dark} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <View style={styles.topIconBox}>
            <Ionicons name="cloud-download" size={18} color={palette.green} />
          </View>
          <Text style={styles.topTitle}>{s.title}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={offlineList}
        keyExtractor={(item) => String(item.id_media)}
        renderItem={({ item }) => (
          <OfflineCard item={item} onPlay={handlePlay} onDelete={handleDelete} />
        )}
        ListHeaderComponent={<ListHeader />}
        ListEmptyComponent={initialized ? <Empty /> : null}
        contentContainerStyle={offlineList.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <BottomNav />
    </View>
  );
}

const cs = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: p.greyLight,
    backgroundColor: p.white,
  },
  backCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: p.whiteOff, borderWidth: 1, borderColor: p.greyLight,
    justifyContent: 'center', alignItems: 'center',
  },
  topTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  topIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: `${p.green}10`, justifyContent: 'center', alignItems: 'center' },
  topTitle: { color: p.dark, fontSize: typography.base, fontWeight: '700' },

  listHeader: { paddingHorizontal: spacing.base, paddingTop: spacing.md },
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: p.whiteOff, borderRadius: radius.md,
    borderWidth: 1, borderColor: p.greyLight,
    padding: spacing.md, marginBottom: spacing.md, gap: spacing.md,
  },
  statBox: { alignItems: 'center' },
  statValue: { color: p.dark, fontSize: typography.lg, fontWeight: '800' },
  statLabel: { color: p.grey, fontSize: typography.xs },
  statDivider: { width: 1, height: 28, backgroundColor: p.greyLight },
  clearBtn: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: p.redSoft,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radius.sm,
  },
  clearBtnText: { color: p.red, fontSize: typography.xs, fontWeight: '700' },

  listContent: { paddingHorizontal: spacing.base, paddingBottom: 80 },
  emptyContainer: { flex: 1 },
  separator: { height: spacing.sm },

  card: {
    flexDirection: 'row', backgroundColor: p.white,
    borderRadius: radius.md, borderWidth: 1, borderColor: p.greyLight,
    overflow: 'hidden', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardThumb: { width: 80, height: 80, backgroundColor: p.whiteOff, overflow: 'hidden' },
  cardThumbOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flex: 1, padding: spacing.sm, gap: 4 },
  cardTypePill: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  cardTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { color: p.dark, fontSize: typography.sm, fontWeight: '700', lineHeight: 18 },
  cardSub: { color: p.greyDark, fontSize: typography.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardMetaText: { color: p.grey, fontSize: 10 },
  dot: { width: 3, height: 3, borderRadius: 2 },
  deleteBtn: { padding: spacing.md, alignSelf: 'stretch', justifyContent: 'center' },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, paddingTop: 60,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: p.whiteOff, borderWidth: 1, borderColor: p.greyLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
  },
  emptyTitle: { color: p.dark, fontSize: typography.xl, fontWeight: '800', marginBottom: spacing.sm, textAlign: 'center' },
  emptyText: { color: p.greyDark, fontSize: typography.sm, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: p.green, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: radius.full, shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  emptyBtnText: { color: p.white, fontWeight: '700', fontSize: typography.sm },
});
