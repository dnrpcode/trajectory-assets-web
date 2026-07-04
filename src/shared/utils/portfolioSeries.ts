import { Asset } from '@/shared/types/asset';
import { AssetEntry } from '@/shared/types/assetEntry';
import { computeNewAvgCost } from './calculations';
import { getCurrentMonth, getMonthFromDate } from './formatDate';

/**
 * Single source of truth for the dashboard growth & benchmark charts.
 *
 * Replays the immutable entry ledger month by month — no Firestore
 * portfolioHistory cache involved, so the series is always consistent with
 * the current entries (delete/re-add an asset and the chart follows
 * immediately).
 *
 * The final (current) month is anchored to the Asset projections, so the last
 * chart point always equals the stat cards on the dashboard.
 */

export interface PortfolioSeriesPoint {
  month: string;        // "YYYY-MM"
  value: number;        // portfolio market value (IDR)
  invested: number;     // remaining cost basis / modal (IDR)
  ihsg: number | null;  // value if the same cashflows had bought IHSG (IDR)
}

interface BuildParams {
  entries: AssetEntry[];
  assets: Asset[];
  /** TICKER (no .JK) → "YYYY-MM" → monthly close */
  marketPrices?: Record<string, Record<string, number>>;
  /** "YYYY-MM" → IHSG monthly close */
  ihsgCloses?: Record<string, number>;
}

function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthsBetween(from: string, to: string): string[] {
  const months: string[] = [];
  let cur = from;
  while (cur <= to && months.length < 240) {
    months.push(cur);
    cur = addMonths(cur, 1);
  }
  return months;
}

/** Nearest available close for a month: exact, else latest earlier, else earliest later. */
function closeFor(closes: Record<string, number>, month: string): number | null {
  if (closes[month] != null) return closes[month];
  const months = Object.keys(closes).sort();
  if (months.length === 0) return null;
  let best: string | null = null;
  for (const m of months) {
    if (m <= month) best = m;
    else break;
  }
  return closes[best ?? months[0]] ?? null;
}

export function buildPortfolioSeries({ entries, assets, marketPrices = {}, ihsgCloses = {} }: BuildParams): PortfolioSeriesPoint[] {
  // Filter out corrected entries and entries targeted by corrections
  const targetedIds = new Set(
    entries.filter((e) => e.entryType === 'correction' && e.targetEntryId).map((e) => e.targetEntryId as string),
  );
  const active = entries
    .filter((e) => !e.isCorrected && !targetedIds.has(e.id) && e.entryType !== 'correction')
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (active.length === 0) return [];

  const currentMonth = getCurrentMonth();
  const firstMonth = getMonthFromDate(active[0].date);
  const allMonths = monthsBetween(firstMonth, currentMonth);

  const tickerByAssetId: Record<string, string> = {};
  const currentPriceByAssetId: Record<string, number> = {};
  for (const a of assets) {
    currentPriceByAssetId[a.id] = a.currentPricePerUnit;
    if (a.ticker) tickerByAssetId[a.id] = a.ticker.replace(/\.JK$/i, '').toUpperCase();
  }

  const hasIhsg = Object.keys(ihsgCloses).length > 0;
  const activeProjections = assets.filter((a) => a.status === 'active');

  const series: PortfolioSeriesPoint[] = [];

  // IHSG shadow portfolio: replay the same cashflows buying/selling index units.
  // Processed incrementally as months advance (entries are date-sorted).
  let ihsgUnits = 0;
  let entryCursor = 0;

  // Per-asset running state, carried across months (single pass, O(entries))
  interface AssetState { units: number; costBasis: number; avgCost: number; lastPriceIDR: number }
  const state: Record<string, AssetState> = {};

  for (const month of allMonths) {
    const endOfMonth = new Date(`${month}-01T00:00:00`);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    // Consume entries belonging to this month
    while (entryCursor < active.length && active[entryCursor].date < endOfMonth) {
      const e = active[entryCursor++];
      if (!e.assetId) continue;
      const s = (state[e.assetId] ??= { units: 0, costBasis: 0, avgCost: 0, lastPriceIDR: 0 });
      const rate = e.exchangeRateToIDR ?? 1;
      const eMonth = getMonthFromDate(e.date);

      switch (e.entryType) {
        case 'new_position':
        case 'top_up': {
          const u = e.units ?? 0;
          const p = e.pricePerUnit ?? 0;
          const cash = u * p * rate;
          s.avgCost = computeNewAvgCost(s.units, s.avgCost, u, p);
          s.units += u;
          s.costBasis += cash;
          s.lastPriceIDR = p * rate;
          if (hasIhsg && cash > 0) {
            const c = closeFor(ihsgCloses, eMonth);
            if (c) ihsgUnits += cash / c;
          }
          break;
        }
        case 'price_update':
          if (e.pricePerUnit != null) s.lastPriceIDR = e.pricePerUnit * rate;
          break;
        case 'partial_sell': {
          const u = Math.min(e.units ?? 0, s.units);
          const p = e.pricePerUnit ?? 0;
          const proceeds = u * p * rate;
          const cbPerUnit = s.units > 0 ? s.costBasis / s.units : 0;
          s.costBasis = Math.max(0, s.costBasis - cbPerUnit * u);
          s.units = Math.max(0, s.units - u);
          if (p > 0) s.lastPriceIDR = p * rate;
          if (hasIhsg && proceeds > 0) {
            const c = closeFor(ihsgCloses, eMonth);
            if (c) ihsgUnits = Math.max(0, ihsgUnits - proceeds / c);
          }
          break;
        }
        case 'full_sell': {
          const p = e.pricePerUnit ?? s.lastPriceIDR;
          const proceeds = s.units * p * (e.pricePerUnit != null ? rate : 1);
          s.units = 0;
          s.costBasis = 0;
          if (hasIhsg && proceeds > 0) {
            const c = closeFor(ihsgCloses, eMonth);
            if (c) ihsgUnits = Math.max(0, ihsgUnits - proceeds / c);
          }
          break;
        }
      }
    }

    // Value the portfolio at end of this month
    let value = 0;
    let invested = 0;

    if (month === currentMonth && activeProjections.length > 0) {
      // Anchor: current month always equals the stat cards exactly
      value = activeProjections.reduce((sum, a) => sum + a.currentValueIDR, 0);
      invested = activeProjections.reduce((sum, a) => sum + a.totalCostBasisIDR, 0);
    } else {
      for (const [assetId, s] of Object.entries(state)) {
        if (s.units <= 0) continue;
        let priceIDR = s.lastPriceIDR;
        // Saham with ticker: prefer actual market close for that month
        const ticker = tickerByAssetId[assetId];
        const mkt = ticker ? marketPrices[ticker]?.[month] : undefined;
        if (mkt != null && mkt > 0) priceIDR = mkt;
        if (priceIDR <= 0) priceIDR = currentPriceByAssetId[assetId] ?? 0;
        value += s.units * priceIDR;
        invested += s.costBasis;
      }
    }

    let ihsg: number | null = null;
    if (hasIhsg && ihsgUnits > 0) {
      const c = closeFor(ihsgCloses, month);
      if (c) ihsg = ihsgUnits * c;
    }

    // Skip leading empty months
    if (series.length === 0 && value <= 0 && invested <= 0) continue;

    series.push({ month, value, invested, ihsg });
  }

  return series;
}
