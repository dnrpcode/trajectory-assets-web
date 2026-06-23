export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = 'https://trajectory-assets.vercel.app';
const DEFAULT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL   = 'google/gemma-3-27b-it:free';
const MAX_TOKENS      = 1024;
const MAX_HISTORY     = 20;
const MAX_PROMPT_LEN  = 8000;
const MAX_MSG_LEN     = 2000;

type OpenAIMessage  = { role: 'system' | 'user' | 'assistant'; content: string };
type OpenAIResponse = { choices: Array<{ message: { content: string } }> };
type OpenAIError    = { error?: { message?: string } };

function corsHeaders(origin: string) {
  const allowed = origin === ALLOWED_ORIGIN || origin.endsWith('.vercel.app')
    ? origin
    : ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function json(data: unknown, status = 200, origin = ''): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin') ?? '';

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);

  const apiKey = (process.env.AI_API_KEY ?? '').trim();
  const apiUrl = (process.env.AI_API_URL ?? DEFAULT_API_URL).trim();
  const model  = (process.env.AI_MODEL  ?? DEFAULT_MODEL).trim();

  if (!apiKey) return json({ error: 'AI service not configured' }, 503, origin);

  let body: { systemPrompt?: unknown; history?: unknown; userMessage?: unknown };
  try {
    body = await req.json() as typeof body;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400, origin);
  }

  const { systemPrompt, history, userMessage } = body;

  // Validate inputs
  if (typeof systemPrompt !== 'string' || systemPrompt.length > MAX_PROMPT_LEN)
    return json({ error: 'Invalid systemPrompt' }, 400, origin);

  if (!Array.isArray(history) || history.length > MAX_HISTORY)
    return json({ error: 'Invalid history' }, 400, origin);

  if (typeof userMessage !== 'string' || userMessage.trim().length === 0 || userMessage.length > MAX_MSG_LEN)
    return json({ error: 'Invalid userMessage' }, 400, origin);

  // Validate each history message shape
  const validRoles = new Set(['user', 'assistant']);
  for (const msg of history) {
    if (
      typeof msg !== 'object' || msg === null ||
      !validRoles.has((msg as { role?: string }).role ?? '') ||
      typeof (msg as { content?: string }).content !== 'string'
    ) return json({ error: 'Invalid history message' }, 400, origin);
  }

  const messages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    ...(history as OpenAIMessage[]),
    { role: 'user', content: userMessage.trim() },
  ];

  const upstream = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': ALLOWED_ORIGIN,
      'X-Title': 'Trajectory Robo Advisor',
    },
    body: JSON.stringify({ model, max_tokens: MAX_TOKENS, messages }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({})) as OpenAIError;
    const msg = err.error?.message ?? `AI API error ${upstream.status}`;
    return json({ error: msg }, upstream.status >= 500 ? 502 : upstream.status, origin);
  }

  const data = await upstream.json() as OpenAIResponse;
  const content = data.choices[0]?.message?.content ?? '';
  return json({ content }, 200, origin);
}
