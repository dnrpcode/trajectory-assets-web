import type { Goal, GoalProgress, GoalRoadmap, GoalRoadmapItem, RoadmapAdvice, GoalCalculationDetail } from '../entities/Goal';

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;
const MAX_HORIZON_MONTHS = 600; // 50 tahun — di atas ini dianggap tidak terjangkau

/**
 * Susun roadmap multi-goal dengan model waterfall berprioritas tenggat:
 * goal diurutkan dari tenggat terdekat (tanpa tenggat = paling akhir), nilai
 * portofolio dialokasikan berurutan, dan setiap goal diukur terhadap target
 * KUMULATIF (target dia + semua goal sebelumnya) supaya satu rupiah tidak
 * dihitung dua kali.
 *
 * Setoran bulanan adalah SATU angka global (diisi user sekali, bukan per
 * goal) — merepresentasikan kontribusi rutin ke satu portofolio bersama,
 * bukan pot dana terpisah per goal.
 *
 * Proyeksi memakai compound bulanan: FV(n) = V·(1+r)^n + C·((1+r)^n − 1)/r
 * dengan V = nilai portofolio saat ini, C = setoran bulanan global, dan
 * r = CAGR tahunan dikonversi ke rate bulanan.
 */
export class BuildGoalRoadmap {
  execute(goals: Goal[], currentValueIDR: number, cagrRatePct: number, totalMonthlyContributionIDR: number): GoalRoadmap {
    const sorted = [...goals].sort((a, b) => {
      if (a.targetDate && b.targetDate) return a.targetDate.getTime() - b.targetDate.getTime();
      if (a.targetDate) return -1;
      if (b.targetDate) return 1;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const totalMonthly = totalMonthlyContributionIDR;
    const monthlyRate = Math.pow(1 + cagrRatePct / 100, 1 / 12) - 1;
    const annuity = (n: number) => (monthlyRate > 0 ? (Math.pow(1 + monthlyRate, n) - 1) / monthlyRate : n);
    const futureValue = (n: number) => currentValueIDR * Math.pow(1 + monthlyRate, n) + totalMonthly * annuity(n);

    const monthsToReach = (target: number): number | null => {
      if (currentValueIDR >= target) return 0;
      for (let n = 1; n <= MAX_HORIZON_MONTHS; n++) {
        if (futureValue(n) >= target) return n;
      }
      return null;
    };

    const items: GoalRoadmapItem[] = [];
    let cumulativeTarget = 0;

    for (let i = 0; i < sorted.length; i++) {
      const goal = sorted[i];
      const cumBefore = cumulativeTarget;
      cumulativeTarget += goal.targetAmountIDR;

      const allocatedIDR = Math.min(Math.max(0, currentValueIDR - cumBefore), goal.targetAmountIDR);
      const progressPct = goal.targetAmountIDR > 0 ? (allocatedIDR / goal.targetAmountIDR) * 100 : 0;
      const achieved = goal.targetAmountIDR > 0 && allocatedIDR >= goal.targetAmountIDR;
      const remainingIDR = Math.max(0, goal.targetAmountIDR - allocatedIDR);

      let monthsRemaining: number | null = null;
      let projectedValueIDR: number | null = null;
      let onTrack: boolean | null = null;
      let requiredMonthlyIDR: number | null = null;
      let calculation: GoalCalculationDetail | null = null;

      if (goal.targetDate) {
        monthsRemaining = Math.max(0, Math.round((goal.targetDate.getTime() - Date.now()) / MS_PER_MONTH));
        const growthFactor = Math.pow(1 + monthlyRate, monthsRemaining);
        const portfolioFutureValueIDR = currentValueIDR * growthFactor;
        const contributionFutureValueIDR = totalMonthly * annuity(monthsRemaining);
        const totalFutureValueIDR = portfolioFutureValueIDR + contributionFutureValueIDR;

        projectedValueIDR = Math.max(0, Math.round(totalFutureValueIDR - cumBefore));
        onTrack = totalFutureValueIDR >= cumulativeTarget;

        if (achieved) {
          requiredMonthlyIDR = 0;
        } else if (monthsRemaining >= 1) {
          const required = (cumulativeTarget - portfolioFutureValueIDR) / annuity(monthsRemaining);
          requiredMonthlyIDR = Math.max(0, Math.round(required));
        }
        // monthsRemaining === 0 && !achieved → tenggat lewat, required tak terdefinisi (null)

        calculation = {
          currentPortfolioValueIDR: currentValueIDR,
          allocatedToEarlierGoalsIDR: cumBefore,
          annualCagrPct: cagrRatePct,
          monthlyRatePct: monthlyRate * 100,
          monthsRemaining,
          growthFactor,
          totalMonthlyContributionIDR: totalMonthly,
          portfolioFutureValueIDR: Math.round(portfolioFutureValueIDR),
          contributionFutureValueIDR: Math.round(contributionFutureValueIDR),
          totalFutureValueIDR: Math.round(totalFutureValueIDR),
          cumulativeTargetIDR: cumulativeTarget,
        };
      }

      const estimatedMonths = achieved ? 0 : monthsToReach(cumulativeTarget);
      const estimatedDate = estimatedMonths !== null ? new Date(Date.now() + estimatedMonths * MS_PER_MONTH) : null;
      const slackMonths = monthsRemaining !== null && estimatedMonths !== null ? monthsRemaining - estimatedMonths : null;

      const progress: GoalProgress = {
        goal, allocatedIDR, progressPct, remainingIDR, achieved,
        monthsRemaining, projectedValueIDR, onTrack, requiredMonthlyIDR, calculation,
      };
      items.push({ progress, order: i + 1, cumulativeTargetIDR: cumulativeTarget, estimatedMonths, estimatedDate, slackMonths });
    }

    // Kebutuhan setoran total = constraint paling berat di antara goal ber-tenggat
    let requiredMonthlyTotalIDR: number | null = null;
    let bindingGoalName: string | null = null;
    for (const item of items) {
      const req = item.progress.requiredMonthlyIDR;
      if (req !== null && (requiredMonthlyTotalIDR === null || req > requiredMonthlyTotalIDR)) {
        requiredMonthlyTotalIDR = req;
        bindingGoalName = item.progress.goal.name ?? null;
      }
    }

    return {
      items,
      currentValueIDR,
      totalTargetIDR: cumulativeTarget,
      totalMonthlyContributionIDR: totalMonthly,
      requiredMonthlyTotalIDR,
      bindingGoalName,
      advices: this.buildAdvices(items, totalMonthly, requiredMonthlyTotalIDR, bindingGoalName),
    };
  }

  private buildAdvices(
    items: GoalRoadmapItem[],
    totalMonthly: number,
    requiredTotal: number | null,
    bindingGoalName: string | null,
  ): RoadmapAdvice[] {
    const advices: RoadmapAdvice[] = [];

    for (const item of items) {
      const p = item.progress;
      if (p.goal.targetDate && p.monthsRemaining === 0 && !p.achieved) {
        advices.push({ type: 'deadlinePassed', goalName: p.goal.name });
      }
    }

    // Goal terdepan yang belum tercapai, dengan minimal satu goal sebelumnya sudah tertutup
    const firstUnachieved = items.find((i) => !i.progress.achieved);
    if (firstUnachieved && firstUnachieved.order > 1) {
      advices.push({ type: 'focusNext', goalName: firstUnachieved.progress.goal.name });
    }

    if (requiredTotal !== null && requiredTotal > totalMonthly) {
      advices.push({ type: 'increaseTotal', amountIDR: requiredTotal, currentIDR: totalMonthly, goalName: bindingGoalName ?? undefined });
    } else if (totalMonthly === 0 && items.some((i) => i.estimatedMonths === null)) {
      advices.push({ type: 'addContribution' });
    } else if (items.some((i) => i.progress.onTrack !== null) && items.every((i) => i.progress.onTrack !== false)) {
      advices.push({ type: 'allOnTrack' });
    }

    return advices.slice(0, 3);
  }
}
