import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import api, { whatsappUrl } from '../utils/api';
import { formatNumber, timeAgo } from '../utils/format';
import { radius, spacing, typography } from '../utils/theme';
import MediaCard from './MediaCard';

const LOGO = require('../../assets/logo.png');

function commentAuthor(c) {
  return c?.auteur?.nom || c?.auteur || c?.user?.nom || c?.utilisateur?.nom || c?.nom || 'Utilisateur';
}
function commentText(c) {
  return c?.contenu || c?.texte || c?.commentaire || c?.message || '';
}

// Zone sous le lecteur, façon page « watch » de YouTube : titre, statistiques,
// chaîne, boutons d'action, description dépliable, commentaires, « À suivre ».
export default function WatchDetails({
  media, similar = [], onShare, onDownload, downloadIcon, downloadLabel, downloadActive, downloadProgress = 0,
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const settings = useSettings();
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsTotal, setCommentsTotal] = useState(media?.comments_count || 0);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!media?.slug) return undefined;
    let cancelled = false;
    api.getMediaComments(media.slug, { perPage: 20 })
      .then((res) => {
        if (cancelled || !res?.success) return;
        setComments(res.data?.items || []);
        setCommentsTotal(res.data?.meta?.total ?? (res.data?.items || []).length);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [media?.slug]);

  if (!media) return null;

  const meta = [
    `${media.views_formatted || '0'} vues`,
    timeAgo(media.published_at || media.created_at || media.date),
  ].filter(Boolean).join('  ');

  const contact = () => {
    const msg = `Bonjour ${settings.app_name} ${settings.app_subtitle}, j'ai regardé « ${media.titre} » dans l'application et j'aimerais avoir des conseils.`;
    Linking.openURL(whatsappUrl(settings.contact?.whatsapp, msg)).catch(() => {});
  };

  const openUp = (item) => router.push({ pathname: '/PlayerScreen', params: { slug: item.slug || item.id_media } });

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <View style={styles.block}>
        <Text style={styles.title}>{media.titre}</Text>
        <Text style={styles.meta}>
          {meta}
          {media.categorie_label ? <Text style={styles.tag}>{`  #${media.categorie_label}`}</Text> : null}
        </Text>
      </View>

      <View style={styles.channel}>
        <View style={styles.avatar}><Image source={LOGO} style={styles.avatarImg} resizeMode="contain" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.channelName} numberOfLines={1}>{`${settings.app_name} ${settings.app_subtitle}`.trim()}</Text>
          <Text style={styles.channelSub} numberOfLines={1}>{media.credits || 'Médecine naturelle'}</Text>
        </View>
        <TouchableOpacity style={styles.subscribe} onPress={contact} activeOpacity={0.85}>
          <Ionicons name="logo-whatsapp" size={15} color="#fff" />
          <Text style={styles.subscribeText}>Contacter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actions}>
        <View style={styles.pill}>
          <Ionicons name="thumbs-up-outline" size={17} color={palette.dark} />
          <Text style={styles.pillText}>{formatNumber(media.likes || 0)}</Text>
        </View>
        <TouchableOpacity style={styles.pill} onPress={onShare} activeOpacity={0.8}>
          <Ionicons name="arrow-redo-outline" size={17} color={palette.dark} />
          <Text style={styles.pillText}>Partager</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.pill, downloadActive && styles.pillActive]} onPress={onDownload} activeOpacity={0.8}>
          {downloadIcon}
          <Text style={[styles.pillText, downloadActive && { color: palette.green }]}>
            {downloadLabel}{downloadProgress > 0 && downloadProgress < 100 ? ` ${downloadProgress}%` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pill} onPress={() => router.push('/OfflineScreen')} activeOpacity={0.8}>
          <Ionicons name="library-outline" size={17} color={palette.dark} />
          <Text style={styles.pillText}>Mes téléchargements</Text>
        </TouchableOpacity>
      </ScrollView>

      {media.description ? (
        <TouchableOpacity style={styles.desc} onPress={() => setExpanded((v) => !v)} activeOpacity={0.85}>
          <Text style={styles.descMeta}>{meta}</Text>
          <Text style={styles.descText} numberOfLines={expanded ? undefined : 3}>{media.description}</Text>
          <Text style={styles.more}>{expanded ? 'Moins' : '…plus'}</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity style={styles.comments} onPress={() => setShowComments((v) => !v)} activeOpacity={0.85}>
        <View style={styles.commentsHead}>
          <Text style={styles.commentsTitle}>Commentaires</Text>
          <Text style={styles.commentsCount}>{formatNumber(commentsTotal)}</Text>
          <View style={{ flex: 1 }} />
          {comments.length > 0 ? (
            <Ionicons name={showComments ? 'chevron-up' : 'chevron-down'} size={18} color={palette.greyDark} />
          ) : null}
        </View>
        {comments.length === 0 ? (
          <Text style={styles.commentEmpty}>Aucun commentaire pour le moment.</Text>
        ) : (
          (showComments ? comments : comments.slice(0, 1)).map((c, i) => (
            <View key={String(c.uuid || c.id || i)} style={styles.comment}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentInitial}>{commentAuthor(c).charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.commentAuthor}>
                  {commentAuthor(c)}
                  <Text style={styles.commentTime}>{`  ${timeAgo(c.created_at || c.date)}`}</Text>
                </Text>
                <Text style={styles.commentText} numberOfLines={showComments ? undefined : 2}>{commentText(c)}</Text>
              </View>
            </View>
          ))
        )}
      </TouchableOpacity>

      {similar.length > 0 ? (
        <View style={styles.upNext}>
          <Text style={styles.upNextTitle}>À suivre</Text>
          {similar.map((item) => (
            <MediaCard key={String(item.slug || item.id_media)} item={item} variant="compact" onPress={openUp} />
          ))}
        </View>
      ) : null}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = (p) => StyleSheet.create({
  root: { flex: 1, backgroundColor: p.white },
  block: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  title: { color: p.dark, fontSize: typography.lg + 1, fontWeight: '700', lineHeight: 24 },
  meta: { color: p.greyDark, fontSize: typography.sm, marginTop: 6 },
  tag: { color: p.green, fontWeight: '700' },

  channel: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: p.white, overflow: 'hidden',
    borderWidth: 1.5, borderColor: p.gold, justifyContent: 'center', alignItems: 'center',
  },
  avatarImg: { width: 34, height: 34 },
  channelName: { color: p.dark, fontSize: typography.base, fontWeight: '700' },
  channelSub: { color: p.greyDark, fontSize: typography.xs + 1, marginTop: 1 },
  subscribe: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: p.green,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full,
  },
  subscribeText: { color: '#fff', fontWeight: '700', fontSize: typography.sm },

  actions: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: p.whiteOff,
    paddingHorizontal: 14, height: 36, borderRadius: radius.full,
  },
  pillActive: { backgroundColor: p.greenSoft },
  pillText: { color: p.dark, fontSize: typography.sm, fontWeight: '600' },

  desc: { marginHorizontal: spacing.md, backgroundColor: p.whiteOff, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  descMeta: { color: p.dark, fontSize: typography.sm, fontWeight: '700', marginBottom: 4 },
  descText: { color: p.dark, fontSize: typography.sm + 1, lineHeight: 19 },
  more: { color: p.dark, fontSize: typography.sm, fontWeight: '700', marginTop: 4 },

  comments: { marginHorizontal: spacing.md, backgroundColor: p.whiteOff, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  commentsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  commentsTitle: { color: p.dark, fontSize: typography.base, fontWeight: '700' },
  commentsCount: { color: p.greyDark, fontSize: typography.sm },
  commentEmpty: { color: p.greyDark, fontSize: typography.sm },
  comment: { flexDirection: 'row', gap: 10, marginTop: 6 },
  commentAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: p.gold, justifyContent: 'center', alignItems: 'center' },
  commentInitial: { color: '#fff', fontWeight: '800', fontSize: 12 },
  commentAuthor: { color: p.dark, fontSize: typography.xs + 1, fontWeight: '700' },
  commentTime: { color: p.greyDark, fontWeight: '400' },
  commentText: { color: p.dark, fontSize: typography.sm + 1, lineHeight: 18, marginTop: 1 },

  upNext: { paddingTop: spacing.xs },
  upNextTitle: { color: p.dark, fontSize: typography.lg, fontWeight: '700', paddingHorizontal: spacing.md, marginBottom: spacing.md },
});
