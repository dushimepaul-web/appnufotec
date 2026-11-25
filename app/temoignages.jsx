import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Image from '../src/components/CachedImage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import BottomNav from '../src/components/BottomNav';
import YoutubeIframe from '../src/components/YoutubeIframe';
import { useTemoignages } from '../src/hooks/useTemoignages';
import { useTheme } from '../src/contexts/ThemeContext';
import { extractYoutubeId } from '../src/utils/youtube';
import { radius, spacing, typography } from '../src/utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAYER_H = (SCREEN_W * 9) / 16;

export default function TemoignagesScreen() {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const { data, loading, refreshing, loadingMore, error, hasMore, refresh, loadMore } = useTemoignages();
  const [selectedVideo, setSelectedVideo] = useState(null);

  const renderItem = useCallback(({ item }) => {
    const duration = item.audio_duration || '';
    const videoId = item.youtube_id || extractYoutubeId(item.video_url);
    const videoUrl = videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : (item.video_url || null);
    const thumbnail = item.miniature || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);

    return (
      <TouchableOpacity style={styles.card} onPress={() => videoUrl && setSelectedVideo(item)} disabled={!videoUrl} activeOpacity={0.8}>
        <View style={styles.thumbnailWrap}>
          {thumbnail ? <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" /> : <View style={styles.thumbnailFallback} />}
          <View style={styles.playBadge}><Ionicons name="play" size={18} color={palette.white} /></View>
          {duration ? <Text style={styles.duration}>{duration}</Text> : null}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.videoTitle} numberOfLines={2}>{item.titre || 'Témoignage vidéo'}</Text>
          <Text style={styles.videoMeta}>{item.is_external ? 'Vidéo externe' : 'Témoignage approuvé'}</Text>
          {videoUrl ? <Text style={styles.watch}>Regarder le témoignage</Text> : null}
        </View>
      </TouchableOpacity>
    );
  }, [palette.white, styles]);

  const ListHeader = () => (
    <View style={styles.header}>
      <View style={styles.iconWrap}><Ionicons name="star" size={24} color={palette.gold} /></View>
      <Text style={styles.title}>Témoignages</Text>
      <Text style={styles.subtitle}>Les expériences partagées par nos utilisateurs.</Text>
    </View>
  );

  const ListEmpty = () => {
    if (loading) return <ActivityIndicator size="large" color={palette.green} style={styles.loader} />;
    if (error) {
      return (
        <View style={styles.emptyCard}>
          <Ionicons name="cloud-offline-outline" size={42} color={palette.red} />
          <Text style={styles.emptyTitle}>Impossible de charger les témoignages</Text>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}><Text style={styles.retryText}>Réessayer</Text></TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="chatbox-ellipses-outline" size={42} color={palette.green} />
        <Text style={styles.emptyTitle}>Aucun témoignage pour le moment</Text>
        <Text style={styles.emptyText}>Les témoignages approuvés apparaîtront ici.</Text>
      </View>
    );
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item, index) => String(item.id_temoignage || item.id || index)}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={palette.green} style={styles.footerLoader} /> : null}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[palette.green]} tintColor={palette.green} />}
        showsVerticalScrollIndicator={false}
      />
      <Modal
        animationType="slide"
        visible={!!selectedVideo}
        onRequestClose={() => setSelectedVideo(null)}
      >
        <View style={[styles.playerModal, { paddingTop: insets.top }]}> 
          <View style={styles.playerHeader}>
            <Text style={styles.playerTitle} numberOfLines={1}>{selectedVideo?.titre || 'Témoignage'}</Text>
            <TouchableOpacity onPress={() => setSelectedVideo(null)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={palette.dark} />
            </TouchableOpacity>
          </View>
          {(() => {
            const vId = selectedVideo?.youtube_id || extractYoutubeId(selectedVideo?.video_url);
            if (vId) {
              return (
                <YoutubeIframe
                  videoId={vId}
                  width={SCREEN_W}
                  height={PLAYER_H}
                />
              );
            }
            if (selectedVideo?.video_url) {
              return <WebView source={{ uri: selectedVideo.video_url }} style={styles.webPlayer} allowsInlineMediaPlayback />;
            }
            return null;
          })()}
        </View>
      </Modal>
      <BottomNav />
    </View>
  );
}

const createStyles = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  content: { flexGrow: 1, paddingHorizontal: spacing.base, paddingBottom: 100 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  iconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${p.gold}18`, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  title: { color: p.dark, fontSize: typography.xxl, fontWeight: '800' },
  subtitle: { color: p.greyDark, fontSize: typography.sm, textAlign: 'center', marginTop: spacing.xs },
  card: { backgroundColor: p.white, borderColor: p.greyLight, borderRadius: radius.lg, borderWidth: 1, marginBottom: spacing.md, overflow: 'hidden' },
  thumbnailWrap: { height: 180, backgroundColor: p.whiteOff, position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailFallback: { flex: 1, backgroundColor: `${p.green}18` },
  playBadge: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: `${p.green}E8`, alignItems: 'center', justifyContent: 'center' },
  duration: { position: 'absolute', right: spacing.sm, bottom: spacing.sm, color: p.white, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: radius.xs, paddingHorizontal: spacing.sm, paddingVertical: 3, fontSize: typography.xs, fontWeight: '700' },
  cardBody: { padding: spacing.md },
  videoTitle: { color: p.dark, fontSize: typography.md, fontWeight: '800' },
  videoMeta: { color: p.greyDark, fontSize: typography.xs, marginTop: spacing.xs },
  watch: { color: p.green, fontSize: typography.sm, fontWeight: '700', marginTop: spacing.sm },
  playerModal: { flex: 1, backgroundColor: p.white },
  playerHeader: { alignItems: 'center', borderBottomColor: p.greyLight, borderBottomWidth: 1, flexDirection: 'row', height: 56, paddingHorizontal: spacing.base },
  playerTitle: { color: p.dark, flex: 1, fontSize: typography.md, fontWeight: '700' },
  closeButton: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  webPlayer: { flex: 1, backgroundColor: p.media },
  emptyCard: { alignItems: 'center', backgroundColor: p.whiteOff, borderColor: p.greyLight, borderRadius: radius.lg, borderWidth: 1, padding: spacing.xxl },
  emptyTitle: { color: p.dark, fontSize: typography.md, fontWeight: '700', marginTop: spacing.md, textAlign: 'center' },
  emptyText: { color: p.greyDark, fontSize: typography.sm, lineHeight: 20, marginTop: spacing.xs, textAlign: 'center' },
  retryButton: { backgroundColor: p.green, borderRadius: radius.full, marginTop: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  retryText: { color: p.white, fontSize: typography.sm, fontWeight: '700' },
  loader: { marginTop: spacing.xxl },
  footerLoader: { marginVertical: spacing.md },
});
