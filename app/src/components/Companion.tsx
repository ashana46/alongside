import React, { useEffect } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path, G } from 'react-native-svg';
import { colors } from '../theme';

export type CompanionMood = 'idle' | 'working' | 'celebrating' | 'checking-in';

interface Props {
  mood: CompanionMood;
  size?: number;
}

// Original lilac companion — soft, non-humanoid figure.
// Breathes when idle, gently sways when working, raises arms + smiles on celebrate,
// tilts to check in when quiet. All motion halts under reduced-motion.
export function Companion({ mood, size = 160 }: Props) {
  const breath = useSharedValue(1);
  const armLift = useSharedValue(0); // 0 = down, 1 = up
  const tilt = useSharedValue(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      breath.value = 1;
      armLift.value = mood === 'celebrating' ? 1 : 0;
      tilt.value = 0;
      return;
    }
    // Breathing
    breath.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    // Arms
    if (mood === 'celebrating') {
      armLift.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.6)) });
    } else {
      armLift.value = withTiming(0, { duration: 500 });
    }
    // Tilt
    if (mood === 'checking-in') {
      tilt.value = withRepeat(
        withSequence(
          withTiming(-4, { duration: 800 }),
          withTiming(4, { duration: 800 }),
          withTiming(0, { duration: 800 }),
        ),
        -1,
        false,
      );
    } else if (mood === 'working') {
      tilt.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 2000 }),
          withTiming(-1.5, { duration: 2000 }),
        ),
        -1,
        true,
      );
    } else {
      tilt.value = withTiming(0, { duration: 500 });
    }
  }, [mood, reducedMotion, armLift, breath, tilt]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breath.value },
      { rotate: `${tilt.value}deg` },
    ],
  }));

  const armStyleLeft = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-15 - armLift.value * 90}deg` }],
  }));
  const armStyleRight = useAnimatedStyle(() => ({
    transform: [{ rotate: `${15 + armLift.value * 90}deg` }],
  }));

  const smiling = mood === 'celebrating';

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[{ width: size, height: size }, containerStyle]}>
        <Svg width={size} height={size} viewBox="0 0 160 160">
          {/* soft ground shadow */}
          <Ellipse cx={80} cy={142} rx={40} ry={5} fill={colors.lilacSoft} opacity={0.5} />
          {/* body */}
          <G>
            <Path
              d="M40 78 Q40 40 80 40 Q120 40 120 78 L120 118 Q120 130 108 130 L52 130 Q40 130 40 118 Z"
              fill={colors.lilac}
            />
            {/* face */}
            <Circle cx={68} cy={78} r={4} fill={colors.ink} />
            <Circle cx={92} cy={78} r={4} fill={colors.ink} />
            {smiling ? (
              <Path
                d="M66 94 Q80 108 94 94"
                stroke={colors.ink}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <Path
                d="M68 96 Q80 102 92 96"
                stroke={colors.ink}
                strokeWidth={3}
                strokeLinecap="round"
                fill="none"
                opacity={0.85}
              />
            )}
            {/* soft cheek */}
            <Circle cx={62} cy={90} r={5} fill={colors.apricotSoft} opacity={0.6} />
            <Circle cx={98} cy={90} r={5} fill={colors.apricotSoft} opacity={0.6} />
          </G>
        </Svg>
        {/* arms — separate absolutely-positioned SVGs so we can rotate them */}
        <Animated.View
          style={[
            {
              position: 'absolute',
              left: size * 0.12,
              top: size * 0.5,
              width: size * 0.25,
              height: size * 0.5,
              transformOrigin: 'top right' as any,
            },
            armStyleLeft,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 40 80">
            <Path
              d="M32 4 Q22 30 18 60"
              stroke={colors.lilacDeep}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
        <Animated.View
          style={[
            {
              position: 'absolute',
              right: size * 0.12,
              top: size * 0.5,
              width: size * 0.25,
              height: size * 0.5,
              transformOrigin: 'top left' as any,
            },
            armStyleRight,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 40 80">
            <Path
              d="M8 4 Q18 30 22 60"
              stroke={colors.lilacDeep}
              strokeWidth={10}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
