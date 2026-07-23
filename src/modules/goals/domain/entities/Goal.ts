export interface Goal {
  id: string;
  userId: string;
  name?: string;
  targetAmountIDR: number;
  targetDate?: Date;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Rincian angka mentah di balik proyeksi/kebutuhan setoran satu goal —
 * dipakai UI untuk menjelaskan cara hitungnya langkah demi langkah, bukan
 * cuma menampilkan hasil akhir. null kalau goal tidak punya targetDate
 * (tidak ada proyeksi tanpa tenggat).
 */
export interface GoalCalculationDetail {
  /** Nilai total portofolio saat ini (dipakai bersama oleh semua goal) */
  currentPortfolioValueIDR: number;
  /** Bagian portofolio yang "dijatah" ke goal-goal berprioritas lebih awal */
  allocatedToEarlierGoalsIDR: number;
  annualCagrPct: number;
  monthlyRatePct: number;
  monthsRemaining: number;
  /** (1+monthlyRate)^monthsRemaining */
  growthFactor: number;
  /** Total setoran bulanan gabungan (satu angka untuk semua goal) */
  totalMonthlyContributionIDR: number;
  /** Proyeksi SELURUH portofolio (bukan cuma goal ini) tumbuh dari modal saat ini */
  portfolioFutureValueIDR: number;
  /** Proyeksi tambahan dari setoran bulanan majemuk selama monthsRemaining */
  contributionFutureValueIDR: number;
  /** portfolioFutureValueIDR + contributionFutureValueIDR */
  totalFutureValueIDR: number;
  /** Target goal ini + semua goal berprioritas lebih awal */
  cumulativeTargetIDR: number;

  // ── Skenario pembanding: TANPA pertumbuhan investasi (CAGR dianggap 0%) ──
  // Portofolio dianggap flat (tidak tumbuh sama sekali), murni mengandalkan
  // disiplin setoran bulanan. Ini baseline paling konservatif — beda antara
  // angka ini dan projectedValueIDR menunjukkan seberapa besar proyeksi
  // "normal" bergantung pada asumsi return pasar yang TIDAK dijamin.
  /** currentPortfolioValueIDR (flat) + totalMonthlyContributionIDR × monthsRemaining (linear, tanpa compound) */
  noCagrTotalFutureValueIDR: number;
  /** noCagrTotalFutureValueIDR − allocatedToEarlierGoalsIDR, dibatasi ≥ 0 — versi "pure setoran" dari projectedValueIDR */
  noCagrProjectedValueIDR: number;
  /** Setoran bulanan yang dibutuhkan TANPA mengandalkan pertumbuhan investasi (linear: kekurangan ÷ sisa bulan). null kalau sudah tercapai lewat alokasi atau tenggat sudah lewat */
  noCagrRequiredMonthlyIDR: number | null;
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
  /** Rincian angka mentah untuk panel "cara hitungnya" — null kalau goal tidak punya targetDate */
  calculation: GoalCalculationDetail | null;
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
