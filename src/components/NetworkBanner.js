import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useNetwork } from '../contexts/NetworkContext';
import { palette, spacing, typography } from '../utils/theme';

export default function NetworkBanner() {
  const { isConnected } = useNetwork();
  const slideAnim = useRef(new Animated.Value(isConnected ? -60 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isConnected ? -60 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline-outline" size={18} color={palette.white} />
        <View style={styles.textWrap}>
          <Text style={styles.title}>Connexion perdue</Text>
          <Text style={styles.sub}>Certaines fonctionnalités nécessitent une connexion Internet</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
    backgroundColor: '#C8102E',
    paddingTop: 50,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  textWrap: { flex: 1 },
  title: { color: palette.white, fontSize: typography.sm, fontWeight: '700' },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 1, lineHeight: 14 },
});
