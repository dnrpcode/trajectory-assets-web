import { Asset } from '@/shared/types/asset';
import { User } from '@/shared/types/user';
import { CategoryBreakdown, RebalancingAdvice, AssetCategory, AllocationTarget, RiskProfile } from '../types';
import { CATEGORY_LABELS, CATEGORY_COLORS, ALL_CATEGORIES } from '../constants/categories';
import { getAllocationTarget } from '../constants/allocationTargets';
import { computeActualAllocation } from './calculations';
import { PortfolioHistoryPoint } from '@/shared/types';

export function calculateCAGR(startValue: number, endValue: number, months: number): number {
  if (startValue <= 0 || endValue <= 0 || months <= 0) return 0;
  const years = months / 12;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

// Benchmark return tahunan per kelas aset (pasar Indonesia, rata-rata historis)
export const EXPECTED_RETURNS: Record<AssetCategory, number> = {
  saham: 12.0,
  reksa_dana: 9.0,
  obligasi_sbn: 6.5,
  emas: 8.0,
  kripto: 20.0,
  cash: 4.5,
  lainnya: 7.0,
};

export const RISK_FALLBACK: Record<RiskProfile, number> = {
  conservative: 6.5,
  moderate: 9.0,
  aggressive: 13.0,
};

export type CAGRSource =
  | { type: 'historical_blend'; historicalRate: number; allocationRate: number; months: number }
  | { type: 'allocation'; breakdown: { category: AssetCategory; weight: number; expectedReturn: number; contribution: number }[] }
  | { type: 'risk_profile'; profile: RiskProfile };

export function computeAllocationCAGR(allocation: AllocationTarget): {
  rate: number;
  breakdown: { category: AssetCategory; weight: number; expectedReturn: number; contribution: number }[];
} {
  const categories = Object.keys(EXPECTED_RETURNS) as AssetCategory[];
  const breakdown = categories
    .filter((cat) => (allocation[cat] ?? 0) > 0)
    .map((cat) => {
      const weight = allocation[cat] ?? 0;
      const expectedReturn = EXPECTED_RETURNS[cat];
      return { category: cat, weight, expectedReturn, contribution: (weight / 100) * expectedReturn };
    });
  const rate = breakdown.reduce((sum, row) => sum + row.contribution, 0);
  return { rate: Math.round(rate * 100) / 100, breakdown };
}

export function computeSmartCAGR(
  history: PortfolioHistoryPoint[],
  allocationActual: AllocationTarget | undefined,
  riskProfile: RiskProfile,
): { rate: number; source: CAGRSource } {
  const allocationResult = allocationActual ? computeAllocationCAGR(allocationActual) : null;
  const allocationRate = allocationResult?.rate ?? RISK_FALLBACK[riskProfile];

  if (history.length >= 6) {
    const start = history[0].totalValueIDR;
    const end = history[history.length - 1].totalValueIDR;
    const raw = calculateCAGR(start, end, history.length - 1);
    if (raw > 0 && raw < 150) {
      const historicalRate = Math.round(raw * 100) / 100;
      const rate = Math.round((0.6 * historicalRate + 0.4 * allocationRate) * 100) / 100;
      return { rate, source: { type: 'historical_blend', historicalRate, allocationRate, months: history.length - 1 } };
    }
  }

  if (allocationResult && allocationResult.breakdown.length > 0) {
    return { rate: allocationRate, source: { type: 'allocation', breakdown: allocationResult.breakdown } };
  }

  return { rate: RISK_FALLBACK[riskProfile], source: { type: 'risk_profile', profile: riskProfile } };
}

export function computeCategoryBreakdown(assets: Asset[], user: Pick<User, 'riskProfile' | 'investmentHorizon' | 'targetAllocation'>): CategoryBreakdown[] {
  const activeAssets = assets.filter((a) => a.status === 'active');
  const actual = computeActualAllocation(activeAssets);
  const target = user.targetAllocation ?? getAllocationTarget(user.riskProfile, user.investmentHorizon);

  return ALL_CATEGORIES.map((cat) => {
    const currentValue = activeAssets
      .filter((a) => a.category === cat)
      .reduce((s, a) => s + a.currentValueIDR, 0);
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      currentValue,
      actualPercentage: actual[cat],
      targetPercentage: target[cat],
      gap: actual[cat] - target[cat],
      color: CATEGORY_COLORS[cat],
    };
  });
}

export function getRebalancingRecommendations(
  breakdown: CategoryBreakdown[],
  totalValue: number,
): { score: number; advices: RebalancingAdvice[] } {
  let absoluteGapSum = 0;
  const advices: RebalancingAdvice[] = [];

  for (const cat of breakdown) {
    const targetValue = (cat.targetPercentage / 100) * totalValue;
    const difference = cat.currentValue - targetValue;
    absoluteGapSum += Math.abs(cat.gap);

    if (cat.gap < -3 && cat.targetPercentage > 0) {
      advices.push({
        title: `Tambah Alokasi ${cat.label}`,
        type: 'increase',
        categoryLabel: cat.label,
        actionAmount: Math.round(Math.abs(difference)),
        description: `Posisi ${cat.label} Anda saat ini ${cat.actualPercentage.toFixed(1)}%, di bawah target ideal (${cat.targetPercentage}%). Rekomendasi: tambah sekitar Rp ${Math.round(Math.abs(difference)).toLocaleString('id-ID')}.`,
      });
    } else if (cat.gap > 3 && cat.actualPercentage > 0) {
      advices.push({
        title: `Kurangi Alokasi ${cat.label}`,
        type: 'decrease',
        categoryLabel: cat.label,
        actionAmount: Math.round(Math.abs(difference)),
        description: `${cat.label} overweight di ${cat.actualPercentage.toFixed(1)}% (target ${cat.targetPercentage}%). Pertimbangkan take profit sekitar Rp ${Math.round(Math.abs(difference)).toLocaleString('id-ID')} untuk menjaga profil risiko.`,
      });
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - absoluteGapSum / 2)));
  return { score, advices: advices.sort((a, b) => b.actionAmount - a.actionAmount) };
}

export function generateProjections(
  currentValue: number,
  monthlyContribution: number,
  cagrRate: number,
  years: number,
): { year: number; base: number; optimistic: number; pessimistic: number; capital: number }[] {
  const baseRate = cagrRate / 100;
  const optimisticRate = Math.min(0.40, baseRate * 1.5);
  const pessimisticRate = Math.max(0.02, baseRate * 0.5);
  const annualContribution = monthlyContribution * 12;
  const currentYear = new Date().getFullYear();

  let baseVal = currentValue;
  let optVal = currentValue;
  let pesVal = currentValue;

  const result = [{ year: currentYear, base: Math.round(currentValue), optimistic: Math.round(currentValue), pessimistic: Math.round(currentValue), capital: Math.round(currentValue) }];

  for (let t = 1; t <= years; t++) {
    baseVal = baseVal * (1 + baseRate) + annualContribution * (1 + baseRate / 2);
    optVal = optVal * (1 + optimisticRate) + annualContribution * (1 + optimisticRate / 2);
    pesVal = pesVal * (1 + pessimisticRate) + annualContribution * (1 + pessimisticRate / 2);
    const capital = currentValue + annualContribution * t;
    result.push({ year: currentYear + t, base: Math.round(baseVal), optimistic: Math.round(optVal), pessimistic: Math.round(pesVal), capital: Math.round(capital) });
  }
  return result;
}
