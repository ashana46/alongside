import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store';
import { colors, radii, spacing, type } from '../src/theme';

const QUIET_START_OPTIONS = ['20:00', '21:00', '22:00', '23:00', '00:00'];
const QUIET_END_OPTIONS = ['06:00', '07:00', '08:00', '09:00', '10:00'];

export default function Settings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const quietStart = useStore((s) => s.quietStart);
  const quietEnd = useStore((s) => s.quietEnd);
  const setQuietHours = useStore((s) => s.setQuietHours);

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
        settings
      </Text>

      <View style={{ marginTop: spacing.xl }}>
        <Text style={{ ...type.body, color: colors.ink }}>quiet hours</Text>
        <Text style={{ ...type.small, color: colors.inkMuted, marginTop: spacing.xs }}>
          no gentle nudges during this window.
        </Text>

        <Text style={{ ...type.small, color: colors.inkMuted, marginTop: spacing.md }}>
          starts at
        </Text>
        <Row
          options={QUIET_START_OPTIONS}
          value={quietStart}
          onChange={(v) => setQuietHours(v, quietEnd)}
        />

        <Text style={{ ...type.small, color: colors.inkMuted, marginTop: spacing.md }}>
          until
        </Text>
        <Row
          options={QUIET_END_OPTIONS}
          value={quietEnd}
          onChange={(v) => setQuietHours(quietStart, v)}
        />
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <Text style={{ ...type.small, color: colors.inkMuted }}>
          alongside is an early prototype. it is not medical advice, a diagnosis,
          or a treatment for adhd.
        </Text>
      </View>
    </ScrollView>
  );
}

function Row({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.sm,
      }}
    >
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <Pressable
            key={opt}
            onPress={() => onChange(opt)}
            style={{
              backgroundColor: selected ? colors.lilacDeep : colors.paperDeep,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: radii.pill,
            }}
          >
            <Text
              style={{ ...type.small, color: selected ? '#fff' : colors.inkSoft }}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
