import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { log } from './log';

const IDLE_MINUTES = 10;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

function parseHM(hm: string): { h: number; m: number } {
  const [h, m] = hm.split(':').map((n) => parseInt(n, 10));
  return { h: h || 0, m: m || 0 };
}

// Returns true if `at` falls inside the quiet window, which may wrap midnight.
export function isQuiet(at: Date, start: string, end: string): boolean {
  const { h: sh, m: sm } = parseHM(start);
  const { h: eh, m: em } = parseHM(end);
  const mins = at.getHours() * 60 + at.getMinutes();
  const s = sh * 60 + sm;
  const e = eh * 60 + em;
  return s <= e ? mins >= s && mins < e : mins >= s || mins < e;
}

export async function scheduleIdleCheckIn(opts: {
  taskId: string;
  quietStart: string;
  quietEnd: string;
}): Promise<string | null> {
  try {
    if (Platform.OS === 'web') return null;
    const ok = await ensurePermission();
    if (!ok) {
      log('notif.perm.denied');
      return null;
    }
    const fireAt = new Date(Date.now() + IDLE_MINUTES * 60 * 1000);
    if (isQuiet(fireAt, opts.quietStart, opts.quietEnd)) {
      log('notif.suppressed.quiet_hours');
      return null;
    }
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'alongside',
        body: "still here whenever you're ready — want to pick this back up?",
        data: { taskId: opts.taskId, kind: 'idle-checkin' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: IDLE_MINUTES * 60,
      },
    });
    log('notification.scheduled', { kind: 'idle-checkin' });
    return id;
  } catch (e) {
    log('notif.schedule.fail', { error: String(e) });
    return null;
  }
}

export async function cancelScheduled(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
    log('notification.cancelled');
  } catch (e) {
    log('notif.cancel.fail', { error: String(e) });
  }
}
