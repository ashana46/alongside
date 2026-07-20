import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useStore } from '../src/store';
import { generateSteps } from '../src/steps';
import { colors, radii, spacing, type } from '../src/theme';
import { log } from '../src/log';

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default function NewLater() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createTask = useStore((s) => s.createTask);

  const [title, setTitle] = useState('');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const [when, setWhen] = useState<Date>(tomorrow);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');

  const onSave = async () => {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { steps } = await generateSteps(t);
      createTask(t, steps, fmt(when));
      log('task.create.later.success');
      router.back();
    } catch (e) {
      log('task.create.later.fail', { error: String(e) });
      setError("let's try again in a moment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.paper,
        paddingTop: insets.top + spacing.md,
        paddingHorizontal: spacing.lg,
      }}
    >
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={{ ...type.small, color: colors.inkSoft }}>← back</Text>
      </Pressable>
      <Text style={{ ...type.hero, color: colors.ink, marginTop: spacing.md }}>
        save something for later
      </Text>
      <Text style={{ ...type.small, color: colors.inkMuted, marginTop: spacing.xs }}>
        this stays tucked away until the day.
      </Text>

      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="what's on the horizon"
        placeholderTextColor={colors.inkMuted}
        multiline
        style={{
          ...type.body,
          color: colors.ink,
          backgroundColor: '#fff',
          borderRadius: radii.md,
          padding: spacing.md,
          minHeight: 56,
          marginTop: spacing.lg,
        }}
      />

      <Pressable
        onPress={() => setShowPicker((v) => !v)}
        style={{
          marginTop: spacing.md,
          backgroundColor: colors.paperDeep,
          borderRadius: radii.md,
          padding: spacing.md,
        }}
      >
        <Text style={{ ...type.small, color: colors.inkMuted }}>for</Text>
        <Text style={{ ...type.body, color: colors.ink, marginTop: 2 }}>{fmt(when)}</Text>
      </Pressable>
      {showPicker && (
        <DateTimePicker
          value={when}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, d) => {
            if (Platform.OS !== 'ios') setShowPicker(false);
            if (d) setWhen(d);
          }}
        />
      )}

      <Pressable
        disabled={busy || title.trim().length === 0}
        onPress={onSave}
        style={{
          marginTop: spacing.lg,
          backgroundColor:
            busy || title.trim().length === 0 ? colors.lilacSoft : colors.lilacDeep,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          alignItems: 'center',
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', ...type.body }}>save for later</Text>
        )}
      </Pressable>
      {error && (
        <Text
          style={{
            ...type.small,
            color: colors.inkSoft,
            marginTop: spacing.sm,
            textAlign: 'center',
          }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
