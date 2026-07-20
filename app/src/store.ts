import { create } from 'zustand';
import * as db from './db';
import { log } from './log';

export type StepStatus = 'pending' | 'done' | 'skipped';
export type TaskStatus = 'active' | 'parked' | 'archived' | 'done';

export interface Step {
  id: string;
  text: string;
  source: 'ai' | 'user';
  status: StepStatus;
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  focused: boolean;
  steps: Step[];
  byWhen?: string; // ISO date (YYYY-MM-DD)
  createdAt: number;
}

export interface Rhythm {
  id: string;
  title: string;
  cue: string;
  lastDoneAt?: number;
  createdAt: number;
}

export interface RhythmEvent {
  id: string;
  rhythmId: string;
  doneAt: number;
  feltLike?: 'easy' | 'okay' | 'hard';
}

export const ACTIVE_CAP = 4;
export const DEFAULT_QUIET_START = '22:00';
export const DEFAULT_QUIET_END = '08:00';

interface Store {
  hydrated: boolean;
  tasks: Record<string, Task>;
  rhythms: Record<string, Rhythm>;
  rhythmEvents: RhythmEvent[];
  quietStart: string;
  quietEnd: string;

  hydrate: () => Promise<void>;

  createTask: (title: string, steps: string[], byWhen?: string) => string;
  focusTask: (id: string) => void;
  parkTask: (id: string) => void;
  archiveTask: (id: string) => void;
  setByWhen: (id: string, byWhen: string | undefined) => void;
  completeStep: (taskId: string, stepId: string) => void;
  skipStep: (taskId: string, stepId: string) => void;
  editStep: (taskId: string, stepId: string, text: string) => void;
  splitStep: (taskId: string, stepId: string, into: string[]) => void;
  addStep: (taskId: string, text: string) => void;
  activeCount: () => number;

  createRhythm: (title: string, cue: string) => string;
  markRhythmDone: (id: string, feltLike?: 'easy' | 'okay' | 'hard') => void;
  deleteRhythm: (id: string) => void;

