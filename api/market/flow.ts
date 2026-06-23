export const config = { runtime: 'edge' };

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  try {
    const homeRes = await fetch('https://finance.yahoo.com/', {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      redirect: 'follow',
    });
    // Collect all Set-Cookie headers
    const raw = homeRes.headers.get('set-cookie') ?? '';
    // Pull out A3 and other relevant cookies
    const cookies: string[] = [];
    for (const line of raw.split(',')) {
      const m = line.trim().match(/^([A-Z0-9_]+=[^;]+)/);
      if (m) cookies.push(m[1]);
    }
    const cookie = cookies.join('; ');

    const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': UA, 'Cookie': cookie },
    });
    const crumb = await crumbRes.text();
    if (!crumb || crumb.startsWith('{') || crumb.length > 20) return null;
    return { crumb: crumb.trim(), cookie };
  } catch {
    return null;
  }
}

function raw(v: unknown): number {
  if (typeof v === 'object' && v !== null && 'raw' in v) return Number((v as { raw: unknown }).raw) || 0;
  return Number(v) || 0;
}
function fmt(v: unknown): string {
  if (typeof v === 'object' && v !== null && 'fmt' in v) return String((v as { fmt: unknown }).fmt);
  return String(v ?? '—');
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ticker = (url.searchParams.get('ticker') ?? '').replace(/\.JK$/i, '').toUpperCase().trim();
  if (!ticker) return json({ error: 'ticker required' }, 400);

  const auth = await getYahooCrumb();
  if (!auth) return json({ error: 'Could not obtain Yahoo session' }, 502);

  const { crumb, cookie } = auth;
  const symbol = `${ticker}.JK`;
  const modules = 'majorHoldersBreakdown,institutionOwnership';
  const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}&crumb=${encodeURIComponent(crumb)}`;

  const res = await fetch(summaryUrl, {
    headers: { 'User-Agent': UA, 'Cookie': cookie, 'Accept': 'application/json' },
  });

  if (!res.ok) return json({ error: `Yahoo returned ${res.status}` }, 502);

  const body = await res.json() as {
    quoteSummary?: {
      result?: {
        majorHoldersBreakdown?: {
          insidersPercentHeld?: unknown;
          institutionsPercentHeld?: unknown;
          institutionsFloatPercentHeld?: unknown;
          institutionsCount?: unknown;
        };
        institutionOwnership?: {
          ownershipList?: {
            organization?: unknown;
            reportDate?: unknown;
            pctHeld?: unknown;
            position?: unknown;
            value?: unknown;
            pctChange?: unknown;
          }[];
        };
      }[];
      error?: unknown;
    };
  };

  const result = body.quoteSummary?.result?.[0];
  if (!result) return json({ error: 'No data', detail: body.quoteSummary?.error }, 404);

  const mh = result.majorHoldersBreakdown ?? {};
  const io = result.institutionOwnership?.ownershipList ?? [];

  const insiderPct        = raw(mh.insidersPercentHeld) * 100;
  const institutionPct    = raw(mh.institutionsPercentHeld) * 100;
  const retailPct         = Math.max(0, 100 - insiderPct - institutionPct);

  const topHolders = io.slice(0, 8).map((h) => ({
    name:       String(h.organization ?? ''),
    reportDate: fmt(h.reportDate),
    pctHeld:    raw(h.pctHeld) * 100,
    position:   raw(h.position),
    value:      raw(h.value),
    pctChange:  raw(h.pctChange) * 100,
  }));

  return json({
    ticker,
    symbol,
    insider:     { pct: insiderPct },
    institution: { pct: institutionPct, count: raw(mh.institutionsCount) },
    retail:      { pct: retailPct },
    topHolders,
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
