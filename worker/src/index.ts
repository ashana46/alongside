// Alongside — AI proxy.
// Endpoints:
//   POST /steps  { taskTitle, targetStepCount? } -> { steps: string[] }
//   POST /split  { taskTitle, stepText }         -> { steps: string[] }  (2-3 tinier pieces)
//   GET  /health -> { ok: true }
// Deliberately does not log or persist task/step text. Only latency + status codes.

export interface Env {
  ANTHROPIC_API_KEY: string;
  MODEL: string;
  MAX_STEPS: string;
}

const STEPS_SYSTEM = `You are a gentle helper for someone with ADHD who has trouble starting tasks.
Given a task the user names, break it into 3 to {MAX} tiny, concrete, physical first actions.
Rules:
- The first step must be near-trivial — completable in 2 minutes.
- Each step is one sentence, present tense, starts with a verb.
- Use warm, calm, non-imperative language. No exclamation points.
- No numbering, no bullets — return JSON only.
- Never mention deadlines, streaks, or discipline.
- Never imply the user is behind or lazy.
Return strictly this JSON shape: {"steps": ["...", "..."]}`;

const SPLIT_SYSTEM = `You are a gentle helper for someone with ADHD who finds their current step too big.
Given the overall task and the specific step that feels heavy, break that step into 2 or 3 even tinier physical actions.
Rules:
- Each tiny action is one sentence, present tense, starts with a verb.
- Each tiny action must be completable in under 2 minutes on its own.
- Warm, calm, no exclamation points, no discipline language.
- Return JSON only, no prose.
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

    if (url.pathname === '/steps' && req.method === 'POST') {
      return handleSteps(req, env);
    }
    if (url.pathname === '/split' && req.method === 'POST') {
      return handleSplit(req, env);
    }
    return json(404, { error: 'not_found' });
  },
};

async function handleSteps(req: Request, env: Env): Promise<Response> {
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
  try {
    const steps = await callClaude(
      env,
      STEPS_SYSTEM.replace('{MAX}', String(max)),
      `Task: ${taskTitle}`,
      500,
    );
    console.log(
      JSON.stringify({ event: 'steps.ok', latency_ms: Date.now() - t0, count: steps.length }),
    );
    return json(200, { steps });
  } catch (err) {
    console.log(
      JSON.stringify({ event: 'steps.fail', latency_ms: Date.now() - t0, error: String(err) }),
    );
    return json(502, { error: 'upstream_failed' });
  }
}

async function handleSplit(req: Request, env: Env): Promise<Response> {
  let payload: { taskTitle?: string; stepText?: string };
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: 'bad_json' });
  }
  const taskTitle = (payload.taskTitle ?? '').trim();
  const stepText = (payload.stepText ?? '').trim();
  if (!taskTitle || !stepText || taskTitle.length > 500 || stepText.length > 500) {
    return json(400, { error: 'bad_input' });
  }
  const t0 = Date.now();
  try {
    const steps = await callClaude(
      env,
      SPLIT_SYSTEM,
      `Task: ${taskTitle}\nHeavy step: ${stepText}`,
      300,
    );
    const trimmed = steps.slice(0, 3);
    console.log(
      JSON.stringify({ event: 'split.ok', latency_ms: Date.now() - t0, count: trimmed.length }),
    );
    return json(200, { steps: trimmed });
  } catch (err) {
    console.log(
      JSON.stringify({ event: 'split.fail', latency_ms: Date.now() - t0, error: String(err) }),
    );
    return json(502, { error: 'upstream_failed' });
  }
}

async function callClaude(
  env: Env,
  system: string,
  userContent: string,
  maxTokens: number,
): Promise<string[]> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: env.MODEL || 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
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
