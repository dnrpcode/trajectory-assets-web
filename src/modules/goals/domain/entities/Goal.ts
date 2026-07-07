export interface Goal {
  id: string;
  userId: string;
  name?: string;
  targetAmountIDR: number;
  targetDate?: Date;
  monthlyContributionIDR?: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalProgress {
  goal: Goal;
  /** Nilai portofolio yang dipakai sebagai basis progres */
  currentValueIDR: number;
  /** currentValue / target × 100 — bisa > 100 kalau sudah tercapai */
  progressPct: number;
  remainingIDR: number;
  achieved: boolean;
  /** null kalau goal tidak punya targetDate */
  monthsRemaining: number | null;
  /** Proyeksi nilai portofolio di targetDate (CAGR + kontribusi bulanan). null tanpa targetDate */
  projectedValueIDR: number | null;
  /** Proyeksi >= target? null tanpa targetDate */
  onTrack: boolean | null;
  /** Kontribusi bulanan yang dibutuhkan supaya tepat mencapai target di targetDate */
  requiredMonthlyIDR: number | null;
}