  setQuietHours: (start: string, end: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

export const useStore = create<Store>((set, get) => ({
  hydrated: false,
  tasks: {},
  rhythms: {},
  rhythmEvents: [],
  quietStart: DEFAULT_QUIET_START,
  quietEnd: DEFAULT_QUIET_END,

  hydrate: async () => {
    const { tasks, rhythms, events, settings } = await db.loadAll();
    const tasksMap: Record<string, Task> = {};
    for (const t of tasks) tasksMap[t.id] = t;
    const rhythmsMap: Record<string, Rhythm> = {};
    for (const r of rhythms) rhythmsMap[r.id] = r;
    set({
      hydrated: true,
      tasks: tasksMap,
      rhythms: rhythmsMap,
      rhythmEvents: events,
      quietStart: settings.quietStart ?? DEFAULT_QUIET_START,
      quietEnd: settings.quietEnd ?? DEFAULT_QUIET_END,
    });
    log('store.hydrated');
  },

  createTask: (title, stepTexts, byWhen) => {
    const id = uid();
    const steps: Step[] = stepTexts.map((text) => ({
      id: uid(),
      text,
      source: 'ai',
      status: 'pending',
    }));
    const isBacklog = byWhen && byWhen > todayISO();
    set((s) => {
      const nextTasks = { ...s.tasks };
      if (!isBacklog) {
        for (const t of Object.values(nextTasks)) {
          if (t.focused) {
            const parked = { ...t, focused: false, status: 'parked' as TaskStatus };
            nextTasks[t.id] = parked;
            db.upsertTask(parked).catch(() => {});
          }
        }
      }
      const newTask: Task = {
        id,
        title,
        status: 'active',
        focused: !isBacklog,
        steps,
        byWhen,
        createdAt: Date.now(),
      };
      nextTasks[id] = newTask;
      db.upsertTask(newTask).catch(() => {});
      return { tasks: nextTasks };
    });
    return id;
  },

  focusTask: (id) => {
    set((s) => {
      const nextTasks = { ...s.tasks };
      for (const t of Object.values(nextTasks)) {
        if (t.id === id) {
          const updated = { ...t, focused: true, status: 'active' as TaskStatus };
          nextTasks[t.id] = updated;
          db.upsertTask(updated).catch(() => {});
        } else if (t.focused) {
          const parked = { ...t, focused: false, status: 'parked' as TaskStatus };
          nextTasks[t.id] = parked;
          db.upsertTask(parked).catch(() => {});
        }
      }
      return { tasks: nextTasks };
    });
  },

  parkTask: (id) => {
    const t = get().tasks[id];
    if (!t) return;
    const updated = { ...t, focused: false, status: 'parked' as TaskStatus };
    set((s) => ({ tasks: { ...s.tasks, [id]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  archiveTask: (id) => {
    const t = get().tasks[id];
    if (!t) return;
    const updated = { ...t, focused: false, status: 'archived' as TaskStatus };
    set((s) => ({ tasks: { ...s.tasks, [id]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  setByWhen: (id, byWhen) => {
    const t = get().tasks[id];
    if (!t) return;
    const updated = { ...t, byWhen };
    set((s) => ({ tasks: { ...s.tasks, [id]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  completeStep: (taskId, stepId) => {
    const t = get().tasks[taskId];
    if (!t) return;
    const steps = t.steps.map((st) =>
      st.id === stepId ? { ...st, status: 'done' as StepStatus } : st,
    );
    const allDone = steps.every((st) => st.status !== 'pending');
    const updated: Task = {
      ...t,
      steps,
      status: allDone ? 'done' : t.status,
      focused: allDone ? false : t.focused,
    };
    set((s) => ({ tasks: { ...s.tasks, [taskId]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  skipStep: (taskId, stepId) => {
    const t = get().tasks[taskId];
    if (!t) return;
    const updated = {
      ...t,
      steps: t.steps.map((st) =>
        st.id === stepId ? { ...st, status: 'skipped' as StepStatus } : st,
      ),
    };
    set((s) => ({ tasks: { ...s.tasks, [taskId]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  editStep: (taskId, stepId, text) => {
    const t = get().tasks[taskId];
    if (!t) return;
    const updated = {
      ...t,
      steps: t.steps.map((st) =>
        st.id === stepId ? { ...st, text, source: 'user' as const } : st,
      ),
    };
    set((s) => ({ tasks: { ...s.tasks, [taskId]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  splitStep: (taskId, stepId, into) => {
    const t = get().tasks[taskId];
    if (!t) return;
    const idx = t.steps.findIndex((st) => st.id === stepId);
    if (idx < 0) return;
    const newSteps: Step[] = into.map((text) => ({
      id: uid(),
      text,
      source: 'ai',
      status: 'pending',
    }));
    const updated = {
      ...t,
      steps: [...t.steps.slice(0, idx), ...newSteps, ...t.steps.slice(idx + 1)],
    };
    set((s) => ({ tasks: { ...s.tasks, [taskId]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  addStep: (taskId, text) => {
    const t = get().tasks[taskId];
    if (!t) return;
    const updated = {
      ...t,
      steps: [
        ...t.steps,
        { id: uid(), text, source: 'user' as const, status: 'pending' as StepStatus },
      ],
    };
    set((s) => ({ tasks: { ...s.tasks, [taskId]: updated } }));
    db.upsertTask(updated).catch(() => {});
  },

  activeCount: () =>
    Object.values(get().tasks).filter(
      (t) => (t.status === 'active' || t.status === 'parked') && !isBacklog(t),
    ).length,

  createRhythm: (title, cue) => {
    const id = uid();
    const r: Rhythm = { id, title, cue, createdAt: Date.now() };
    set((s) => ({ rhythms: { ...s.rhythms, [id]: r } }));
    db.upsertRhythm(r).catch(() => {});
    return id;
  },

  markRhythmDone: (id, feltLike) => {
    const r = get().rhythms[id];
    if (!r) return;
    const now = Date.now();
    const updated = { ...r, lastDoneAt: now };
    const ev: RhythmEvent = {
      id: uid(),
      rhythmId: id,
      doneAt: now,
      feltLike,
    };
    set((s) => ({
      rhythms: { ...s.rhythms, [id]: updated },
      rhythmEvents: [...s.rhythmEvents, ev],
    }));
    db.upsertRhythm(updated).catch(() => {});
    db.insertRhythmEvent(ev).catch(() => {});
  },

  deleteRhythm: (id) => {
    set((s) => {
      const { [id]: _, ...rest } = s.rhythms;
      return {
        rhythms: rest,
        rhythmEvents: s.rhythmEvents.filter((e) => e.rhythmId !== id),
      };
    });
    db.deleteRhythm(id).catch(() => {});
  },

  setQuietHours: (start, end) => {
    set({ quietStart: start, quietEnd: end });
    db.setSetting('quietStart', start).catch(() => {});
    db.setSetting('quietEnd', end).catch(() => {});
  },
}));

export function isBacklog(t: Task): boolean {
  return !!t.byWhen && t.byWhen > todayISO();
}

export function isDueToday(t: Task): boolean {
  return !!t.byWhen && t.byWhen === todayISO();
}

export const selectFocused = (s: Store): Task | undefined =>
  Object.values(s.tasks).find((t) => t.focused);

export const selectParked = (s: Store): Task[] =>
  Object.values(s.tasks).filter((t) => t.status === 'parked' && !isBacklog(t));

export const selectBacklog = (s: Store): Task[] =>
  Object.values(s.tasks)
    .filter((t) => (t.status === 'active' || t.status === 'parked') && isBacklog(t))
    .sort((a, b) => (a.byWhen ?? '').localeCompare(b.byWhen ?? ''));

export const selectDueToday = (s: Store): Task[] =>
  Object.values(s.tasks).filter(
    (t) => (t.status === 'active' || t.status === 'parked') && isDueToday(t) && !t.focused,
  );
