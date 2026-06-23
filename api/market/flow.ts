export const config = { runtime: 'edge' };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const ticker = (url.searchParams.get('ticker') ?? '').replace(/\.JK$/i, '').toUpperCase().trim();
  if (!ticker) return json({ error: 'ticker required' }, 400);

  const symbol = `${ticker}.JK`;
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });
  if (!res.ok) return json({ error: `Yahoo returned ${res.status}` }, 502);

  const data = await res.json() as {
    chart?: { result?: { timestamp: number[]; indicators?: { quote?: { high: (number|null)[]; low: (number|null)[]; close: (number|null)[]; volume: (number|null)[] }[] }; meta?: { currency: string; regularMarketPrice: number } }[]; error?: unknown }
  };

  const result = data.chart?.result?.[0];
  if (!result) return json({ error: 'No data' }, 404);

  const timestamps = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const highs   = q.high   as (number | null)[] ?? [];
  const lows    = q.low    as (number | null)[] ?? [];
  const closes  = q.close  as (number | null)[] ?? [];
  const volumes = q.volume as (number | null)[] ?? [];

  interface Bar { date: string; high: number; low: number; close: number; volume: number }
  const bars: Bar[] = timestamps.map((ts, i) => ({
    date:   new Date(ts * 1000).toISOString().split('T')[0],
    high:   highs[i]   ?? 0,
    low:    lows[i]    ?? 0,
    close:  closes[i]  ?? 0,
    volume: volumes[i] ?? 0,
  })).filter((b) => b.close > 0 && b.volume > 0);

  // ── OBV (On-Balance Volume) ───────────────────────────────────────────────
  let obv = 0;
  const obvArr: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    obv += bars[i].close > bars[i - 1].close ? bars[i].volume
         : bars[i].close < bars[i - 1].close ? -bars[i].volume : 0;
    obvArr.push(obv);
  }

  // ── Chaikin Money Flow (20-period) ────────────────────────────────────────
  const CMF_PERIOD = 20;
  const cmfArr: (number | null)[] = Array(bars.length).fill(null);
  for (let i = CMF_PERIOD - 1; i < bars.length; i++) {
    let mfvSum = 0; let volSum = 0;
    for (let j = i - CMF_PERIOD + 1; j <= i; j++) {
      const { high, low, close, volume } = bars[j];
      const range = high - low;
      const mfm = range > 0 ? ((close - low) - (high - close)) / range : 0;
      mfvSum += mfm * volume;
      volSum += volume;
    }
    cmfArr[i] = volSum > 0 ? mfvSum / volSum : 0;
  }

  // ── Accumulation/Distribution Line ────────────────────────────────────────
  let adl = 0;
  const adlArr: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const { high, low, close, volume } = bars[i];
    const range = high - low;
    const mfm = range > 0 ? ((close - low) - (high - close)) / range : 0;
    adl += mfm * volume;
    adlArr.push(adl);
  }

  // ── Build series (last 30 bars) ───────────────────────────────────────────
  const slice = bars.slice(-30);
  const idxOffset = bars.length - slice.length;

  interface DataPoint { date: string; cmf: number | null; obv: number; adl: number; close: number; volume: number }
  const series: DataPoint[] = slice.map((b, i) => ({
    date:   b.date,
    cmf:    cmfArr[idxOffset + i],
    obv:    obvArr[idxOffset + i],
    adl:    adlArr[idxOffset + i],
    close:  b.close,
    volume: b.volume,
  }));

  // ── Interpret latest CMF ──────────────────────────────────────────────────
  const latestCmf = series.findLast((s) => s.cmf !== null)?.cmf ?? 0;
  const cmfTrend = (() => {
    const last5 = series.filter((s) => s.cmf !== null).slice(-5).map((s) => s.cmf as number);
    if (last5.length < 2) return 'neutral';
    return last5[last5.length - 1] > last5[0] ? 'rising' : 'falling';
  })();

  const signal: string =
    latestCmf >  0.15 ? 'strong_accumulation' :
    latestCmf >  0.05 ? 'accumulation' :
    latestCmf < -0.15 ? 'strong_distribution' :
    latestCmf < -0.05 ? 'distribution' : 'neutral';

  // OBV 10-day slope (normalised per share)
  const obv5Ago = series[series.length - 6]?.obv ?? obv;
  const obvTrend = obv > obv5Ago ? 'rising' : obv < obv5Ago ? 'falling' : 'flat';

  return json({ ticker, symbol, series, cmf: latestCmf, cmfTrend, obvTrend, signal });
}
