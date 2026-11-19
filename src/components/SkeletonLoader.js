import { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { radius, spacing } from '../utils/theme';

function Shimmer({ style }) {
  const { palette } = useTheme();
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          backgroundColor: palette.greyLight,
          borderRadius: radius.xs,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCarousel() {
  return (
    <View style={{ flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.md }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ width: 190, gap: spacing.sm }}>
          <Shimmer style={{ width: '100%', height: 106, borderRadius: radius.md }} />
          <Shimmer style={{ width: '85%', height: 14 }} />
          <Shimmer style={{ width: '55%', height: 10 }} />
        </View>
      ))}
    </View>
  );
}

export function SkeletonGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.md }}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ width: '47%', gap: spacing.xs, marginBottom: spacing.sm }}>
          <Shimmer style={{ width: '100%', height: 100, borderRadius: radius.md }} />
          <Shimmer style={{ width: '90%', height: 14 }} />
          <Shimmer style={{ width: '60%', height: 10 }} />
        </View>
      ))}
    </View>
  );
}
