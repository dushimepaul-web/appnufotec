// app/OfflineScreen.js
// ─────────────────────────────────────────────────────────────────
// Page qui liste tous les médias téléchargés et permet de les jouer
// sans connexion internet
// ─────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback } from 'react';
import {
    Alert,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../src/components/BottomNav'; // ← AJOUT IMPORT MANQUANT

import { useOfflineMedia } from '../src/hooks/useOfflineMedia';
import { colors, radius, shadow, spacing, typography } from '../src/utils/theme';

// ─── Icône selon le type de média ────────────────────────────
const typeIcon = (type) => {
  switch (type) {
    case 'audio': return 'musical-notes';
    case 'video': return 'film';
    case 'pdf':   return 'document-text';
    default:      return 'play-circle';
  }
};

const typeColor = (type) => {
  switch (type) {
    case 'audio': return '#A78BFA';
    case 'video': return '#34D399';
    case 'pdf':   return '#FB923C';
    default:      return colors.accent;
  }
};

// ─── Carte d'un média hors-ligne ──────────────────────────────
function OfflineCard({ item, onPlay, onDelete }) {
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
      {/* Thumbnail ou icône */}
      <View style={styles.cardThumb}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        <View style={[styles.cardThumbOverlay, { backgroundColor: `${color}22` }]}>
          <Ionicons name={typeIcon(item.type)} size={26} color={color} />
        </View>
      </View>

      {/* Infos */}
      <View style={styles.cardInfo}>
        <View style={styles.cardTypePill}>
          <Ionicons name={typeIcon(item.type)} size={10} color={color} />
          <Text style={[styles.cardTypeText, { color }]}>{item.type?.toUpperCase()}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.titre}</Text>
        {item.credits ? (
          <Text style={styles.cardSub} numberOfLines={1}>{item.credits}</Text>
        ) : null}
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={styles.cardMetaText}>{date}</Text>
          {sizeText ? (
            <>
              <View style={styles.dot} />
              <Ionicons name="save-outline" size={11} color={colors.textMuted} />
              <Text style={styles.cardMetaText}>{sizeText}</Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Bouton supprimer */}
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Écran principal ──────────────────────────────────────────
export default function OfflineScreen() {
  const insets = useSafeAreaInsets();
  const {
    offlineList,
    totalSizeFormatted,
    removeOfflineMedia,
    clearAllOffline,
    initialized,
  } = useOfflineMedia();

  const handlePlay = useCallback((item) => {
    router.push({
      pathname: '/PlayerScreen',
      params: { id: item.id_media, offline: '1' },
    });
  }, []);

  const handleDelete = useCallback((item) => {
    Alert.alert(
      'Supprimer le téléchargement',
      `Voulez-vous supprimer "${item.titre}" de vos médias hors-ligne ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => removeOfflineMedia(item.id_media),
        },
      ]
    );
  }, [removeOfflineMedia]);

  const handleClearAll = useCallback(() => {
    if (offlineList.length === 0) return;
    Alert.alert(
      'Tout supprimer',
      `Supprimer les ${offlineList.length} médias téléchargés (${totalSizeFormatted}) ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Tout supprimer',
          style: 'destructive',
          onPress: clearAllOffline,
        },
      ]
    );
  }, [offlineList.length, totalSizeFormatted, clearAllOffline]);

  // ── Header de la liste ────────────────────────────────────
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
            <Ionicons name="trash" size={14} color={colors.accent} />
            <Text style={styles.clearBtnText}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  // ── Écran vide ─────────────────────────────────────────────
  const Empty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Aucun média hors-ligne</Text>
      <Text style={styles.emptyText}>
        Téléchargez des vidéos, audios ou PDFs depuis l'écran de lecture pour y accéder sans connexion.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={16} color="#fff" />
        <Text style={styles.emptyBtnText}>Parcourir les médias</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Ionicons name="cloud-offline" size={18} color={colors.accent} />
          <Text style={styles.topTitle}>Téléchargements</Text>
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
      
      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgElevated,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  topTitleWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  topTitle: {
    color: colors.text,
    fontSize: typography.base,
    fontWeight: '700',
  },

  listHeader: { paddingHorizontal: spacing.base, paddingTop: spacing.md },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  statBox: { alignItems: 'center' },
  statValue: { color: colors.text, fontSize: typography.lg, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: typography.xs },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  clearBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(230,57,70,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  clearBtnText: { color: colors.accent, fontSize: typography.xs, fontWeight: '700' },

  listContent: { paddingHorizontal: spacing.base, paddingBottom: 80 },
  emptyContainer: { flex: 1 },
  separator: { height: spacing.sm },

  // ── Carte ──
  card: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
  },
  cardThumb: {
    width: 80, height: 80,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  cardThumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },
  cardInfo: { flex: 1, padding: spacing.sm, gap: 3 },
  cardTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
  },
  cardTypeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: {
    color: colors.text,
    fontSize: typography.sm,
    fontWeight: '700',
    lineHeight: 18,
  },
  cardSub: { color: colors.textSub, fontSize: typography.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  cardMetaText: { color: colors.textMuted, fontSize: 10 },
  dot: {
    width: 3, height: 3, borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
  deleteBtn: {
    padding: spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },

  // ── Vide ──
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.bgCard,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.xl,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textSub,
    fontSize: typography.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    ...shadow.accent,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },
});