import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStore } from '../../src/store';
import { colors, radii, spacing, type } from '../../src/theme';
import { Companion, CompanionMood } from '../../src/components/Companion';
import { Confetti } from '../../src/components/Confetti';
import { log } from '../../src/log';

const IDLE_MS = 10 * 60 * 1000; // 10 minutes
const PHASE_SIZE = 4;

export default function FocusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const task = useStore((s) => (id ? s.tasks[id] : undefined));
  const completeStep = useStore((s) => s.completeStep);
  const skipStep = useStore((s) => s.skipStep);
  const splitStep = useStore((s) => s.splitStep);
  const parkTask = useStore((s) => s.parkTask);

  const [confettiFire, setConfettiFire] = useState(0);
  const [bigConfetti, setBigConfetti] = useState(false);
  const [mood, setMood] = useState<CompanionMood>('working');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdle = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setMood('working');
    idleTimer.current = setTimeout(() => {
      setMood('checking-in');
      log('idle.checkin.shown');
    }, IDLE_MS);
  };

  useEffect(() => {
    resetIdle();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [id]);

  const currentStep = useMemo(
    () => task?.steps.find((s) => s.status === 'pending'),
    [task],
  );

  const doneCount = task?.steps.filter((s) => s.status !== 'pending').length ?? 0;
  const totalCount = task?.steps.length ?? 0;

  const currentPhaseSteps = useMemo(() => {
    if (!task) return [];
    // group in phases of PHASE_SIZE — dots for the current phase
    const idx = task.steps.findIndex((s) => s.status === 'pending');
    const anchor = idx < 0 ? task.steps.length - 1 : idx;
    const phase = Math.floor(anchor / PHASE_SIZE);
    return task.steps.slice(phase * PHASE_SIZE, (phase + 1) * PHASE_SIZE);
  }, [task]);

  const phaseCount = Math.max(1, Math.ceil(totalCount / PHASE_SIZE));
  const currentPhaseIdx = currentStep
    ? Math.floor(task!.steps.indexOf(currentStep) / PHASE_SIZE)
    : phaseCount - 1;

  if (!task) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...type.body, color: colors.inkMuted }}>this task is gone</Text>
      </View>
    );
  }

  const onComplete = () => {
    if (!currentStep) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setMood('celebrating');
    setConfettiFire((n) => n + 1);
    log('celebration.played');
    completeStep(task.id, currentStep.id);
    // detect if this was the last step
    const remainingAfter = task.steps.filter(
      (s) => s.id !== currentStep.id && s.status === 'pending',
    ).length;
    if (remainingAfter === 0) {
      setBigConfetti(true);
      setTimeout(() => {
        setBigConfetti(false);
        router.back();
      }, 2200);
    } else {
      setTimeout(() => setMood('working'), 1400);
      resetIdle();
    }
  };

  const onSkip = () => {
    if (!currentStep) return;
    skipStep(task.id, currentStep.id);
    resetIdle();
  };

  const onSplit = () => {
    if (!currentStep) return;
    // v0: naive split — halves the current step into two smaller placeholders.
    // A future iteration will call the AI for a real breakdown.
    splitStep(task.id, currentStep.id, [
      `part 1: start "${currentStep.text.toLowerCase()}"`,
      `part 2: finish "${currentStep.text.toLowerCase()}"`,
    ]);
    resetIdle();
  };

  const onBack = () => {
    parkTask(task.id);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <View
        style={{
          paddingTop: insets.top + spacing.md,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={{ ...type.small, color: colors.inkSoft }}>← back to tasks</Text>
        </Pressable>
        <Text style={{ ...type.tiny, color: colors.inkMuted }}>
          {phaseCount > 1 ? `phase ${currentPhaseIdx + 1} of ${phaseCount}` : ' '}
        </Text>
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        {/* overall bar */}
        <View
          style={{
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.paperDeep,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${totalCount === 0 ? 0 : (doneCount / totalCount) * 100}%`,
              height: '100%',
              backgroundColor: colors.lilac,
              borderRadius: 3,
            }}
          />
        </View>
        <Text
          style={{
            ...type.tiny,
            color: colors.inkMuted,
            marginTop: spacing.xs,
            textAlign: 'right',
          }}
        >
          {doneCount} of {totalCount} done
        </Text>
      </View>

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Companion mood={mood} size={180} />
      </View>

      <View
        style={{
          marginTop: spacing.lg,
          marginHorizontal: spacing.lg,
          backgroundColor: '#fff',
          borderRadius: radii.lg,
          padding: spacing.xl,
          minHeight: 180,
          shadowColor: colors.cardShadow,
          shadowOpacity: 1,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        {currentStep ? (
          <>
            <Text style={{ ...type.small, color: colors.inkMuted, marginBottom: spacing.sm }}>
              next
            </Text>
            <Text style={{ ...type.title, color: colors.ink }}>{currentStep.text}</Text>
          </>
        ) : (
          <Text style={{ ...type.title, color: colors.ink }}>all done — beautifully.</Text>
        )}

        {/* phase dots */}
        <View style={{ flexDirection: 'row', marginTop: spacing.lg, gap: 8 }}>
          {currentPhaseSteps.map((s) => (
            <View
              key={s.id}
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor:
                  s.status === 'done'
                    ? colors.lilacDeep
                    : s.status === 'skipped'
                    ? colors.lilacSoft
                    : colors.paperDeep,
                borderWidth: currentStep?.id === s.id ? 2 : 0,
                borderColor: colors.lilac,
              }}
            />
          ))}
        </View>
      </View>

      {currentStep && (
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg, gap: spacing.sm }}>
          <Pressable
            onPress={onComplete}
            style={{
              backgroundColor: colors.lilacDeep,
              borderRadius: radii.pill,
              paddingVertical: spacing.md,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', ...type.body }}>done ·  next</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={onSplit}
              style={{
                flex: 1,
                borderRadius: radii.pill,
                paddingVertical: spacing.sm,
                alignItems: 'center',
                backgroundColor: colors.paperDeep,
              }}
            >
              <Text style={{ ...type.small, color: colors.inkSoft }}>
                too heavy? split it
              </Text>
            </Pressable>
            <Pressable
              onPress={onSkip}
              style={{
                flex: 1,
                borderRadius: radii.pill,
                paddingVertical: spacing.sm,
                alignItems: 'center',
                backgroundColor: colors.paperDeep,
              }}
            >
              <Text style={{ ...type.small, color: colors.inkSoft }}>skip</Text>
            </Pressable>
          </View>
        </View>
      )}

      {mood === 'checking-in' && currentStep && (
        <View
          style={{
            marginTop: spacing.lg,
            marginHorizontal: spacing.lg,
            backgroundColor: colors.paperDeep,
            borderRadius: radii.md,
            padding: spacing.md,
          }}
        >
          <Text style={{ ...type.small, color: colors.inkSoft, textAlign: 'center' }}>
            still here whenever you're ready — want to pick this back up?
          </Text>
        </View>
      )}

      <Confetti fire={confettiFire} intensity={bigConfetti ? 'big' : 'small'} />
    </View>
  );
}
