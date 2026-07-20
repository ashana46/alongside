import { create } from 'zustand';

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
  byWhen?: string;
  createdAt: number;
}

export const ACTIVE_CAP = 4;

interface Store {
  tasks: Record<string, Task>;
  order: string[];
  createTask: (title: string, steps: string[]) => string;
  focusTask: (id: string) => void;
  parkTask: (id: string) => void;
  archiveTask: (id: string) => void;
  completeStep: (taskId: string, stepId: string) => void;
  skipStep: (taskId: string, stepId: string) => void;
  editStep: (taskId: string, stepId: string, text: string) => void;
  splitStep: (taskId: string, stepId: string, into: string[]) => void;
  addStep: (taskId: string, text: string) => void;
  activeCount: () => number;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<Store>((set, get) => ({
  tasks: {},
  order: [],

  createTask: (title, stepTexts) => {
    const id = uid();
    const steps: Step[] = stepTexts.map((text) => ({
      id: uid(),
      text,
      source: 'ai',
      status: 'pending',
    }));
    set((s) => {
      const nextTasks = { ...s.tasks };
      // If another task is focused, park it — only one focus at a time.
      for (const t of Object.values(nextTasks)) {
        if (t.focused) nextTasks[t.id] = { ...t, focused: false, status: 'parked' };
      }
      nextTasks[id] = {
        id,
        title,
        status: 'active',
        focused: true,
        steps,
        createdAt: Date.now(),
      };
      return { tasks: nextTasks, order: [id, ...s.order] };
    });
    return id;
  },

  focusTask: (id) =>
    set((s) => {
      const nextTasks = { ...s.tasks };
      for (const t of Object.values(nextTasks)) {
        if (t.id === id) {
          nextTasks[t.id] = { ...t, focused: true, status: 'active' };
        } else if (t.focused) {
          nextTasks[t.id] = { ...t, focused: false, status: 'parked' };
        }
      }
      return { tasks: nextTasks };
    }),

  parkTask: (id) =>
    set((s) => {
      const t = s.tasks[id];
      if (!t) return s;
      return { tasks: { ...s.tasks, [id]: { ...t, focused: false, status: 'parked' } } };
    }),

  archiveTask: (id) =>
    set((s) => {
      const t = s.tasks[id];
      if (!t) return s;
      return {
        tasks: { ...s.tasks, [id]: { ...t, focused: false, status: 'archived' } },
      };
    }),

  completeStep: (taskId, stepId) =>
    set((s) => {
      const t = s.tasks[taskId];
      if (!t) return s;
      const steps = t.steps.map((st) =>
        st.id === stepId ? { ...st, status: 'done' as StepStatus } : st,
      );
      const allDone = steps.every((st) => st.status !== 'pending');
      return {
        tasks: {
          ...s.tasks,
          [taskId]: {
            ...t,
            steps,
            status: allDone ? 'done' : t.status,
            focused: allDone ? false : t.focused,
          },
        },
      };
    }),

  skipStep: (taskId, stepId) =>
    set((s) => {
      const t = s.tasks[taskId];
      if (!t) return s;
      return {
        tasks: {
          ...s.tasks,
          [taskId]: {
            ...t,
            steps: t.steps.map((st) =>
              st.id === stepId ? { ...st, status: 'skipped' } : st,
            ),
          },
        },
      };
    }),

  editStep: (taskId, stepId, text) =>
    set((s) => {
      const t = s.tasks[taskId];
      if (!t) return s;
      return {
        tasks: {
          ...s.tasks,
          [taskId]: {
            ...t,
            steps: t.steps.map((st) =>
              st.id === stepId ? { ...st, text, source: 'user' } : st,
            ),
          },
        },
      };
    }),

  splitStep: (taskId, stepId, into) =>
    set((s) => {
      const t = s.tasks[taskId];
      if (!t) return s;
      const idx = t.steps.findIndex((st) => st.id === stepId);
      if (idx < 0) return s;
      const newSteps: Step[] = into.map((text) => ({
        id: uid(),
        text,
        source: 'ai',
        status: 'pending',
      }));
      return {
        tasks: {
          ...s.tasks,
          [taskId]: {
            ...t,
            steps: [...t.steps.slice(0, idx), ...newSteps, ...t.steps.slice(idx + 1)],
          },
        },
      };
    }),

  addStep: (taskId, text) =>
    set((s) => {
      const t = s.tasks[taskId];
      if (!t) return s;
      return {
        tasks: {
          ...s.tasks,
          [taskId]: {
            ...t,
            steps: [
              ...t.steps,
              { id: uid(), text, source: 'user', status: 'pending' },
            ],
          },
        },
      };
    }),

  activeCount: () =>
    Object.values(get().tasks).filter((t) => t.status === 'active' || t.status === 'parked')
      .length,
}));

export const selectFocused = (s: Store): Task | undefined =>
  Object.values(s.tasks).find((t) => t.focused);

export const selectParked = (s: Store): Task[] =>
  Object.values(s.tasks).filter((t) => t.status === 'parked');

export const selectActiveTasks = (s: Store): Task[] =>
  Object.values(s.tasks).filter((t) => t.status === 'active' || t.status === 'parked');
