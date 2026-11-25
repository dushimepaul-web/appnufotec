import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContext, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Image from './CachedImage';
import { PlayerActionsContext } from '../contexts/PlayerContext';
import { useTheme } from '../contexts/ThemeContext';
import { timeAgo } from '../utils/format';
import { radius, spacing, typography } from '../utils/theme';
import { getDefaultThumbnail } from '../utils/thumbnails';
import { extractYoutubeId } from '../utils/youtube';
import { MediaThumb } from './MediaDisc';

const LOGO = require('../../assets/logo.png');
const CHANNEL = 'NUFOTEC BURUNDI';

// Carte média façon YouTube.
//  - variant "feed" (défaut) : grande miniature 16:9 pleine largeur + avatar de chaîne
//  - variant "compact"       : miniature à gauche, texte à droite (« À suivre », recherche)
//  - horizontal              : carte étroite pour les carrousels de l'accueil
export default function MediaCard({ item, onPress, horizontal = false, variant = 'feed' }) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const stopPlayback = useContext(PlayerActionsContext)?.stopPlayback || (() => Promise.resolve());

  const TYPE_ICON = useMemo(() => ({
    audio: { icon: 'musical-notes', label: 'Audio' },
    video: { icon: 'play', label: 'Vidéo' },
    pdf: { icon: 'document-text', label: 'PDF' },
    document: { icon: 'document-text', label: 'Document' },
    image: { icon: 'image', label: 'Image' },
  }), []);

  if (!item) return null;

  const isYoutube = !!(item.youtube_id || extractYoutubeId(item.file_url || item.lien));
  const typeInfo = TYPE_ICON[item.type] || TYPE_ICON.video;
  const hasThumb = !!item.thumbnail_url;
  const meta = [
    item.views_formatted ? `${item.views_formatted} vues` : null,
    timeAgo(item.published_at || item.created_at || item.date),
  ].filter(Boolean).join(' • ');

  const handlePress = async () => {
    try { await stopPlayback(); } catch {}
    if (onPress) onPress(item);
    else router.push({ pathname: '/PlayerScreen', params: { slug: item.slug || item.id_media } });
  };

  // Audios et documents : disque NUFOTEC (comme sur le site). Vidéos : miniature.
  const useDisc = ['audio', 'pdf', 'document'].includes(item.type);

  const thumbnail = (style, small = false) => (
    <View style={[styles.thumbBox, style]}>
      {useDisc ? (
        <MediaThumb type={item.type} small={small} />
      ) : hasThumb ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.thumbImg} resizeMode="cover" thumb={style === styles.thumbCompact} />
      ) : (
        <View style={styles.placeholder}>
          <Image source={getDefaultThumbnail(item.type)} style={styles.placeholderImg} resizeMode="contain" />
        </View>
      )}
      {item.duration_formatted ? (
        <View style={styles.duration}><Text style={styles.durationText}>{item.duration_formatted}</Text></View>
      ) : !useDisc ? (
        <View style={styles.duration}>
          <Ionicons name={isYoutube ? 'logo-youtube' : typeInfo.icon} size={11} color="#FFFFFF" />
          <Text style={styles.durationText}>{isYoutube ? 'YouTube' : typeInfo.label}</Text>
        </View>
      ) : null}
    </View>
  );

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.cardH} onPress={handlePress} activeOpacity={0.85}>
        {thumbnail(styles.thumbH, true)}
        <Text style={styles.titleH} numberOfLines={2}>{item.titre}</Text>
        <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'compact') {
    return (
      <TouchableOpacity style={styles.compact} onPress={handlePress} activeOpacity={0.85}>
        {thumbnail(styles.thumbCompact, true)}
        <View style={styles.compactInfo}>
          <Text style={styles.titleCompact} numberOfLines={2}>{item.titre}</Text>
          <Text style={styles.meta} numberOfLines={1}>{CHANNEL}</Text>
          <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.feed} onPress={handlePress} activeOpacity={0.9}>
      {thumbnail(styles.thumbFeed)}
      <View style={styles.feedInfo}>
        <View style={styles.avatar}><Image source={LOGO} style={styles.avatarImg} resizeMode="contain" /></View>
        <View style={styles.feedText}>
          <Text style={styles.titleFeed} numberOfLines={2}>{item.titre}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {CHANNEL}{meta ? ` • ${meta}` : ''}
          </Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={16} color={palette.greyDark} style={styles.more} />
      </View>
    </TouchableOpacity>
  );
}

const s = (p) => StyleSheet.create({
  thumbBox: { overflow: 'hidden', backgroundColor: p.greenDark },
  thumbImg: { width: '100%', height: '100%' },
  placeholder: { flex: 1, backgroundColor: p.greenDark, justifyContent: 'center', alignItems: 'center' },
  placeholderImg: { width: '60%', height: '80%', opacity: 0.9 },
  duration: {
    position: 'absolute', right: 6, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(15,36,23,0.85)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2,
  },
  durationText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  meta: { color: p.greyDark, fontSize: typography.xs + 1, marginTop: 2 },

  feed: { marginBottom: spacing.lg },
  thumbFeed: { width: '100%', aspectRatio: 16 / 9 },
  feedInfo: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing.md, paddingTop: spacing.md, gap: spacing.md },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: p.white, overflow: 'hidden',
    borderWidth: 1.5, borderColor: p.gold, justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 30, height: 30 },
  feedText: { flex: 1 },
  titleFeed: { color: p.dark, fontSize: typography.md, fontWeight: '600', lineHeight: 20 },
  more: { paddingTop: 2 },

  compact: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  thumbCompact: { width: 168, aspectRatio: 16 / 9, borderRadius: radius.sm },
  compactInfo: { flex: 1 },
  titleCompact: { color: p.dark, fontSize: typography.base, fontWeight: '600', lineHeight: 18 },

  cardH: { width: 240 },
  thumbH: { width: 240, aspectRatio: 16 / 9, borderRadius: radius.md },
  titleH: { color: p.dark, fontSize: typography.base, fontWeight: '600', marginTop: spacing.sm, lineHeight: 18 },
});
