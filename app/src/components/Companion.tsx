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

const SKIN = '#EBBFA0';
const HAIR = '#6B4A2E';
const SHIRT = colors.lilac;
const SHIRT_SHADE = colors.lilacDeep;

// A soft brown-haired companion who jumps with arms up when celebrating.
// Breathes when idle, sways when working, tilts when checking in.
// All motion halts under prefers-reduced-motion.
export function Companion({ mood, size = 160 }: Props) {
  const breath = useSharedValue(1);
  const armLift = useSharedValue(0); // 0 = down, 1 = up-and-out (V)
  const tilt = useSharedValue(0);
  const jump = useSharedValue(0); // px translateY
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [celebrating, setCelebrating] = React.useState(mood === 'celebrating');

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReducedMotion,
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    setCelebrating(mood === 'celebrating');

    if (reducedMotion) {
      breath.value = 1;
      armLift.value = mood === 'celebrating' ? 1 : 0;
      tilt.value = 0;
      jump.value = 0;
      return;
    }

    // Breathing (ambient)
    breath.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    // Arms + jump on celebrate
    if (mood === 'celebrating') {
      armLift.value = withTiming(1, {
        duration: 260,
        easing: Easing.out(Easing.back(2)),
      });
      jump.value = withSequence(
        withTiming(-24, { duration: 220, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 260, easing: Easing.bounce }),
        withTiming(-10, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 220, easing: Easing.bounce }),
      );
    } else {
      armLift.value = withTiming(0, { duration: 400 });
      jump.value = withTiming(0, { duration: 240 });
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
  }, [mood, reducedMotion, armLift, breath, tilt, jump]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: jump.value },
      { scale: breath.value },
      { rotate: `${tilt.value}deg` },
    ],
  }));

  const armLeftStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-20 - armLift.value * 130}deg` }],
  }));
  const armRightStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${20 + armLift.value * 130}deg` }],
  }));

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Animated.View style={[{ width: size, height: size }, containerStyle]}>
        <Svg width={size} height={size} viewBox="0 0 160 160">
          {/* soft ground shadow */}
          <Ellipse cx={80} cy={148} rx={38} ry={4} fill={colors.lilacSoft} opacity={0.45} />

          {/* body / shirt */}
          <G>
            {/* torso */}
            <Path
              d="M50 100 Q50 88 62 86 L98 86 Q110 88 110 100 L112 140 Q112 148 104 148 L56 148 Q48 148 48 140 Z"
              fill={SHIRT}
            />
            {/* subtle shirt shading */}
            <Path
              d="M80 86 L80 148"
              stroke={SHIRT_SHADE}
              strokeWidth={1}
              opacity={0.18}
            />
            {/* neck */}
            <Path d="M74 82 L86 82 L86 92 L74 92 Z" fill={SKIN} />
          </G>

          {/* head + hair */}
          <G>
            {/* hair back layer (framing shoulders) */}
            <Path
              d="M52 58 Q52 34 80 32 Q108 34 108 58 L110 92 Q104 90 100 92 L100 74 Q80 82 60 74 L60 92 Q56 90 50 92 Z"
              fill={HAIR}
            />
            {/* face */}
            <Circle cx={80} cy={60} r={22} fill={SKIN} />
            {/* hair front (side-part fringe) */}
            <Path
              d="M58 54 Q68 40 82 42 Q98 42 104 56 Q98 50 88 52 Q78 56 66 60 Q60 60 58 54 Z"
              fill={HAIR}
            />
            {/* cheeks */}
            <Circle cx={70} cy={66} r={3.5} fill="#F2A088" opacity={0.55} />
            <Circle cx={90} cy={66} r={3.5} fill="#F2A088" opacity={0.55} />
            {/* eyes — closed happy arcs when celebrating, dots otherwise */}
            {celebrating ? (
              <>
                <Path
                  d="M69 58 Q73 54 77 58"
                  stroke={colors.ink}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
                <Path
                  d="M83 58 Q87 54 91 58"
                  stroke={colors.ink}
                  strokeWidth={2}
                  strokeLinecap="round"
                  fill="none"
                />
              </>
            ) : (
              <>
                <Circle cx={72} cy={58} r={2.4} fill={colors.ink} />
                <Circle cx={88} cy={58} r={2.4} fill={colors.ink} />
              </>
            )}
            {/* mouth — big open smile when celebrating, soft smile otherwise */}
            {celebrating ? (
              <Path
                d="M72 70 Q80 80 88 70 Q80 74 72 70 Z"
                fill={colors.ink}
                opacity={0.85}
              />
            ) : (
              <Path
                d="M74 70 Q80 74 86 70"
                stroke={colors.ink}
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                opacity={0.85}
              />
            )}
          </G>
        </Svg>

        {/* arms — separately rotated so they can wave up into a V */}
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: size * (56 / 160) - size * 0.18,
              top: size * (92 / 160),
              width: size * 0.2,
              height: size * 0.34,
              transformOrigin: 'top right' as any,
            },
            armLeftStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 32 56">
            {/* sleeve stub */}
            <Path
              d="M22 4 Q10 8 8 22"
              stroke={SHIRT_SHADE}
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
            />
            {/* forearm */}
            <Path
              d="M14 20 Q8 34 8 46"
              stroke={SKIN}
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
            />
            {/* hand */}
            <Circle cx={8} cy={48} r={5} fill={SKIN} />
          </Svg>
        </Animated.View>

        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              right: size * (56 / 160) - size * 0.18,
              top: size * (92 / 160),
              width: size * 0.2,
              height: size * 0.34,
              transformOrigin: 'top left' as any,
            },
            armRightStyle,
          ]}
        >
          <Svg width="100%" height="100%" viewBox="0 0 32 56">
            <Path
              d="M10 4 Q22 8 24 22"
              stroke={SHIRT_SHADE}
              strokeWidth={12}
              strokeLinecap="round"
              fill="none"
            />
            <Path
              d="M18 20 Q24 34 24 46"
              stroke={SKIN}
              strokeWidth={8}
              strokeLinecap="round"
              fill="none"
            />
            <Circle cx={24} cy={48} r={5} fill={SKIN} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
