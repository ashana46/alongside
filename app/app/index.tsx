import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ACTIVE_CAP,
  selectBacklog,
  selectDueToday,
  selectFocused,
  selectParked,
  useStore,
} from '../src/store';
import { generateSteps } from '../src/steps';
import { log } from '../src/log';
import { colors, radii, spacing, type } from '../src/theme';
import { Companion } from '../src/components/Companion';

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBacklog, setShowBacklog] = useState(false);

  const focused = useStore(selectFocused);
  const parked = useStore(selectParked);
  const backlog = useStore(selectBacklog);
  const dueToday = useStore(selectDueToday);
  const rhythmCount = useStore((s) => Object.keys(s.rhythms).length);
  const activeCount = useStore((s) => s.activeCount());
  const createTask = useStore((s) => s.createTask);
  const focusTask = useStore((s) => s.focusTask);

  const atCap = activeCount >= ACTIVE_CAP;

  const onSubmit = async () => {
    const t = title.trim();
    if (!t || busy) return;
    if (atCap) {
      Alert.alert(
        'A gentle pause',
        'You have a few things going already. Want to finish one or let one go before adding more?',
      );
      return;
    }
    setBusy(true);
    setError(null);
    log('task.create.start');
    try {
      const { steps } = await generateSteps(t);
      const id = createTask(t, steps);
      setTitle('');
      log('task.create.success');
      router.push(`/focus/${id}`);
    } catch (e) {
      log('task.create.fail', { error: String(e) });
      setError("let's try again in a moment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.lg,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text style={{ ...type.small, color: colors.inkMuted }}>alongside</Text>
        <Pressable onPress={() => router.push('/settings')} hitSlop={12}>
          <Text style={{ ...type.small, color: colors.inkMuted }}>settings</Text>
        </Pressable>
      </View>
      <Text
        style={{
          ...type.hero,
          color: colors.ink,
          marginTop: spacing.xs,
          marginBottom: spacing.lg,
        }}
      >
        {focused ? "what you're on" : 'what shall we do together?'}
      </Text>

      {focused ? (
        <FocusCard onOpen={() => router.push(`/focus/${focused.id}`)} />
      ) : (
        <NewTaskInput
          title={title}
          setTitle={setTitle}
          onSubmit={onSubmit}
          busy={busy}
          error={error}
          atCap={atCap}
        />
      )}

      {dueToday.length > 0 && (
        <View style={{ marginTop: spacing.lg }}>
          <Text
            style={{ ...type.small, color: colors.inkMuted, marginBottom: spacing.sm }}
          >
            something for today, when you're ready
          </Text>
          {dueToday.map((t) => (
            <TaskRow
              key={t.id}
              title={t.title}
              subtitle={`${t.steps.filter((s) => s.status === 'done').length} of ${t.steps.length}`}
              onPress={() => {
                focusTask(t.id);
                router.push(`/focus/${t.id}`);
              }}
            />
          ))}
        </View>
      )}

      {parked.length > 0 && (
        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              ...type.small,
              color: colors.inkMuted,
              marginBottom: spacing.sm,
            }}
          >
            waiting for you
          </Text>
          {parked.map((p) => (
            <TaskRow
              key={p.id}
              title={p.title}
              subtitle={`${p.steps.filter((s) => s.status === 'done').length} of ${p.steps.length} done`}
              onPress={() => {
                focusTask(p.id);
                router.push(`/focus/${p.id}`);
              }}
            />
          ))}
        </View>
      )}

      {focused && !atCap && (
        <View style={{ marginTop: spacing.xl }}>
          <Text
            style={{
              ...type.small,
              color: colors.inkMuted,
              marginBottom: spacing.sm,
            }}
          >
            add another (up to {ACTIVE_CAP})
          </Text>
          <NewTaskInput
            title={title}
            setTitle={setTitle}
            onSubmit={onSubmit}
            busy={busy}
            error={error}
            atCap={atCap}
          />
        </View>
      )}

      <View
        style={{
          marginTop: spacing.xxl,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          paddingTop: spacing.lg,
          gap: spacing.md,
        }}
      >
        <Pressable
          onPress={() => router.push('/rhythms')}
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <Text style={{ ...type.body, color: colors.inkSoft }}>rhythms</Text>
          <Text style={{ ...type.small, color: colors.inkMuted }}>
            {rhythmCount === 0 ? 'set gentle routines' : `${rhythmCount}`}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setShowBacklog((v) => !v)}
          style={{ flexDirection: 'row', justifyContent: 'space-between' }}
        >
          <Text style={{ ...type.body, color: colors.inkSoft }}>later</Text>
          <Text style={{ ...type.small, color: colors.inkMuted }}>
            {backlog.length === 0 ? 'nothing scheduled' : `${backlog.length}`}
          </Text>
        </Pressable>

        {showBacklog &&
          backlog.map((t) => (
            <View
              key={t.id}
              style={{
                backgroundColor: colors.paperDeep,
                borderRadius: radii.md,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
              }}
            >
              <Text style={{ ...type.body, color: colors.ink }} numberOfLines={1}>
                {t.title}
              </Text>
              <Text style={{ ...type.tiny, color: colors.inkMuted, marginTop: 2 }}>
                for {t.byWhen}
              </Text>
            </View>
          ))}

        {showBacklog && (
          <Pressable
            onPress={() => router.push('/new-later')}
            style={{
              borderRadius: radii.pill,
              paddingVertical: spacing.sm,
              alignItems: 'center',
              backgroundColor: colors.paperDeep,
            }}
          >
            <Text style={{ ...type.small, color: colors.inkSoft }}>
              + save something for later
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

function TaskRow({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.paperDeep,
        borderRadius: radii.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.sm,
      }}
    >
      <Text style={{ ...type.body, color: colors.ink }} numberOfLines={1}>
        {title}
      </Text>
      <Text style={{ ...type.tiny, color: colors.inkMuted, marginTop: 2 }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function FocusCard({ onOpen }: { onOpen: () => void }) {
  const focused = useStore(selectFocused)!;
  const done = focused.steps.filter((s) => s.status === 'done').length;
  return (
    <Pressable
      onPress={onOpen}
      style={{
        backgroundColor: colors.lilac,
        borderRadius: radii.lg,
        padding: spacing.lg,
        shadowColor: colors.cardShadow,
        shadowOpacity: 1,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
        <Companion mood="working" size={120} />
      </View>
      <Text style={{ ...type.title, color: '#fff' }} numberOfLines={2}>
        {focused.title}
      </Text>
      <Text
        style={{ ...type.small, color: 'rgba(255,255,255,0.85)', marginTop: spacing.xs }}
      >
        {done} of {focused.steps.length} done · tap to continue
      </Text>
    </Pressable>
  );
}

function NewTaskInput({
  title,
  setTitle,
  onSubmit,
  busy,
  error,
  atCap,
}: {
  title: string;
  setTitle: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  error: string | null;
  atCap: boolean;
}) {
  return (
    <View>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="pack for the trip · answer that email · tidy the kitchen"
        placeholderTextColor={colors.inkMuted}
        style={{
          ...type.body,
          color: colors.ink,
          backgroundColor: '#fff',
          borderRadius: radii.md,
          padding: spacing.md,
          minHeight: 56,
        }}
        editable={!busy && !atCap}
        multiline
        onSubmitEditing={onSubmit}
        returnKeyType="go"
      />
      <Pressable
        disabled={busy || atCap || title.trim().length === 0}
        onPress={onSubmit}
        style={{
          marginTop: spacing.md,
          backgroundColor:
            busy || atCap || title.trim().length === 0 ? colors.lilacSoft : colors.lilacDeep,
          borderRadius: radii.pill,
          paddingVertical: spacing.md,
          alignItems: 'center',
        }}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', ...type.body }}>let's begin</Text>
        )}
      </Pressable>
      {error && (
        <Text
          style={{ ...type.small, color: colors.inkSoft, marginTop: spacing.sm, textAlign: 'center' }}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
