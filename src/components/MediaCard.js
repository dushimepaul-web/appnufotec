import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useContext, useMemo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PlayerContext } from '../contexts/PlayerContext';
import { useTheme } from '../contexts/ThemeContext';
import { palette, radius, spacing, typography } from '../utils/theme';

const TYPE_CONFIG = {
  audio: { icon: 'musical-notes', color: palette.gold, bg: palette.goldSoft },
  video: { icon: 'play-circle', color: palette.green, bg: 'rgba(11,107,58,0.1)' },
  pdf: { icon: 'document-text', color: palette.red, bg: palette.redSoft },
};

export default function MediaCard({ item, onPress, horizontal = false }) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const playerContext = useContext(PlayerContext);
  const stopPlayback = playerContext?.stopPlayback || (() => Promise.resolve());

  if (!item) return null;

  const isYoutube = !!item.youtube_id;
  const typeConfig = TYPE_CONFIG[item.type] || TYPE_CONFIG.video;

  const handlePress = async () => {
    try {
      await stopPlayback();
    } catch (error) {
      console.error('Error in stopPlayback:', error);
    }
    if (onPress) {
      onPress(item);
    } else {
      router.push({
        pathname: '/PlayerScreen',
        params: { id: item.id_media },
      });
    }
  };

  if (horizontal) {
    return (
      <TouchableOpacity style={styles.cardH} onPress={handlePress} activeOpacity={0.8}>
        <View style={styles.thumbWrapH}>
          <Image
            source={
              item.thumbnail_url
                ? { uri: item.thumbnail_url }
                : require('../../assets/placeholder.png')
            }
            style={styles.thumb}
            resizeMode="cover"
          />
          <View style={styles.thumbOverlay} />
          <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
            <Ionicons name={typeConfig.icon} size={11} color={typeConfig.color} />
          </View>
          {item.duration_formatted && item.duration_formatted !== '0:00' && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.duration_formatted}</Text>
            </View>
          )}
          {isYoutube && (
            <View style={styles.ytBadge}>
              <Ionicons name="logo-youtube" size={12} color={palette.red} />
            </View>
          )}
        </View>
        <View style={styles.infoH}>
          <Text style={styles.titleH} numberOfLines={2}>{item.titre}</Text>
          {item.categorie ? (
            <View style={styles.catPill}>
              <Text style={styles.catPillText}>{item.categorie}</Text>
            </View>
          ) : null}
          <Text style={styles.metaTextH}>
            {item.views_formatted ? `${item.views_formatted} vues` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.thumbWrap}>
        <Image
          source={
            item.thumbnail_url
              ? { uri: item.thumbnail_url }
              : require('../../assets/placeholder.png')
          }
          style={styles.thumb}
          resizeMode="cover"
        />
        <View style={styles.thumbOverlay} />
        <View style={[styles.typeBadge, { backgroundColor: typeConfig.bg }]}>
          <Ionicons name={typeConfig.icon} size={12} color={typeConfig.color} />
        </View>
        {item.duration_formatted && item.duration_formatted !== '0:00' && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{item.duration_formatted}</Text>
          </View>
        )}
        {isYoutube && (
          <View style={styles.ytBadge}>
            <Ionicons name="logo-youtube" size={12} color={palette.red} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.titre}</Text>
        <View style={styles.metaRow}>
          {item.categorie ? (
            <View style={styles.catPill}>
              <Text style={styles.catPillText}>{item.categorie}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.metaText}>
          {item.views_formatted ? `${item.views_formatted} vues` : ''}
          {item.credits ? ` • ${item.credits}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const s = (p) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.base,
    alignItems: 'flex-start',
  },
  thumbWrap: {
    width: 160,
    height: 90,
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: p.whiteOff,
    marginRight: spacing.md,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: p.greyLight,
  },
  thumb: { width: '100%', height: '100%' },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  typeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    borderRadius: radius.xs,
    padding: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  durationText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  ytBadge: {
    position: 'absolute',
    bottom: 5,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4,
    padding: 3,
  },
  info: {
    flex: 1,
    paddingRight: 24,
    paddingTop: 2,
  },
  title: {
    color: p.dark,
    fontSize: typography.base,
    fontWeight: '600',
    lineHeight: 19,
    marginBottom: spacing.xs,
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  catPill: {
    backgroundColor: 'rgba(11,107,58,0.1)',
    borderRadius: radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  catPillText: {
    color: p.green,
    fontSize: typography.xs,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  metaText: {
    color: p.greyDark,
    fontSize: typography.xs,
  },
  cardH: {
    width: 180,
    marginRight: spacing.md,
    backgroundColor: p.white,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: p.greyLight,
  },
  thumbWrapH: {
    width: '100%',
    height: 100,
    backgroundColor: p.whiteOff,
  },
  infoH: {
    padding: spacing.sm,
    gap: 4,
  },
  titleH: {
    color: p.dark,
    fontSize: typography.sm,
    fontWeight: '600',
    lineHeight: 17,
  },
  metaTextH: {
    color: p.greyDark,
    fontSize: typography.xs,
  },
});
