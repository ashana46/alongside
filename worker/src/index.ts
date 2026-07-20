// Alongside — AI proxy.
// Accepts { taskTitle, targetStepCount? } and returns { steps: string[] }.
// Deliberately does not log or persist task text. Only latency + status codes.

export interface Env {
  ANTHROPIC_API_KEY: string;
  MODEL: string;
  MAX_STEPS: string;
}

const SYSTEM_PROMPT = `You are a gentle helper for someone with ADHD who has trouble starting tasks.
Given a task the user names, break it into 3 to {MAX} tiny, concrete, physical first actions.
Rules:
- The first step must be near-trivial — completable in 2 minutes.
- Each step is one sentence, present tense, starts with a verb.
- Use warm, calm, non-imperative language. No exclamation points.
- No numbering, no bullets — return JSON only.
- Never mention deadlines, streaks, or discipline.
- Never imply the user is behind or lazy.
Return strictly this JSON shape: {"steps": ["...", "..."]}`;

function cors(): HeadersInit {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
  };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors() },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors() });

    const url = new URL(req.url);
    if (url.pathname === '/health') return json(200, { ok: true });
    if (url.pathname !== '/steps' || req.method !== 'POST') {
      return json(404, { error: 'not_found' });
    }

    let payload: { taskTitle?: string; targetStepCount?: number };
    try {
      payload = await req.json();
    } catch {
      return json(400, { error: 'bad_json' });
    }

    const taskTitle = (payload.taskTitle ?? '').trim();
    if (!taskTitle || taskTitle.length > 500) {
      return json(400, { error: 'bad_task_title' });
    }
    const max = Math.min(
      parseInt(env.MAX_STEPS ?? '8', 10) || 8,
      Math.max(3, payload.targetStepCount ?? 5),
    );

    const t0 = Date.now();
    let steps: string[];
    try {
      steps = await callClaude(env, taskTitle, max);
    } catch (err) {
      console.log(
        JSON.stringify({ event: 'claude.fail', latency_ms: Date.now() - t0, error: String(err) }),
      );
      return json(502, { error: 'upstream_failed' });
    }
    console.log(
      JSON.stringify({ event: 'claude.ok', latency_ms: Date.now() - t0, count: steps.length }),
    );

    return json(200, { steps });
  },
};

async function callClaude(env: Env, taskTitle: string, max: number): Promise<string[]> {
  const system = SYSTEM_PROMPT.replace('{MAX}', String(max));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system,
      messages: [
        {
          role: 'user',
          content: `Task: ${taskTitle}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`anthropic ${res.status}`);
  }
  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (data.content ?? [])
    .filter((c) => c.type === 'text')
    .map((c) => c.text ?? '')
    .join('');

  const parsed = extractSteps(text);
  if (!parsed) throw new Error('no_steps_parsed');
  return parsed;
}

function extractSteps(text: string): string[] | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]) as { steps?: unknown };
    if (!Array.isArray(obj.steps)) return null;
    const cleaned = obj.steps
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 240);
    return cleaned.length > 0 ? cleaned : null;
  } catch {
    return null;
  }
}
