import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore, Rhythm } from '../src/store';
import { colors, radii, spacing, type } from '../src/theme';
import { Companion } from '../src/components/Companion';
import { Confetti } from '../src/components/Confetti';

// Rhythms is deliberately built without streaks, chains, or day-counts.
// Same-size reward every time — presence + cue-anchoring is the mechanism.

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function doneToday(r: Rhythm): boolean {
  if (!r.lastDoneAt) return false;
  return new Date(r.lastDoneAt).toISOString().slice(0, 10) === todayISO();
}

export default function Rhythms() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const rhythms = useStore((s) => Object.values(s.rhythms));
  const createRhythm = useStore((s) => s.createRhythm);
  const markDone = useStore((s) => s.markRhythmDone);
  const deleteRhythm = useStore((s) => s.deleteRhythm);

  const [title, setTitle] = useState('');
  const [cue, setCue] = useState('');
  const [confetti, setConfetti] = useState(0);
  const [askFelt, setAskFelt] = useState<string | null>(null);

  const onAdd = () => {
    const t = title.trim();
    const c = cue.trim();
    if (!t || !c) return;
    createRhythm(t, c);
    setTitle('');
    setCue('');
  };

  const onDone = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    markDone(id);
    setConfetti((n) => n + 1);
    setAskFelt(id);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.md,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={{ ...type.small, color: colors.inkSoft }}>← back</Text>
      </Pressable>
      <Text style={{ ...type.hero, color: colors.ink, marginTop: spacing.md }}>
        rhythms
      </Text>
      <Text style={{ ...type.small, color: colors.inkMuted, marginTop: spacing.xs }}>
        gentle routines anchored to something you already do. no streaks, no counts.
      </Text>

      <View style={{ alignItems: 'center', marginTop: spacing.lg }}>
        <Companion mood="idle" size={120} />
      </View>

      {rhythms.length === 0 ? (
        <Text
          style={{
            ...type.body,
            color: colors.inkMuted,
            textAlign: 'center',
            marginTop: spacing.md,
          }}
        >
          nothing yet — try adding one below.
        </Text>
      ) : (
        <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
          {rhythms.map((r) => {
            const done = doneToday(r);
            return (
              <View
                key={r.id}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: radii.md,
                  padding: spacing.md,
                }}
              >
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between' }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ ...type.body, color: colors.ink }}>{r.title}</Text>
                    <Text
                      style={{ ...type.tiny, color: colors.inkMuted, marginTop: 2 }}
                    >
                      after {r.cue}
                    </Text>
                  </View>
                  <Pressable
                    onLongPress={() =>
                      Alert.alert('let this rhythm go?', '', [
                        { text: 'keep it', style: 'cancel' },
                        {
                          text: 'let it go',
                          style: 'destructive',
                          onPress: () => deleteRhythm(r.id),
                        },
                      ])
                    }
                    onPress={() => !done && onDone(r.id)}
                    style={{
                      backgroundColor: done ? colors.lilacSoft : colors.lilacDeep,
                      borderRadius: radii.pill,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#fff', ...type.small }}>
                      {done ? 'today · done' : 'mark done'}
                    </Text>
                  </Pressable>
                </View>
                {askFelt === r.id && (
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: spacing.sm,
                      marginTop: spacing.md,
                    }}
                  >
                    <Text style={{ ...type.small, color: colors.inkSoft, flex: 1 }}>
                      how did that feel?
                    </Text>
                    {(['easy', 'okay', 'hard'] as const).map((f) => (
                      <Pressable
                        key={f}
                        onPress={() => {
                          markDone(r.id, f);
                          setAskFelt(null);
                        }}
                        style={{
                          borderRadius: radii.pill,
                          paddingHorizontal: spacing.md,
                          paddingVertical: 4,
                          backgroundColor: colors.paperDeep,
                        }}
                      >
                        <Text style={{ ...type.small, color: colors.inkSoft }}>
                          {f}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <View
        style={{
          marginTop: spacing.xl,
          backgroundColor: '#fff',
          borderRadius: radii.md,
          padding: spacing.md,
        }}
      >
        <Text style={{ ...type.small, color: colors.inkMuted }}>add a rhythm</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="what · e.g., take meds"
          placeholderTextColor={colors.inkMuted}
          style={{
            ...type.body,
            color: colors.ink,
            backgroundColor: colors.paperDeep,
            borderRadius: radii.md,
            padding: spacing.md,
            marginTop: spacing.sm,
          }}
        />
        <TextInput
          value={cue}
          onChangeText={setCue}
          placeholder="after · e.g., my morning coffee"
          placeholderTextColor={colors.inkMuted}
          style={{
            ...type.body,
            color: colors.ink,
            backgroundColor: colors.paperDeep,
            borderRadius: radii.md,
            padding: spacing.md,
            marginTop: spacing.sm,
          }}
        />
        <Pressable
          disabled={title.trim().length === 0 || cue.trim().length === 0}
          onPress={onAdd}
          style={{
            marginTop: spacing.md,
            backgroundColor:
              title.trim().length === 0 || cue.trim().length === 0
                ? colors.lilacSoft
                : colors.lilacDeep,
            borderRadius: radii.pill,
            paddingVertical: spacing.sm,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', ...type.small }}>add rhythm</Text>
        </Pressable>
      </View>

      <Confetti fire={confetti} />
    </ScrollView>
  );
}
