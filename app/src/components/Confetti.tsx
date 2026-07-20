import React, { useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme';

interface Props {
  fire: number; // increment to trigger a burst
  intensity?: 'small' | 'big';
}

const CONFETTI_COLORS = [
  colors.lilac,
  colors.lilacDeep,
  colors.apricot,
  colors.apricotSoft,
  colors.lilacSoft,
];

function Piece({
  seed,
  fireKey,
  spread,
}: {
  seed: number;
  fireKey: number;
  spread: number;
}) {
  const y = useSharedValue(0);
  const x = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rot = useSharedValue(0);

  useEffect(() => {
    const jitter = (seed % 100) / 100;
    const dir = seed % 2 === 0 ? 1 : -1;
    x.value = 0;
    y.value = 0;
    opacity.value = 1;
    rot.value = 0;
    x.value = withTiming(dir * (spread * (0.4 + jitter)), {
      duration: 1100,
      easing: Easing.out(Easing.quad),
    });
    y.value = withTiming(-140 - jitter * 80, {
      duration: 700,
      easing: Easing.out(Easing.quad),
    });
    setTimeout(() => {
      y.value = withTiming(220, { duration: 900, easing: Easing.in(Easing.quad) });
    }, 700);
    rot.value = withTiming(720 * (jitter > 0.5 ? 1 : -1), { duration: 1600 });
    opacity.value = withDelay(1200, withTiming(0, { duration: 400 }));
  }, [fireKey, seed, spread, opacity, rot, x, y]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${rot.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const color = CONFETTI_COLORS[seed % CONFETTI_COLORS.length];
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 12,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function Confetti({ fire, intensity = 'small' }: Props) {
  const count = intensity === 'big' ? 40 : 22;
  const spread = Dimensions.get('window').width * 0.5;
  if (fire === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Piece key={`${fire}-${i}`} seed={fire * 31 + i * 7} fireKey={fire} spread={spread} />
      ))}
    </View>
  );
}
