import type { Goal, GoalProgress } from '../entities/Goal';

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

/**
 * Hitung status sebuah goal terhadap nilai portofolio saat ini.
 * Proyeksi memakai compound bulanan: FV = V·(1+r)^n + C·((1+r)^n − 1)/r
 * dengan r = rate bulanan dari CAGR tahunan, C = kontribusi bulanan goal.
 */
export class ComputeGoalProgress {
  execute(goal: Goal, currentValueIDR: number, cagrRatePct: number): GoalProgress {
    const target = goal.targetAmountIDR;
    const progressPct = target > 0 ? (currentValueIDR / target) * 100 : 0;
    const remainingIDR = Math.max(0, target - currentValueIDR);
    const achieved = currentValueIDR >= target && target > 0;

    let monthsRemaining: number | null = null;
    let projectedValueIDR: number | null = null;
    let onTrack: boolean | null = null;
    let requiredMonthlyIDR: number | null = null;

    if (goal.targetDate) {
      monthsRemaining = Math.max(0, Math.round((goal.targetDate.getTime() - Date.now()) / MS_PER_MONTH));

      const monthlyRate = Math.pow(1 + cagrRatePct / 100, 1 / 12) - 1;
      const growth = Math.pow(1 + monthlyRate, monthsRemaining);
      const contribution = goal.monthlyContributionIDR ?? 0;
      const annuityFactor = monthlyRate > 0 ? (growth - 1) / monthlyRate : monthsRemaining;

      projectedValueIDR = Math.round(currentValueIDR * growth + contribution * annuityFactor);
      onTrack = projectedValueIDR >= target;

      if (!achieved && monthsRemaining >= 1) {
        const required = (target - currentValueIDR * growth) / annuityFactor;
        requiredMonthlyIDR = Math.max(0, Math.round(required));
      } else if (achieved) {
        requiredMonthlyIDR = 0;
      }
    }

    return {
      goal,
      currentValueIDR,
      progressPct,
      remainingIDR,
      achieved,
      monthsRemaining,
      projectedValueIDR,
      onTrack,
      requiredMonthlyIDR,
    };
  }
}
