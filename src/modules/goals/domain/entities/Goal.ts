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
  /**
   * Porsi portofolio yang dialokasikan ke goal ini (model waterfall:
   * goal dengan tenggat terdekat diisi lebih dulu, sisanya mengalir ke berikutnya).
   */
  allocatedIDR: number;
  /** allocated / target × 100 */
  progressPct: number;
  remainingIDR: number;
  achieved: boolean;
  /** null kalau goal tidak punya targetDate */
  monthsRemaining: number | null;
  /** Proyeksi dana yang tersedia untuk goal ini di targetDate (setelah goal sebelumnya terpenuhi) */
  projectedValueIDR: number | null;
  /** Proyeksi portofolio di targetDate >= target kumulatif? null tanpa targetDate */
  onTrack: boolean | null;
  /** Total setoran bulanan yang dibutuhkan agar target kumulatif goal ini tercapai di tenggat */
  requiredMonthlyIDR: number | null;
}

export type RoadmapAdviceType =
  | 'increaseTotal'    // total setoran perlu naik ke amountIDR (binding: goalName)
  | 'allOnTrack'       // semua goal ber-tenggat on track
  | 'focusNext'        // goal sebelumnya sudah tertutup portofolio, setoran efektif mengejar goalName
  | 'addContribution'  // tanpa setoran, target tidak akan terjangkau
  | 'deadlinePassed';  // tenggat goalName sudah lewat tapi belum tercapai

export interface RoadmapAdvice {
  type: RoadmapAdviceType;
  goalName?: string;
  amountIDR?: number;
  currentIDR?: number;
}

export interface GoalRoadmapItem {
  progress: GoalProgress;
  /** Urutan prioritas, mulai 1 (tenggat terdekat) */
  order: number;
  /** Total target goal ini + semua goal sebelumnya */
  cumulativeTargetIDR: number;
  /** Estimasi bulan sampai target kumulatif tercapai. null = tidak terjangkau dalam 50 tahun */
  estimatedMonths: number | null;
  estimatedDate: Date | null;
  /** monthsRemaining − estimatedMonths; positif = lebih cepat dari tenggat */
  slackMonths: number | null;
}

export interface GoalRoadmap {
  items: GoalRoadmapItem[];
  currentValueIDR: number;
  totalTargetIDR: number;
  /** Jumlah semua kontribusi bulanan yang direncanakan di seluruh goal */
  totalMonthlyContributionIDR: number;
  /** Setoran bulanan total minimum agar semua tenggat terpenuhi. null kalau tidak ada tenggat aktif */
  requiredMonthlyTotalIDR: number | null;
  /** Goal yang paling menekan kebutuhan setoran */
  bindingGoalName: string | null;
  advices: RoadmapAdvice[];
}
