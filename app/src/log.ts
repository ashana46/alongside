// Operational logging — never includes task titles or step contents.
// Keeps a small in-memory ring buffer so a future Diagnostics screen can display it.

type LogEntry = { at: number; event: string; data?: Record<string, unknown> };

const BUFFER_MAX = 200;
const buffer: LogEntry[] = [];

export function log(event: string, data?: Record<string, unknown>) {
  const entry = { at: Date.now(), event, data };
  buffer.push(entry);
  if (buffer.length > BUFFER_MAX) buffer.shift();
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[alongside] ${event}`, data ?? '');
  }
}

export function readLog(): readonly LogEntry[] {
  return buffer;
}
