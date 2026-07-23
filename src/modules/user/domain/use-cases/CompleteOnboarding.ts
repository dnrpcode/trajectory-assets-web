import { IUserRepository } from '../repositories/IUserRepository';
import { IGoalRepository } from '@/shared/repositories/IGoalRepository';
import { RiskProfile, InvestmentHorizon } from '@/shared/types';
import { getAllocationTarget } from '@/shared/constants/allocationTargets';

export interface OnboardingInput {
  userId: string;
  email: string;
  displayName: string;
  riskProfile: RiskProfile;
  investmentHorizon: InvestmentHorizon;
  monthlyInvestmentIDR?: number;
  goal?: {
    targetAmountIDR: number;
    targetDate?: string;
  };
}

export class CompleteOnboarding {
  constructor(
    private userRepo: IUserRepository,
    private goalRepo: IGoalRepository,
  ) {}

  async execute(input: OnboardingInput): Promise<void> {
    const targetAllocation = getAllocationTarget(input.riskProfile, input.investmentHorizon);
    const now = new Date();

    await this.userRepo.update(input.userId, {
      // email + displayName disertakan supaya kalau user-doc belum ada dan
      // ditulis via setDoc merge, Firestore rules (yang mewajibkan email
      // string) tetap lolos. baseCurrency + aiHistoryEnabled melengkapi
      // dokumen kalau ini penulisan pertama.
      email: input.email,
      displayName: input.displayName,
      baseCurrency: 'IDR',
      aiHistoryEnabled: false,
      riskProfile: input.riskProfile,
      investmentHorizon: input.investmentHorizon,
      targetAllocation,
      onboardingComplete: true,
      monthlyInvestmentIDR: input.monthlyInvestmentIDR,
      updatedAt: now,
    });

    if (input.goal?.targetAmountIDR) {
      await this.goalRepo.create({
        userId: input.userId,
        targetAmountIDR: input.goal.targetAmountIDR,
        targetDate: input.goal.targetDate,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}
