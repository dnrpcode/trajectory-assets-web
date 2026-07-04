export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = 'https://trajectory-assets.vercel.app';

function corsHeaders(origin: string) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return { 'Access-Control-Allow-Origin': allowed, 'Vary': 'Origin' };
}

function json(data: unknown, status = 200, origin = ''): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600' },
  });
}

interface Bar {
  date: string;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export default async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin') ?? '';
  const url    = new URL(req.url);

  const raw    = (url.searchParams.get('ticker') ?? '').replace(/\.JK$/i, '').toUpperCase().trim();
  if (!raw)                              return json({ error: 'ticker required' }, 400, origin);
  if (raw.length > 10)                   return json({ error: 'ticker too long' }, 400, origin);
  if (!/^[A-Z0-9]+$/.test(raw))         return json({ error: 'invalid ticker' }, 400, origin);

  const ticker = raw;
  const symbol = `${ticker}.JK`;
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`;

  const res = await fetch(yahooUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
  });
  if (!res.ok) return json({ error: `Yahoo returned ${res.status}` }, 502, origin);

  const data = await res.json() as {
    chart?: {
      result?: {
        timestamp: number[];
        indicators?: { quote?: { high: (number|null)[]; low: (number|null)[]; close: (number|null)[]; volume: (number|null)[] }[] };
      }[];
    };
  };

  const result = data.chart?.result?.[0];
  if (!result) return json({ error: 'No data' }, 404, origin);

  const timestamps = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0];
  const highs   = (q?.high   ?? []) as (number | null)[];
  const lows    = (q?.low    ?? []) as (number | null)[];
  const closes  = (q?.close  ?? []) as (number | null)[];
  const volumes = (q?.volume ?? []) as (number | null)[];

  const bars: Bar[] = timestamps.map((ts, i) => ({
    date:   new Date(ts * 1000).toISOString().split('T')[0],
    high:   highs[i]   ?? 0,
    low:    lows[i]    ?? 0,
    close:  closes[i]  ?? 0,
    volume: volumes[i] ?? 0,
  })).filter((b) => b.close > 0 && b.volume > 0);

  if (bars.length < 5) return json({ error: 'Not enough data' }, 404, origin);

  // ── OBV ──────────────────────────────────────────────────────────────────────
  let obv = 0;
  const obvArr: number[] = [0];
  for (let i = 1; i < bars.length; i++) {
    obv += bars[i].close > bars[i - 1].close ? bars[i].volume
         : bars[i].close < bars[i - 1].close ? -bars[i].volume : 0;
    obvArr.push(obv);
  }

  // ── CMF (20-period) ───────────────────────────────────────────────────────────
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

  // ── MFI (14-period) ───────────────────────────────────────────────────────────
  const MFI_PERIOD = 14;
  const mfiArr: (number | null)[] = Array(bars.length).fill(null);
  const tp = bars.map((b) => (b.high + b.low + b.close) / 3);
  const mf = bars.map((b, i) => tp[i] * b.volume);
  for (let i = MFI_PERIOD; i < bars.length; i++) {
    let posFlow = 0; let negFlow = 0;
    for (let j = i - MFI_PERIOD + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) posFlow += mf[j];
      else negFlow += mf[j];
    }
    mfiArr[i] = negFlow === 0 ? 100 : 100 - 100 / (1 + posFlow / negFlow);
  }

  // ── Per-bar: buying pressure & net flow ───────────────────────────────────────
  const buyPctArr = bars.map((b) => {
    const range = b.high - b.low;
    return range > 0 ? ((b.close - b.low) / range) * 100 : 50;
  });
  const netFlowArr = bars.map((b) => {
    const range = b.high - b.low;
    const mfm = range > 0 ? ((b.close - b.low) - (b.high - b.close)) / range : 0;
    return mfm * b.volume * b.close;
  });

  // ── A/D Line ──────────────────────────────────────────────────────────────────
  let adl = 0;
  const adlArr: number[] = [];
  for (const b of bars) {
    const range = b.high - b.low;
    const mfm = range > 0 ? ((b.close - b.low) - (b.high - b.close)) / range : 0;
    adl += mfm * b.volume;
    adlArr.push(adl);
  }

  // ── Series (last 30 bars) ─────────────────────────────────────────────────────
  const slice  = bars.slice(-30);
  const offset = bars.length - slice.length;

  interface SeriesPoint {
    date: string; close: number; volume: number;
    cmf: number | null; mfi: number | null;
    obv: number; adl: number; buyPct: number; netFlow: number;
  }
  const series: SeriesPoint[] = slice.map((b, i) => ({
    date: b.date, close: b.close, volume: b.volume,
    cmf:     cmfArr[offset + i],
    mfi:     mfiArr[offset + i],
    obv:     obvArr[offset + i],
    adl:     adlArr[offset + i],
    buyPct:  buyPctArr[offset + i],
    netFlow: netFlowArr[offset + i],
  }));

  // ── Scorecard (last 10 bars) ──────────────────────────────────────────────────
  const scorecard = series.slice(-10).map((s) => {
    const daySignal: 'accumulation' | 'distribution' | 'neutral' =
      ((s.cmf ?? 0) > 0.03 && s.buyPct > 55) || s.buyPct > 65 ? 'accumulation' :
      ((s.cmf ?? 0) < -0.03 && s.buyPct < 45) || s.buyPct < 35 ? 'distribution' : 'neutral';
    return { ...s, daySignal };
  });

  const accDays  = scorecard.filter((s) => s.daySignal === 'accumulation').length;
  const distDays = scorecard.filter((s) => s.daySignal === 'distribution').length;

  // ── Latest values ─────────────────────────────────────────────────────────────
  const latestCmf    = [...series].reverse().find((s) => s.cmf !== null)?.cmf ?? 0;
  const latestMfi    = [...series].reverse().find((s) => s.mfi !== null)?.mfi ?? 50;
  const latestBuyPct = series[series.length - 1]?.buyPct ?? 50;

  const cmfTrend = (() => {
    const vals = series.filter((s) => s.cmf !== null).slice(-5).map((s) => s.cmf as number);
    if (vals.length < 2) return 'neutral' as const;
    return vals[vals.length - 1] > vals[0] ? 'rising' as const : 'falling' as const;
  })();

  const obvNow  = series[series.length - 1]?.obv ?? 0;
  const obv5ago = series[Math.max(0, series.length - 6)]?.obv ?? obvNow;
  const obvTrend = obvNow > obv5ago ? 'rising' as const : obvNow < obv5ago ? 'falling' as const : 'flat' as const;
  const obvChangePct = obv5ago !== 0 ? ((obvNow - obv5ago) / Math.abs(obv5ago)) * 100 : 0;

  // ── Composite score & signal ──────────────────────────────────────────────────
  let score = 0;
  if (latestCmf > 0.15) score += 2; else if (latestCmf > 0.05) score += 1;
  else if (latestCmf < -0.15) score -= 2; else if (latestCmf < -0.05) score -= 1;
  if (latestMfi > 65) score += 1; else if (latestMfi < 35) score -= 1;
  if (obvTrend === 'rising') score += 1; else if (obvTrend === 'falling') score -= 1;
  if (accDays >= 7) score += 1; else if (distDays >= 7) score -= 1;

  const signal =
    score >= 4  ? 'strong_accumulation' :
    score >= 2  ? 'accumulation' :
    score <= -4 ? 'strong_distribution' :
    score <= -2 ? 'distribution' : 'neutral';

  // ── Auto narrative ────────────────────────────────────────────────────────────
  const narrative: string[] = [];
  narrative.push(`${accDays} dari 10 sesi terakhir menunjukkan tekanan beli dominan.`);
  if (Math.abs(latestCmf) > 0.05)
    narrative.push(`CMF ${latestCmf >= 0 ? '+' : ''}${(latestCmf * 100).toFixed(1)} — volume ${latestCmf > 0 ? 'beli' : 'jual'} mendominasi secara konsisten.`);
  if (latestMfi > 70)
    narrative.push(`MFI ${latestMfi.toFixed(0)} masuk zona jenuh beli — waspadai koreksi jangka pendek.`);
  else if (latestMfi < 30)
    narrative.push(`MFI ${latestMfi.toFixed(0)} masuk zona jenuh jual — potensi pembalikan ke atas.`);
  if (Math.abs(obvChangePct) > 3)
    narrative.push(`OBV ${obvTrend === 'rising' ? 'naik' : 'turun'} ${Math.abs(obvChangePct).toFixed(1)}% dalam 5 sesi — ${obvTrend === 'rising' ? 'konfirmasi akumulasi' : 'konfirmasi distribusi'}.`);

  return json({ ticker, symbol, series, scorecard, latestCmf, latestMfi, latestBuyPct, cmfTrend, obvTrend, obvChangePct, accDays, distDays, signal, narrative, score }, 200, origin);
}
