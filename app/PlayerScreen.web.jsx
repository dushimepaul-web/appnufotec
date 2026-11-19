import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, Image, Linking,
  ScrollView, Share, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import YoutubeIframe from '../src/components/YoutubeIframe';
import MediaCard from '../src/components/MediaCard';
import { useMedia } from '../src/hooks/useMedias';
import { useOfflineMedia } from '../src/hooks/useOfflineMedia';
import { radius, spacing, typography } from '../src/utils/theme';
import { useTheme } from '../src/contexts/ThemeContext';
import api, { resolveUrl } from '../src/utils/api';
import { extractYoutubeId } from '../src/utils/youtube';
import { getDefaultThumbnail } from '../src/utils/thumbnails';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAYER_H = (SCREEN_W * 9) / 16;

function HtmlVideoPlayer({ uri }) {
  return (
    <View style={{ width: SCREEN_W, height: PLAYER_H, backgroundColor: '#000' }}>
      <video
        src={uri}
        controls
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

function YoutubePlayer({ youtubeId }) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  return (
    <View style={styles.youtubeWrap}>
      <YoutubeIframe height={PLAYER_H} width={SCREEN_W} videoId={youtubeId} />
    </View>
  );
}

function PdfPlayer({ url, titre, isOfflineUri }) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const viewerUrl = isOfflineUri
    ? url
    : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <View style={styles.pdfContainer}>
      <View style={styles.pdfTopBar}>
        <View style={styles.pdfIconWrap}>
          <Ionicons name="document-text" size={18} color={palette.green} />
        </View>
        <Text style={styles.pdfTitle} numberOfLines={1}>{titre}</Text>
        {isOfflineUri && (
          <View style={styles.offlinePill}>
            <Ionicons name="cloud-offline" size={10} color={palette.green} />
            <Text style={styles.offlinePillText}>Local</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <iframe
          src={viewerUrl}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title={titre}
        />
      </View>
      {!isOfflineUri && (
        <TouchableOpacity style={styles.pdfOpenBtn} onPress={() => Linking.openURL(url)} activeOpacity={0.8}>
          <Ionicons name="open-outline" size={16} color={palette.white} />
          <Text style={styles.pdfOpenText}>Ouvrir dans le navigateur</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function HtmlAudioPlayer({ uri, media, isPlaying, onPlayPause, position, duration, isOffline }) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.play(); } else { audioRef.current.pause(); }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current && uri) {
      audioRef.current.src = uri;
      audioRef.current.load();
    }
  }, [uri]);

  const fmt = (ms) => {
    if (!ms || ms < 0) return '0:00';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  return (
    <View style={styles.audioContainer}>
      {media.thumbnail_url ? (
        <Image source={{ uri: media.thumbnail_url }} style={StyleSheet.absoluteFill} blurRadius={22} />
      ) : null}
      <View style={styles.audioVeil} />
      <audio ref={audioRef} src={uri} preload="auto" style={{ display: 'none' }} />
      <View style={styles.audioInner}>
        <View style={styles.albumArtWrap}>
          <Image
            source={media.thumbnail_url ? { uri: media.thumbnail_url } : getDefaultThumbnail(media.type)}
            style={styles.albumArt} resizeMode="cover"
          />
        </View>
        {isOffline && (
          <View style={styles.offlinePillAudio}>
            <Ionicons name="cloud-offline" size={12} color={palette.green} />
            <Text style={styles.offlinePillText}>Disponible hors-ligne</Text>
          </View>
        )}
        <Text style={styles.audioTitle} numberOfLines={2}>{media.titre}</Text>
        {media.credits ? <Text style={styles.audioArtist}>{media.credits}</Text> : null}
        <View style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <View style={styles.progressTrackInner}>
              <View style={styles.progressBg} />
              <View style={[styles.progressFill, { width: `${(duration > 0 ? position / duration : 0) * 100}%` }]} />
            </View>
          </View>
          <View style={styles.progressTimes}>
            <Text style={styles.progressTime}>{fmt(position)}</Text>
            <Text style={styles.progressTime}>{fmt(duration)}</Text>
          </View>
        </View>
        <View style={styles.audioControls}>
          <TouchableOpacity onPress={onPlayPause} style={styles.playBtn} activeOpacity={0.85}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color={palette.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function OfflineBadge() {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  return (
    <View style={styles.offlineBadge}>
      <Ionicons name="cloud-download" size={12} color={palette.green} />
      <Text style={styles.offlineBadgeText}>Hors-ligne</Text>
    </View>
  );
}

export default function PlayerScreen() {
  const { palette } = useTheme();
  const { slug, id } = useLocalSearchParams();
  const identifier = slug || id;
  const { data: apiMedia, similar, loading: apiLoading } = useMedia(identifier);
  const insets = useSafeAreaInsets();

  const { offlineMap, isOffline, getLocalUri, downloadMedia, isDownloading, getDownloadProgress, cancelDownload } = useOfflineMedia();

  const [isPlaying, setIsPlaying] = useState(false);
  const styles = useMemo(() => s(palette), [palette]);

  const offlineEntry = offlineMap[String(identifier)] || null;
  const media = apiMedia || offlineEntry;
  const loading = apiLoading && !offlineEntry;

  const mediaId = media?.slug || media?.id_media || identifier;
  const offline = isOffline(mediaId);
  const localUri = getLocalUri(mediaId);
  const downloading = isDownloading(mediaId);
  const downloadProgress = getDownloadProgress(mediaId) ?? 0;
  const youtubeId = media?.youtube_id
    || extractYoutubeId(media?.file_url)
    || extractYoutubeId(media?.lien);
  const playbackUri = localUri ?? resolveUrl(media?.file_url);

  useEffect(() => {
    if (!media?.slug) return;
    api.recordView(media.slug).catch(() => {});
  }, [media?.slug]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const isPdf = (m) => {
    if (!m) return false;
    if (m.type === 'pdf' || m.type === 'document') return true;
    const url = (m.file_url || '').toLowerCase();
    return url.endsWith('.pdf') || url.includes('.pdf?');
  };

  const isLocalVideo = (m) => m && m.type === 'video' && !youtubeId && !!playbackUri;

  const handleShare = async () => {
    try {
      const shareUrl = `https://nufotec.com/media/${media?.slug}`;
      await Share.share({ message: `Découvrez "${media?.titre}" sur NUFOTEC BURUNDI !\n${shareUrl}`, title: media?.titre, url: shareUrl });
    } catch (e) { console.error('share:', e); }
  };

  const handleDownload = async () => {
    if (offline) {
      Alert.alert('Déjà disponible hors-ligne', 'Ce média est déjà téléchargé sur votre appareil.', [
        { text: 'Voir les téléchargements', onPress: () => router.push('/OfflineScreen') },
        { text: 'OK', style: 'cancel' },
      ]);
      return;
    }
    if (media?.youtube_id || youtubeId) {
      Alert.alert('Information', 'Les vidéos YouTube ne peuvent pas être téléchargées hors-ligne.');
      return;
    }
    if (!media?.download_url && !media?.file_url) {
      Alert.alert('Téléchargement impossible', 'Ce média n\'a pas de fichier téléchargeable.');
      return;
    }
    if (downloading) {
      Alert.alert('Téléchargement en cours', 'Voulez-vous annuler le téléchargement ?', [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Annuler', style: 'destructive', onPress: () => cancelDownload(mediaId) },
      ]);
      return;
    }
    try {
      await downloadMedia(media);
      Alert.alert('Téléchargé', `"${media.titre}" est maintenant disponible hors-ligne.`, [
        { text: 'Voir les téléchargements', onPress: () => router.push('/OfflineScreen') },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de télécharger ce fichier.');
    }
  };

  const renderPlayer = () => {
    if (isPdf(media)) return <PdfPlayer url={localUri ?? resolveUrl(media.file_url)} titre={media.titre} isOfflineUri={!!localUri} />;
    if (youtubeId) return <YoutubePlayer youtubeId={youtubeId} />;
    if (isLocalVideo(media)) return <HtmlVideoPlayer uri={playbackUri} />;
    if (media.type === 'audio') {
      return (
        <HtmlAudioPlayer
          uri={playbackUri}
          media={media}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          position={0}
          duration={0}
          isOffline={offline}
        />
      );
    }
    return <Image source={{ uri: resolveUrl(media.preview_url || media.thumbnail_url) }} style={{ flex: 1 }} resizeMode="contain" />;
  };

  const renderDownloadIcon = () => {
    if (offline) return <Ionicons name="cloud-done" size={20} color={palette.green} />;
    if (downloading) {
      return (
        <View style={styles.dlProgressWrap}>
          <ActivityIndicator size="small" color={palette.green} />
          {downloadProgress > 0 && <Text style={styles.dlProgressText}>{downloadProgress}%</Text>}
        </View>
      );
    }
    return <Ionicons name="download-outline" size={20} color={palette.greyDark} />;
  };

  const downloadLabel = offline ? 'Hors-ligne' : downloading ? 'Chargement…' : 'Télécharger';

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.green} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  if (!media) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.errorIconBox}>
          <Ionicons name="alert-circle-outline" size={40} color={palette.grey} />
        </View>
        <Text style={styles.errorText}>Média introuvable</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isPdf(media)) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={palette.dark} />
          </TouchableOpacity>
          <Text style={styles.topTitle} numberOfLines={1}>{media.titre}</Text>
          <View style={{ width: 36 }} />
        </View>
        {renderPlayer()}
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={palette.dark} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{media.titre}</Text>
        <TouchableOpacity style={styles.backCircle} onPress={() => router.push('/OfflineScreen')}>
          <Ionicons name="cloud-download-outline" size={18} color={palette.greyDark} />
        </TouchableOpacity>
      </View>

      <View style={[styles.playerWrap, media.type === 'audio' && styles.playerWrapAudio]}>
        {renderPlayer()}
        {offline && <OfflineBadge />}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <View style={styles.titleTopRow}>
            {media.categorie ? (
              <View style={styles.catPill}>
                <Text style={styles.catPillText}>{media.categorie}</Text>
              </View>
            ) : null}
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={13} color={palette.greyDark} />
              <Text style={styles.statText}>{media.views_formatted || '0'} vues</Text>
            </View>
          </View>
          <Text style={styles.title}>{media.titre}</Text>
          {media.credits ? (
            <View style={styles.creditRow}>
              <Ionicons name="person-outline" size={13} color={palette.greyDark} />
              <Text style={styles.creditText}>{media.credits}</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={palette.greyDark} />
              <Text style={styles.actionLabel}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, offline && styles.actionBtnOffline, downloading && styles.actionBtnDownloading]}
              onPress={handleDownload} activeOpacity={0.75}
            >
              {renderDownloadIcon()}
              <Text style={[styles.actionLabel, offline && styles.actionLabelOffline, downloading && styles.actionLabelActive]}>
                {downloadLabel}
              </Text>
              {downloading && downloadProgress > 0 && (
                <View style={styles.dlBar}>
                  <View style={[styles.dlBarFill, { width: `${downloadProgress}%` }]} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {media.description ? (
          <View style={styles.descBox}>
            <Text style={styles.descText}>{media.description}</Text>
          </View>
        ) : null}

        {similar.length > 0 && (
          <View style={styles.similarSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Suggestions</Text>
            </View>
            {similar.map((item) => (
              <MediaCard key={item.slug || item.id_media} item={item}
                onPress={(i) => router.push({ pathname: '/PlayerScreen', params: { slug: i.slug || i.id_media } })} />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  center: { justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  errorIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: p.whiteOff, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: p.greyLight, marginBottom: spacing.sm },

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
  topTitle: { color: p.dark, fontSize: typography.base, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: spacing.sm },

  playerWrap: { width: SCREEN_W, height: PLAYER_H, backgroundColor: '#000' },
  playerWrapAudio: { height: PLAYER_H + 120 },
  youtubeWrap: { width: SCREEN_W, height: PLAYER_H, backgroundColor: '#000' },

  offlineBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(11,107,58,0.4)',
  },
  offlineBadgeText: { color: p.green, fontSize: 10, fontWeight: '700' },

  offlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(11,107,58,0.1)', borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  offlinePillAudio: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(11,107,58,0.1)', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: spacing.sm,
  },
  offlinePillText: { color: p.green, fontSize: 9, fontWeight: '800' },

  audioContainer: { flex: 1, backgroundColor: p.dark, justifyContent: 'center', alignItems: 'center' },
  audioVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  audioInner: { alignItems: 'center', paddingHorizontal: spacing.xl, zIndex: 1 },
  albumArtWrap: {
    width: 120, height: 120, borderRadius: radius.lg, overflow: 'hidden',
    marginBottom: spacing.md, borderWidth: 2, borderColor: p.gold,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  albumArt: { width: '100%', height: '100%' },
  audioTitle: { color: p.white, fontSize: typography.lg, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  audioArtist: { color: p.grey, fontSize: typography.sm, marginBottom: spacing.md },

  progressArea: { width: SCREEN_W - 80, marginBottom: spacing.md },
  progressTrack: { width: '100%', paddingVertical: 10 },
  progressTrackInner: { width: '100%', height: 4, position: 'relative', justifyContent: 'center' },
  progressBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: p.green, borderRadius: 2 },
  progressTimes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  progressTime: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  audioControls: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.sm },
  playBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: p.green,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm,
    shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },

  pdfContainer: { flex: 1, backgroundColor: p.white },
  pdfTopBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, backgroundColor: p.whiteOff,
    borderBottomWidth: 1, borderBottomColor: p.greyLight,
  },
  pdfIconWrap: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: `${p.green}15`, justifyContent: 'center', alignItems: 'center' },
  pdfTitle: { color: p.dark, fontSize: typography.sm, fontWeight: '600', flex: 1 },
  pdfOpenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: p.green, margin: spacing.base, padding: spacing.md, borderRadius: radius.md,
    marginBottom: 30,
    shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  pdfOpenText: { color: p.white, fontWeight: '700', fontSize: typography.sm },

  scroll: { flex: 1, backgroundColor: p.white },
  titleSection: { padding: spacing.base },
  titleTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  catPill: {
    backgroundColor: `${p.green}12`,
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3,
  },
  catPillText: { color: p.green, fontSize: typography.xs, fontWeight: '700' },
  title: { color: p.dark, fontSize: typography.xl, fontWeight: '700', lineHeight: 26, marginBottom: spacing.xs },
  creditRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
  creditText: { color: p.greyDark, fontSize: typography.sm },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: p.greyDark, fontSize: typography.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: p.whiteOff, borderRadius: radius.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: p.greyLight,
  },
  actionLabel: { color: p.greyDark, fontSize: typography.xs, fontWeight: '600' },
  actionLabelActive: { color: p.green },
  actionBtnActive: { borderColor: p.green, backgroundColor: `${p.green}06` },
  actionBtnOffline: { borderColor: p.green, backgroundColor: `${p.green}08` },
  actionLabelOffline: { color: p.green },
  actionBtnDownloading: { borderColor: p.red, backgroundColor: p.redSoft },

  divider: { height: 1, backgroundColor: p.greyLight, marginHorizontal: spacing.base, marginVertical: spacing.sm },
  descBox: {
    marginHorizontal: spacing.base, backgroundColor: p.whiteOff,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: p.greyLight,
    marginBottom: spacing.md,
  },
  descText: { color: '#555', fontSize: typography.sm, lineHeight: 20 },
  similarSection: { paddingTop: spacing.sm },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.md },
  sectionAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: p.green },
  sectionTitle: { color: p.dark, fontSize: typography.lg, fontWeight: '700' },
  loadingText: { color: p.greyDark, marginTop: spacing.md, fontSize: typography.sm },
  errorText: { color: p.grey, fontSize: typography.lg, marginTop: spacing.md },
  backBtn: { marginTop: spacing.lg, backgroundColor: p.green, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full, shadowColor: p.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  backBtnText: { color: p.white, fontWeight: '700' },
  dlProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dlProgressText: { color: p.green, fontSize: typography.xs, fontWeight: '700' },
  dlBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: p.greyLight, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, overflow: 'hidden' },
  dlBarFill: { height: '100%', backgroundColor: p.green, borderRadius: 2 },
});
