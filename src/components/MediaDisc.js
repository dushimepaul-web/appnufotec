import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing, typography } from '../utils/theme';

const LOGO = require('../../assets/logo.png');
const TURN_MS = 9000; // durée d'un tour de disque
const SKIP_MS = 60000; // boutons « 1 minute »
const RATES = [1, 1.25, 1.5, 2, 0.75];

// Disque façon vinyle : anneau doré, sillons, logo NUFOTEC au centre.
// `spinning` le fait tourner (il s'arrête sur place quand on met en pause).
export function Disc({ size, spinning = false }) {
  const { palette } = useTheme();
  const [rotation] = useState(() => new Animated.Value(0));
  const angle = useRef(0);
  const spinningRef = useRef(spinning);

  useEffect(() => {
    const id = rotation.addListener(({ value }) => { angle.current = value; });
    return () => rotation.removeListener(id);
  }, [rotation]);

  useEffect(() => {
    spinningRef.current = spinning;
    if (!spinning) { rotation.stopAnimation(); return undefined; }
    const turn = () => {
      Animated.timing(rotation, {
        toValue: angle.current + 1,
        duration: TURN_MS,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }).start(({ finished }) => { if (finished && spinningRef.current) turn(); });
    };
    turn();
    return () => rotation.stopAnimation();
  }, [spinning, rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'], extrapolate: 'extend' });
  const ring = (ratio, opacity) => ({
    position: 'absolute', width: size * ratio, height: size * ratio, borderRadius: (size * ratio) / 2,
    borderWidth: 1, borderColor: `rgba(255,255,255,${opacity})`,
  });
  const label = size * 0.4;

  return (
    <View style={{ width: size * 1.12, height: size * 1.12, borderRadius: size * 0.56, backgroundColor: `${palette.gold}22`, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View
        style={{
          width: size, height: size, borderRadius: size / 2, backgroundColor: palette.media,
          borderWidth: Math.max(2, size * 0.035), borderColor: palette.gold,
          justifyContent: 'center', alignItems: 'center', transform: [{ rotate }],
        }}
      >
        <View style={ring(0.86, 0.07)} />
        <View style={ring(0.72, 0.1)} />
        <View style={ring(0.58, 0.07)} />
        <View style={{ width: label, height: label, borderRadius: label / 2, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          <Image source={LOGO} style={{ width: label * 0.86, height: label * 0.86 }} resizeMode="contain" />
        </View>
      </Animated.View>
    </View>
  );
}

// Miniature des audios et documents (comme sur nufotec.com/medias).
export function MediaThumb({ type, small = false }) {
  const { palette } = useTheme();
  const [h, setH] = useState(0);
  const isAudio = type === 'audio';
  const icon = isAudio ? 'musical-notes' : 'document-text';
  const badge = small ? 22 : 34;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: palette.greenDark, justifyContent: 'center', alignItems: 'center' }]} onLayout={(e) => setH(e.nativeEvent.layout.height)}>
      {h > 0 ? <Disc size={h * 0.72} /> : null}
      <View style={{ position: 'absolute', top: small ? 6 : 10, left: small ? 6 : 10, width: badge, height: badge, borderRadius: badge / 2, backgroundColor: palette.gold, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={badge * 0.5} color={palette.media} />
      </View>
      {!small ? (
        <View style={{ position: 'absolute', left: 12, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Ionicons name={isAudio ? 'headset-outline' : 'reader-outline'} size={14} color={palette.gold} />
          <Text style={{ color: palette.gold, fontSize: 12, fontWeight: '800', letterSpacing: 2 }}>{isAudio ? 'AUDIO' : 'DOCUMENT'}</Text>
        </View>
      ) : null}
    </View>
  );
}

const fmt = (ms) => {
  if (!ms || ms < 0 || !Number.isFinite(ms)) return '0:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const sec = String(total % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};

export const AUDIO_DECK_HEIGHT = 470;

// Lecteur audio : disque qui tourne, barre de progression, précédent / −1 min /
// lecture / +1 min / suivant, et vitesse de lecture.
export function AudioDeck({
  media, isPlaying, position = 0, duration = 0, onPlayPause, onSeek, onPrev, onNext, rate = 1, onRate, isOffline,
}) {
  const { palette } = useTheme();
  const styles = useMemo(() => s(palette), [palette]);
  const [trackW, setTrackW] = useState(0);
  const [seek, setSeek] = useState(null);

  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const shown = seek ?? progress;
  const ratioAt = (x) => Math.max(0, Math.min(1, x / (trackW || 1)));
  const skip = (delta) => { if (duration > 0) onSeek?.(Math.max(0, Math.min(duration, position + delta))); };
  const nextRate = () => onRate?.(RATES[(RATES.indexOf(rate) + 1) % RATES.length]);

  return (
    <View style={styles.deck}>
      <Disc size={170} spinning={isPlaying} />
      <View style={styles.kicker}>
        <Ionicons name="headset-outline" size={13} color={palette.gold} />
        <Text style={styles.kickerText}>AUDIO NUFOTEC</Text>
        {isOffline ? <Text style={styles.offline}>· HORS-LIGNE</Text> : null}
      </View>
      <Text style={styles.title} numberOfLines={2}>{media?.titre}</Text>
      <Text style={styles.artist} numberOfLines={1}>{media?.credits || 'NUFOTEC BURUNDI'}</Text>

      <View
        style={styles.track}
        onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => setSeek(ratioAt(e.nativeEvent.locationX))}
        onResponderMove={(e) => setSeek(ratioAt(e.nativeEvent.locationX))}
        onResponderRelease={(e) => { const r = ratioAt(e.nativeEvent.locationX); setSeek(null); if (duration > 0) onSeek?.(r * duration); }}
      >
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: `${shown * 100}%` }]} />
        <View style={[styles.thumb, { left: `${shown * 100}%` }]} />
      </View>
      <View style={styles.times}>
        <Text style={styles.time}>{fmt(seek != null ? seek * duration : position)}</Text>
        <Text style={styles.time}>{fmt(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={[styles.ctrl, !onPrev && styles.ctrlOff]} onPress={onPrev} disabled={!onPrev} accessibilityLabel="Média précédent">
          <Ionicons name="play-skip-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrl} onPress={() => skip(-SKIP_MS)} accessibilityLabel="Reculer d'une minute">
          <Ionicons name="refresh" size={22} color="#FFFFFF" style={{ transform: [{ scaleX: -1 }] }} />
          <Text style={styles.ctrlLabel}>1 min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.play} onPress={onPlayPause} activeOpacity={0.85} accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color={palette.media} style={!isPlaying && { marginLeft: 3 }} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.ctrl} onPress={() => skip(SKIP_MS)} accessibilityLabel="Avancer d'une minute">
          <Ionicons name="refresh" size={22} color="#FFFFFF" />
          <Text style={styles.ctrlLabel}>1 min</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.ctrl, !onNext && styles.ctrlOff]} onPress={onNext} disabled={!onNext} accessibilityLabel="Média suivant">
          <Ionicons name="play-skip-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      {onRate ? (
        <TouchableOpacity style={styles.rate} onPress={nextRate} accessibilityLabel="Vitesse de lecture">
          <Text style={styles.rateText}>{`${rate}×`}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const s = (p) => StyleSheet.create({
  deck: { height: AUDIO_DECK_HEIGHT, backgroundColor: p.greenDark, alignItems: 'center', paddingTop: spacing.lg, paddingHorizontal: spacing.xl },
  kicker: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.md },
  kickerText: { color: p.gold, fontSize: typography.xs, fontWeight: '800', letterSpacing: 1.5 },
  offline: { color: p.goldLight, fontSize: typography.xs, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: typography.lg, fontWeight: '800', textAlign: 'center', marginTop: 6, lineHeight: 22 },
  artist: { color: 'rgba(255,255,255,0.7)', fontSize: typography.sm, marginTop: 2 },
  track: { width: '100%', height: 24, justifyContent: 'center', marginTop: spacing.md },
  trackBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.22)' },
  trackFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, backgroundColor: p.gold },
  thumb: { position: 'absolute', width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: '#FFFFFF', borderWidth: 3, borderColor: p.gold },
  times: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  time: { color: 'rgba(255,255,255,0.75)', fontSize: typography.xs },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  ctrl: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  ctrlOff: { opacity: 0.35 },
  ctrlLabel: { position: 'absolute', bottom: 2, color: '#FFFFFF', fontSize: 7, fontWeight: '800' },
  play: { width: 66, height: 66, borderRadius: 33, backgroundColor: p.gold, justifyContent: 'center', alignItems: 'center' },
  rate: { marginTop: spacing.sm, paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  rateText: { color: '#FFFFFF', fontSize: typography.sm, fontWeight: '700' },
});
