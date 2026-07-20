import Constants from 'expo-constants';
import { log } from './log';

const WORKER_URL =
  (Constants.expoConfig?.extra as any)?.workerUrl ??
  process.env.EXPO_PUBLIC_WORKER_URL ??
  'http://localhost:8787';

export interface GenerateResult {
  steps: string[];
  source: 'on-device' | 'proxy' | 'offline-fallback';
}

// v0 stub: on-device model detection is future work. Returns null so we always
// fall through to the proxy for now. Wire in Apple Intelligence / Gemini Nano
// via native modules in a later iteration.
async function tryOnDevice(_taskTitle: string): Promise<string[] | null> {
  log('steps.on_device.unavailable');
  return null;
}

async function callProxy(
  taskTitle: string,
  targetStepCount = 5,
): Promise<string[]> {
  const start = Date.now();
  log('steps.proxy.request');
  const res = await fetch(`${WORKER_URL}/steps`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ taskTitle, targetStepCount }),
  });
  const latency = Date.now() - start;
  log('steps.proxy.response', { status: res.status, latency_ms: latency });
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  const data = (await res.json()) as { steps?: string[] };
  if (!Array.isArray(data.steps) || data.steps.length === 0) {
    throw new Error('proxy returned no steps');
  }
  return data.steps;
}

export async function generateSteps(taskTitle: string): Promise<GenerateResult> {
  const onDevice = await tryOnDevice(taskTitle);
  if (onDevice) return { steps: onDevice, source: 'on-device' };

  try {
    const steps = await callProxy(taskTitle);
    return { steps, source: 'proxy' };
  } catch (err) {
    log('steps.generate.fail', { error: String(err) });
    throw err;
  }
}
