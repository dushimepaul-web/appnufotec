// app/PlayerScreen.js — Version avec support hors-ligne complet
// ─────────────────────────────────────────────────────────────────
// Modifications par rapport à la version originale :
//   1. Import de useOfflineMedia
//   2. Bouton "Télécharger" → utilise downloadMedia() du hook
//   3. Lecture : si le média est hors-ligne, utilise l'URI locale
//   4. Indicateur "hors-ligne" sur le player
// ─────────────────────────────────────────────────────────────────

import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
// Expo choisit automatiquement YoutubeIframe.web.js sur web,
// et react-native-youtube-iframe sur iOS/Android
import YoutubeIframe from '../src/components/YoutubeIframe';

import MediaCard from '../src/components/MediaCard';
import { PlayerContext } from '../src/contexts/PlayerContext';
import { useMedia } from '../src/hooks/useMedias';
import { useOfflineMedia } from '../src/hooks/useOfflineMedia'; // ← NOUVEAU
import { colors, radius, shadow, spacing, typography } from '../src/utils/theme';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAYER_H = (SCREEN_W * 9) / 16;

// ─── YouTube Player ────────────────────────────────────────────
// Web    → src/components/YoutubeIframe.web.js  (iframe HTML, zéro dépendance)
// Mobile → react-native-youtube-iframe          (SDK natif)
// Expo résout automatiquement le bon fichier via l'extension .web.js
function YoutubePlayer({ youtubeId }) {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') setPlaying(false);
  }, []);

  return (
    <View style={styles.youtubeWrap}>
      {!ready && Platform.OS !== 'web' && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ color: '#fff', marginTop: 8, fontSize: 12 }}>Chargement…</Text>
        </View>
      )}
      <YoutubeIframe
        height={PLAYER_H}
        width={SCREEN_W}
        videoId={youtubeId}
        play={playing}
        onReady={() => setReady(true)}
        onChangeState={onStateChange}
        webViewProps={{
          allowsInlineMediaPlayback: true,
          mediaPlaybackRequiresUserAction: false,
          androidLayerType: 'hardware',
        }}
        initialPlayerParams={{
          rel: false,
          modestbranding: true,
          controls: true,
          preventFullScreen: false,
        }}
      />
      {ready && !playing && Platform.OS !== 'web' && (
        <TouchableOpacity
          style={styles.ytPlayOverlay}
          onPress={() => setPlaying(true)}
          activeOpacity={0.85}
        >
          <View style={styles.ytPlayBtn}>
            <Ionicons name="logo-youtube" size={28} color="#FF0000" />
            <Text style={styles.ytPlayText}>Lire la vidéo</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Local / Offline Video Player ─────────────────────────────
function LocalVideoPlayer({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    if (Platform.OS !== 'web') p.play();
  });

  return (
    <VideoView
      style={{ flex: 1 }}
      player={player}
      allowsFullscreen
      allowsPictureInPicture
      contentFit="contain"
    />
  );
}

// ─── PDF Player ────────────────────────────────────────────────
// Pour un PDF hors-ligne, on utilise l'URI locale dans une WebView
function PdfPlayer({ url, titre, isOfflineUri }) {
  const [webLoading, setWebLoading] = useState(true);

  // URI locale → file:// direct ; URL distante → Google Viewer
  const viewerUrl = isOfflineUri
    ? url
    : `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <View style={styles.pdfContainer}>
      <View style={styles.pdfTopBar}>
        <View style={styles.pdfIconWrap}>
          <Ionicons name="document-text" size={18} color="#34D399" />
        </View>
        <Text style={styles.pdfTitle} numberOfLines={1}>{titre}</Text>
        {isOfflineUri && (
          <View style={styles.offlinePill}>
            <Ionicons name="cloud-offline" size={10} color="#34D399" />
            <Text style={styles.offlinePillText}>Local</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {webLoading && (
          <View style={styles.pdfLoading}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.pdfLoadingText}>Chargement du PDF…</Text>
          </View>
        )}
        <WebView
          source={{ uri: viewerUrl }}
          style={[{ flex: 1 }, webLoading && { height: 0 }]}
          onLoad={() => setWebLoading(false)}
          javaScriptEnabled
          startInLoadingState={false}
        />
      </View>

      {!isOfflineUri && (
        <TouchableOpacity
          style={styles.pdfOpenBtn}
          onPress={() => Linking.openURL(url)}
          activeOpacity={0.8}
        >
          <Ionicons name="open-outline" size={16} color="#fff" />
          <Text style={styles.pdfOpenText}>Ouvrir dans le navigateur</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Audio Player ──────────────────────────────────────────────
// position et duration viennent du parent via setOnPlaybackStatusUpdate
function AudioPlayer({ media, isPlaying, onPlayPause, soundRef, isOffline: isOff, position, duration }) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const fmt = (ms) => {
    if (!ms || ms < 0) return '0:00';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  const progress = duration > 0 ? position / duration : 0;

  const seekTo = async (ratio) => {
    const sound = soundRef?.current;
    if (!sound || duration <= 0) return;
    try {
      await sound.setPositionAsync(Math.floor(ratio * duration));
    } catch {}
  };

  const skip = async (deltaMs) => {
    const sound = soundRef?.current;
    if (!sound) return;
    try {
      const st = await sound.getStatusAsync();
      if (!st.isLoaded) return;
      const next = Math.max(0, Math.min((st.positionMillis ?? 0) + deltaMs, duration));
      await sound.setPositionAsync(next);
      // position mise à jour automatiquement via setOnPlaybackStatusUpdate dans le parent
    } catch {}
  };

  return (
    <View style={styles.audioContainer}>
      {media.thumbnail_url ? (
        <Image source={{ uri: media.thumbnail_url }} style={StyleSheet.absoluteFill} blurRadius={22} />
      ) : null}
      <View style={styles.audioVeil} />

      <View style={styles.audioInner}>
        {/* Pochette */}
        <View style={styles.albumArtWrap}>
          <Image
            source={
              media.thumbnail_url
                ? { uri: media.thumbnail_url }
                : require('../assets/placeholder.png')
            }
            style={styles.albumArt}
            resizeMode="cover"
          />
        </View>

        {/* Badge hors-ligne */}
        {isOff && (
          <View style={styles.offlinePillAudio}>
            <Ionicons name="cloud-offline" size={12} color="#34D399" />
            <Text style={styles.offlinePillText}>Disponible hors-ligne</Text>
          </View>
        )}

        {/* Titre + artiste */}
        <Text style={styles.audioTitle} numberOfLines={2}>{media.titre}</Text>
        {media.credits ? <Text style={styles.audioArtist}>{media.credits}</Text> : null}

        {/* ── Barre de progression tactile ── */}
        <View style={styles.progressArea}>
          {/* Track cliquable */}
          <TouchableOpacity
            style={styles.progressTrack}
            activeOpacity={1}
            onPress={(e) => {
              const { locationX, target } = e.nativeEvent;
              // On mesure la largeur via onLayout stockée dans un ref
            }}
          >
            <View
              style={styles.progressTrackInner}
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              onResponderGrant={(e) => {
                setIsSeeking(true);
                const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / (SCREEN_W - 80)));
                setSeekValue(ratio);
              }}
              onResponderMove={(e) => {
                const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / (SCREEN_W - 80)));
                setSeekValue(ratio);
              }}
              onResponderRelease={async (e) => {
                const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / (SCREEN_W - 80)));
                await seekTo(ratio);
                // position mise à jour automatiquement via setOnPlaybackStatusUpdate
                setIsSeeking(false);
              }}
            >
              {/* Fond gris */}
              <View style={styles.progressBg} />
              {/* Remplissage coloré */}
              <View
                style={[
                  styles.progressFill,
                  { width: `${(isSeeking ? seekValue : progress) * 100}%` },
                ]}
              />
              {/* Curseur */}
              <View
                style={[
                  styles.progressThumb,
                  { left: `${(isSeeking ? seekValue : progress) * 100}%` },
                ]}
              />
            </View>
          </TouchableOpacity>

          {/* Temps */}
          <View style={styles.progressTimes}>
            <Text style={styles.progressTime}>{fmt(isSeeking ? seekValue * duration : position)}</Text>
            <Text style={styles.progressTime}>{fmt(duration)}</Text>
          </View>
        </View>

        {/* ── Contrôles ── */}
        <View style={styles.audioControls}>
          {/* Reculer 15s */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => skip(-15000)} activeOpacity={0.7}>
            <Ionicons name="play-back" size={22} color="#fff" />
            <Text style={styles.skipLabel}>15</Text>
          </TouchableOpacity>

          {/* Play / Pause */}
          <TouchableOpacity onPress={onPlayPause} style={styles.playBtn} activeOpacity={0.85}>
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
          </TouchableOpacity>

          {/* Avancer 15s */}
          <TouchableOpacity style={styles.skipBtn} onPress={() => skip(15000)} activeOpacity={0.7}>
            <Ionicons name="play-forward" size={22} color="#fff" />
            <Text style={styles.skipLabel}>15</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Badge hors-ligne flottant ─────────────────────────────────
function OfflineBadge() {
  return (
    <View style={styles.offlineBadge}>
      <Ionicons name="cloud-offline" size={12} color="#34D399" />
      <Text style={styles.offlineBadgeText}>Hors-ligne</Text>
    </View>
  );
}

// ─── Main Player Screen ────────────────────────────────────────
export default function PlayerScreen() {
  const { id } = useLocalSearchParams();
  const { data: media, similar, loading } = useMedia(id);
  const insets = useSafeAreaInsets();
  const { stopPlayback, setActiveSound } = useContext(PlayerContext);

  // ── Hook hors-ligne ──────────────────────────────────────
  const {
    isOffline,
    getLocalUri,
    downloadMedia,
    isDownloading,
    getDownloadProgress,
    cancelDownload,
  } = useOfflineMedia();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0); // ms — mis à jour par setOnPlaybackStatusUpdate
  const [audioDuration, setAudioDuration] = useState(0); // ms
  const soundRef = useRef(null);

  // ── État dérivé : ce média est-il disponible hors-ligne ? ─
  const mediaId = media?.id_media;
  const offline = isOffline(mediaId);
  const localUri = getLocalUri(mediaId);
  const downloading = isDownloading(mediaId);
  const downloadProgress = getDownloadProgress(mediaId) ?? 0;

  // URI à utiliser pour la lecture (locale si dispo, distante sinon)
  const playbackUri = localUri ?? media?.file_url;

  const isPdf = (m) => {
    if (!m) return false;
    if (m.type === 'pdf') return true;
    const url = (m.file_url || '').toLowerCase();
    return url.endsWith('.pdf') || url.includes('.pdf?');
  };

  const isLocalVideo = (m) =>
    m && m.type === 'video' && !m.youtube_id && !!playbackUri;

  useEffect(() => { return () => cleanupSound(); }, []);
  useEffect(() => {
    cleanupSound();
    setAudioPosition(0);
    setAudioDuration(0);
  }, [id]);
  useEffect(() => {
    if (media?.type === 'audio' && playbackUri) loadAudio();
  }, [media?.id_media, localUri]);

  const cleanupSound = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    soundRef.current = null;
    try {
      const st = await sound.getStatusAsync();
      if (st.isLoaded) { await sound.stopAsync(); await sound.unloadAsync(); }
    } catch {}
    setIsPlaying(false);
  };

  const loadAudio = async () => {
    try {
      await stopPlayback();
      await cleanupSound();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: playbackUri },
        { shouldPlay: false }
      );
      soundRef.current = newSound;
      await setActiveSound(newSound);
      newSound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded) {
          setIsPlaying(s.isPlaying);
          setAudioPosition(s.positionMillis ?? 0);
          setAudioDuration(s.durationMillis ?? 0);
        }
        if (s.didJustFinish) setIsPlaying(false);
      });
    } catch (e) { console.error('loadAudio:', e.message); }
  };

  const handlePlayPause = async () => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); }
      else { await sound.playAsync(); setIsPlaying(true); }
    } catch {}
  };

  const handleLike  = () => {
    setIsLiked(!isLiked);
    Alert.alert(isLiked ? 'Like retiré' : "J'aime", isLiked ? "Vous n'aimez plus ce contenu" : 'Merci !');
  };

  const handleSave  = () => {
    setIsSaved(!isSaved);
    Alert.alert(isSaved ? 'Retiré' : 'Sauvegardé', isSaved ? 'Retiré de vos favoris' : 'Ajouté aux favoris');
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://nufotec.com/media/detail/${media?.slug}`;
      await Share.share({
        message: `Découvrez "${media?.titre}" sur NUFOTEC BURUNDI !\n${shareUrl}`,
        title: media?.titre,
        url: shareUrl, // iOS affiche le lien séparément
      });
    } catch (e) { console.error('share:', e); }
  };

  // ── Téléchargement hors-ligne ─────────────────────────────
  const handleDownload = async () => {
    // Déjà téléchargé → proposer de supprimer ou aller à la liste
    if (offline) {
      Alert.alert(
        '✅ Déjà disponible hors-ligne',
        'Ce média est déjà téléchargé sur votre appareil.',
        [
          { text: 'Voir les téléchargements', onPress: () => router.push('/OfflineScreen') },
          { text: 'OK', style: 'cancel' },
        ]
      );
      return;
    }

    // YouTube → impossible
    if (media?.youtube_id) {
      Alert.alert('Information', 'Les vidéos YouTube ne peuvent pas être téléchargées hors-ligne.');
      return;
    }

    if (!media?.file_url) {
      Alert.alert('Téléchargement impossible', 'Ce média n\'a pas de fichier téléchargeable.');
      return;
    }

    // En cours → annuler
    if (downloading) {
      Alert.alert(
        'Téléchargement en cours',
        'Voulez-vous annuler le téléchargement ?',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Annuler', style: 'destructive', onPress: () => cancelDownload(mediaId) },
        ]
      );
      return;
    }

    try {
      await downloadMedia(media);
      Alert.alert(
        '✅ Téléchargé',
        `"${media.titre}" est maintenant disponible hors-ligne.`,
        [
          { text: 'Voir les téléchargements', onPress: () => router.push('/OfflineScreen') },
          { text: 'OK', style: 'cancel' },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible de télécharger ce fichier.');
    }
  };

  // ── Rendu du player ───────────────────────────────────────
  const renderPlayer = () => {
    if (isPdf(media)) {
      return (
        <PdfPlayer
          url={localUri ?? media.file_url}
          titre={media.titre}
          isOfflineUri={!!localUri}
        />
      );
    }
    if (media.youtube_id)    return <YoutubePlayer youtubeId={media.youtube_id} />;
    if (isLocalVideo(media)) return <LocalVideoPlayer uri={playbackUri} />;
    if (media.type === 'audio') {
      return (
        <AudioPlayer
          media={media}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          soundRef={soundRef}
          isOffline={offline}
          position={audioPosition}
          duration={audioDuration}
        />
      );
    }
    return (
      <Image source={{ uri: media.thumbnail_url }} style={{ flex: 1 }} resizeMode="contain" />
    );
  };

  // ── Icône du bouton téléchargement ─────────────────────────
  const renderDownloadIcon = () => {
    if (offline) {
      return <Ionicons name="cloud-done" size={20} color="#34D399" />;
    }
    if (downloading) {
      return (
        <View style={styles.dlProgressWrap}>
          <ActivityIndicator size="small" color={colors.accent} />
          {downloadProgress > 0 && (
            <Text style={styles.dlProgressText}>{downloadProgress}%</Text>
          )}
        </View>
      );
    }
    return <Ionicons name="download-outline" size={20} color={colors.text} />;
  };

  const downloadLabel = offline ? 'Hors-ligne' : downloading ? 'Chargement…' : 'Télécharger';

  // ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  if (!media) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
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
            <Ionicons name="arrow-back" size={20} color={colors.text} />
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
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>{media.titre}</Text>
        {/* Raccourci vers les téléchargements */}
        <TouchableOpacity style={styles.backCircle} onPress={() => router.push('/OfflineScreen')}>
          <Ionicons name="cloud-offline-outline" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Conteneur player + badge hors-ligne */}
      <View style={[styles.playerWrap, media.type === 'audio' && styles.playerWrapAudio]}>
        {renderPlayer()}
        {offline && <OfflineBadge />}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          {media.categorie ? (
            <View style={styles.catPill}>
              <Text style={styles.catPillText}>{media.categorie}</Text>
            </View>
          ) : null}
          <Text style={styles.title}>{media.titre}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="eye-outline" size={14} color={colors.textSub} />
              <Text style={styles.statText}>{media.views_formatted || '0'} vues</Text>
            </View>
            {media.credits ? (
              <View style={styles.statItem}>
                <Ionicons name="person-outline" size={14} color={colors.textSub} />
                <Text style={styles.statText}>{media.credits}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <Ionicons
                name={isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
                size={20}
                color={isLiked ? colors.accent : colors.text}
              />
              <Text style={[styles.actionLabel, isLiked && styles.actionLabelActive]}>J'aime</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={isSaved ? colors.accent : colors.text}
              />
              <Text style={[styles.actionLabel, isSaved && styles.actionLabelActive]}>Sauver</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={20} color={colors.text} />
              <Text style={styles.actionLabel}>Partager</Text>
            </TouchableOpacity>

            {/* ── Bouton téléchargement ── */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                offline && styles.actionBtnOffline,
                downloading && styles.actionBtnActive,
              ]}
              onPress={handleDownload}
              activeOpacity={0.75}
            >
              {renderDownloadIcon()}
              <Text style={[
                styles.actionLabel,
                offline && styles.actionLabelOffline,
                downloading && styles.actionLabelActive,
              ]}>
                {downloadLabel}
              </Text>
              {/* Barre de progression */}
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
          <View style={styles.similar}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Suggestions</Text>
            </View>
            {similar.map((item) => (
              <MediaCard
                key={item.id_media}
                item={item}
                onPress={(i) =>
                  router.push({ pathname: '/PlayerScreen', params: { id: i.id_media } })
                }
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { justifyContent: 'center', alignItems: 'center' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bgElevated, borderWidth: 1, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  topTitle: {
    color: colors.text, fontSize: typography.base, fontWeight: '700',
    flex: 1, textAlign: 'center', marginHorizontal: spacing.sm,
  },

  playerWrap: { width: SCREEN_W, height: PLAYER_H, backgroundColor: '#000' },
  playerWrapAudio: { height: PLAYER_H + 120 },
  youtubeWrap: { width: SCREEN_W, height: PLAYER_H, backgroundColor: '#000' },
  ytPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
  },
  ytPlayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  ytPlayText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center',
  },

  // Badge hors-ligne flottant sur le player
  offlineBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)',
  },
  offlineBadgeText: { color: '#34D399', fontSize: 10, fontWeight: '700' },

  // Pill hors-ligne inline (PDF topbar, audio)
  offlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(52,211,153,0.12)', borderRadius: radius.full,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  offlinePillAudio: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(52,211,153,0.15)', borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  offlinePillText: { color: '#34D399', fontSize: 9, fontWeight: '800' },

  audioContainer: { flex: 1, backgroundColor: colors.bgCard, justifyContent: 'center', alignItems: 'center' },
  audioVeil: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,17,23,0.7)' },
  audioInner: { alignItems: 'center', paddingHorizontal: spacing.xl, zIndex: 1 },
  albumArtWrap: {
    width: 110, height: 110, borderRadius: radius.lg, overflow: 'hidden',
    marginBottom: spacing.md, ...shadow.accent,
  },
  albumArt: { width: '100%', height: '100%' },
  audioTitle: { color: colors.text, fontSize: typography.lg, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  audioArtist: { color: colors.textSub, fontSize: typography.sm, marginBottom: spacing.md },

  // ── Barre de progression ──
  progressArea: { width: SCREEN_W - 80, marginBottom: spacing.md },
  progressTrack: { width: '100%', paddingVertical: 10 },
  progressTrackInner: {
    width: '100%', height: 4,
    position: 'relative', justifyContent: 'center',
  },
  progressBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 14, height: 14,
    borderRadius: 7,
    backgroundColor: '#fff',
    top: -5,
    marginLeft: -7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  progressTimes: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: 4,
  },
  progressTime: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },

  // ── Boutons contrôles ──
  audioControls: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.xl, marginTop: spacing.sm,
  },
  skipBtn: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  skipLabel: {
    position: 'absolute', bottom: -2,
    color: '#fff', fontSize: 8, fontWeight: '800',
  },
  playBtn: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center', marginTop: spacing.sm, ...shadow.accent,
  },

  pdfContainer: { flex: 1, backgroundColor: colors.bg },
  pdfTopBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.bgCard,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  pdfIconWrap: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: 'rgba(52,211,153,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  pdfTitle: { color: colors.text, fontSize: typography.sm, fontWeight: '600', flex: 1 },
  pdfLoading: {
    ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.bg, zIndex: 10,
  },
  pdfLoadingText: { color: colors.textSub, marginTop: spacing.md },
  pdfOpenBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, margin: spacing.base, padding: spacing.md,
    borderRadius: radius.md, ...shadow.accent,
  },
  pdfOpenText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },

  scroll: { flex: 1 },
  titleSection: { padding: spacing.base },
  catPill: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(230,57,70,0.15)',
    borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, marginBottom: spacing.sm,
  },
  catPillText: { color: colors.accent, fontSize: typography.xs, fontWeight: '700' },
  title: { color: colors.text, fontSize: typography.lg, fontWeight: '700', lineHeight: 24, marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: colors.textSub, fontSize: typography.sm },
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  actionBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: colors.bgElevated, borderRadius: radius.md, paddingVertical: spacing.sm,
    borderWidth: 1, borderColor: colors.border,
  },
  actionLabel: { color: colors.textSub, fontSize: typography.xs, fontWeight: '600' },
  actionLabelActive: { color: colors.accent },
  // ← NOUVEAU : état hors-ligne (vert)
  actionBtnOffline: { borderColor: '#34D399', backgroundColor: 'rgba(52,211,153,0.08)' },
  actionLabelOffline: { color: '#34D399' },
  actionBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(230,57,70,0.08)' },

  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.base, marginVertical: spacing.sm },
  descBox: {
    marginHorizontal: spacing.base, backgroundColor: colors.bgCard,
    borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  descText: { color: colors.textSub, fontSize: typography.sm, lineHeight: 20 },
  similar: { paddingTop: spacing.md },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.base, marginBottom: spacing.md,
  },
  sectionAccent: { width: 4, height: 18, backgroundColor: colors.accent, borderRadius: 2 },
  sectionTitle: { color: colors.text, fontSize: typography.lg, fontWeight: '700' },
  loadingText: { color: colors.textSub, marginTop: spacing.md, fontSize: typography.sm },
  errorText: { color: colors.textMuted, fontSize: typography.lg, marginTop: spacing.md },
  backBtn: {
    marginTop: spacing.lg, backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, borderRadius: radius.full,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },
  dlProgressWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dlProgressText: { color: colors.accent, fontSize: typography.xs, fontWeight: '700' },
  dlBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
    backgroundColor: colors.border, borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md, overflow: 'hidden',
  },
  dlBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
});