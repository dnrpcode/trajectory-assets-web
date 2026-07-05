import type { DividendInfo, DividendEvent } from '../entities/Dividend';
import type { RotationWindow, RotationRoadmap, RotationConfidence } from '../entities/DividendRotation';

function confidenceOf(occurrences: number, yearsChecked: number): RotationConfidence {
  const ratio = yearsChecked > 0 ? occurrences / yearsChecked : 0;
  if (ratio >= 0.8) return 'high';
  if (ratio >= 0.4) return 'medium';
  return 'low';
}

function lastDayOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0);
}

function firstDayOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1);
}

function priceAt(priceHistory: DividendInfo['priceHistory'], year: number, monthIndex: number): number | null {
  const point = priceHistory.find((p) => p.date.getFullYear() === year && p.date.getMonth() === monthIndex);
  return point ? point.close : null;
}

function buildCandidateWindows(info: DividendInfo, targetYear: number): RotationWindow[] {
  const clusters = new Map<number, DividendEvent[]>();
  for (const ev of info.events) {
    const month = ev.date.getMonth();
    if (!clusters.has(month)) clusters.set(month, []);
    clusters.get(month)!.push(ev);
  }

  const windows: RotationWindow[] = [];
  for (const [month, events] of clusters) {
    const occurrenceYears = new Set(events.map((e) => e.date.getFullYear()));
    const occurrences = occurrenceYears.size;
    const avgAmount = events.reduce((s, e) => s + e.amount, 0) / events.length;
    const expectedDividendYieldPct = info.currentPrice > 0 ? (avgAmount / info.currentPrice) * 100 : 0;

    const entryMonthIdx = (month - 1 + 12) % 12;
    const priceReturns: number[] = [];
    for (const y of occurrenceYears) {
      const entryYear = month === 0 ? y - 1 : y;
      const entryPrice = priceAt(info.priceHistory, entryYear, entryMonthIdx);
      const exitPrice = priceAt(info.priceHistory, y, month);
      if (entryPrice != null && exitPrice != null && entryPrice > 0) {
        priceReturns.push(((exitPrice - entryPrice) / entryPrice) * 100);
      }
    }
    const expectedPriceReturnPct = priceReturns.length > 0
      ? priceReturns.reduce((s, v) => s + v, 0) / priceReturns.length
      : 0;

    const entryYearForTarget = month === 0 ? targetYear - 1 : targetYear;
    windows.push({
      ticker: info.ticker,
      name: info.name,
      monthIndex: month,
      entryDate: firstDayOfMonth(entryYearForTarget, entryMonthIdx),
      exitDate: lastDayOfMonth(targetYear, month),
      expectedDividendYieldPct,
      expectedPriceReturnPct,
      expectedTotalReturnPct: expectedDividendYieldPct + expectedPriceReturnPct,
      confidence: confidenceOf(occurrences, info.totalYearsChecked),
      occurrences,
      yearsChecked: info.totalYearsChecked,
    });
  }
  return windows;
}

/** Classic weighted interval scheduling: pick the max-total-weight set of non-overlapping windows. */
function scheduleNonOverlapping(candidates: RotationWindow[]): RotationWindow[] {
  const sorted = [...candidates].sort((a, b) => a.exitDate.getTime() - b.exitDate.getTime());
  const n = sorted.length;

  // p[i] = last index j < i whose window ends before window i starts, or -1
  const p = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    p[i] = -1;
    for (let j = i - 1; j >= 0; j--) {
      if (sorted[j].exitDate.getTime() <= sorted[i].entryDate.getTime()) { p[i] = j; break; }
    }
  }

  // opt[i] = best total weight considering the first i windows (1-indexed)
  const opt = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const withCurrent = sorted[i - 1].expectedTotalReturnPct + opt[p[i - 1] + 1];
    opt[i] = Math.max(opt[i - 1], withCurrent);
  }

  const chosen: RotationWindow[] = [];
  let i = n;
  while (i > 0) {
    const withCurrent = sorted[i - 1].expectedTotalReturnPct + opt[p[i - 1] + 1];
    if (withCurrent > opt[i - 1]) {
      chosen.push(sorted[i - 1]);
      i = p[i - 1] + 1;
    } else {
      i--;
    }
  }
  return chosen.sort((a, b) => a.entryDate.getTime() - b.entryDate.getTime());
}

export class BuildDividendRotationRoadmap {
  execute(dividendInfos: DividendInfo[], targetYear: number = new Date().getFullYear()): RotationRoadmap {
    const candidates = dividendInfos.flatMap((info) => buildCandidateWindows(info, targetYear));
    const windows = scheduleNonOverlapping(candidates);
    const totalExpectedReturnPct = windows.reduce((s, w) => s + w.expectedTotalReturnPct, 0);
    return { windows, totalExpectedReturnPct };
  }
}
