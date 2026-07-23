import { AllocationTarget, RiskProfile, InvestmentHorizon } from '@/shared/types';

export interface User {
  id: string;
  email: string;
  displayName: string;
  riskProfile: RiskProfile;
  investmentHorizon: InvestmentHorizon;
  baseCurrency: 'IDR';
  targetAllocation: AllocationTarget;
  aiHistoryEnabled: boolean;
  onboardingComplete: boolean;
  /** Setoran investasi rutin bulanan (IDR) — satu angka global, dipakai bersama oleh semua Target Finansial */
  monthlyInvestmentIDR?: number;
  createdAt: Date;
  updatedAt: Date;
}
