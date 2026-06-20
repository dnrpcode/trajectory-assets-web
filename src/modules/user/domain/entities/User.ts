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
  createdAt: Date;
  updatedAt: Date;
}
