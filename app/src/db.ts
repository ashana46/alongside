import * as SQLite from 'expo-sqlite';
import type { Rhythm, RhythmEvent, Task } from './store';
import { log } from './log';

let dbInstance: SQLite.SQLiteDatabase | null = null;

async function db(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('alongside.db');
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      focused INTEGER NOT NULL,
      by_when TEXT,
      created_at INTEGER NOT NULL,
      steps_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rhythms (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      cue TEXT NOT NULL,
      last_done_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS rhythm_events (
      id TEXT PRIMARY KEY,
      rhythm_id TEXT NOT NULL,
      done_at INTEGER NOT NULL,
      felt_like TEXT
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  return dbInstance;
}

export interface PersistedState {
  tasks: Task[];
  rhythms: Rhythm[];
  events: RhythmEvent[];
  settings: Record<string, string>;
}

export async function loadAll(): Promise<PersistedState> {
  try {
    const d = await db();
    const taskRows = await d.getAllAsync<{
      id: string;
      title: string;
      status: string;
      focused: number;
      by_when: string | null;
      created_at: number;
      steps_json: string;
    }>('SELECT * FROM tasks');
    const tasks: Task[] = taskRows.map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status as Task['status'],
      focused: !!r.focused,
      byWhen: r.by_when ?? undefined,
      createdAt: r.created_at,
      steps: JSON.parse(r.steps_json),
    }));

    const rhythmRows = await d.getAllAsync<{
      id: string;
      title: string;
      cue: string;
      last_done_at: number | null;
      created_at: number;
    }>('SELECT * FROM rhythms');
    const rhythms: Rhythm[] = rhythmRows.map((r) => ({
      id: r.id,
      title: r.title,
      cue: r.cue,
      lastDoneAt: r.last_done_at ?? undefined,
      createdAt: r.created_at,
    }));

    const eventRows = await d.getAllAsync<{
      id: string;
      rhythm_id: string;
      done_at: number;
      felt_like: string | null;
    }>('SELECT * FROM rhythm_events');
    const events: RhythmEvent[] = eventRows.map((r) => ({
      id: r.id,
      rhythmId: r.rhythm_id,
      doneAt: r.done_at,
      feltLike: (r.felt_like ?? undefined) as RhythmEvent['feltLike'],
    }));

    const settingRows = await d.getAllAsync<{ key: string; value: string }>(
      'SELECT * FROM settings',
    );
    const settings: Record<string, string> = {};
    for (const s of settingRows) settings[s.key] = s.value;

    log('db.load.ok', { tasks: tasks.length, rhythms: rhythms.length });
    return { tasks, rhythms, events, settings };
  } catch (e) {
    log('db.load.fail', { error: String(e) });
    return { tasks: [], rhythms: [], events: [], settings: {} };
  }
}

export async function upsertTask(t: Task): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT INTO tasks (id, title, status, focused, by_when, created_at, steps_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title,
       status=excluded.status,
       focused=excluded.focused,
       by_when=excluded.by_when,
       steps_json=excluded.steps_json`,
    [
      t.id,
      t.title,
      t.status,
      t.focused ? 1 : 0,
      t.byWhen ?? null,
      t.createdAt,
      JSON.stringify(t.steps),
    ],
  );
}

export async function deleteTask(id: string): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
}

export async function upsertRhythm(r: Rhythm): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT INTO rhythms (id, title, cue, last_done_at, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       title=excluded.title,
       cue=excluded.cue,
       last_done_at=excluded.last_done_at`,
    [r.id, r.title, r.cue, r.lastDoneAt ?? null, r.createdAt],
  );
}

export async function deleteRhythm(id: string): Promise<void> {
  const d = await db();
  await d.runAsync('DELETE FROM rhythms WHERE id = ?', [id]);
  await d.runAsync('DELETE FROM rhythm_events WHERE rhythm_id = ?', [id]);
}

export async function insertRhythmEvent(e: RhythmEvent): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT INTO rhythm_events (id, rhythm_id, done_at, felt_like) VALUES (?, ?, ?, ?)`,
    [e.id, e.rhythmId, e.doneAt, e.feltLike ?? null],
  );
}

export async function setSetting(key: string, value: string): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [key, value],
  );
}
