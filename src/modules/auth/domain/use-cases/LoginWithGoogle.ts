import { IAuthService, AuthUser } from '@/shared/types/auth';
import { IUserRepository } from '@/shared/repositories/IUserRepository';
import { getAllocationTarget } from '@/shared/constants/allocationTargets';

export class LoginWithGoogle {
  constructor(
    readonly authService: IAuthService,
    readonly userRepo: IUserRepository,
  ) {}

  private async createIfNew(user: AuthUser): Promise<AuthUser> {
    const existing = await this.userRepo.getById(user.uid);
    if (!existing) {
      const now = new Date();
      await this.userRepo.create({
        id: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? user.email ?? '',
        riskProfile: 'moderate',
        investmentHorizon: 'medium',
        baseCurrency: 'IDR',
        targetAllocation: getAllocationTarget('moderate', 'medium'),
        aiHistoryEnabled: false,
        onboardingComplete: false,
        createdAt: now,
        updatedAt: now,
      });
    }
    return user;
  }

  async execute(): Promise<AuthUser> {
    const result = await this.authService.signInWithGoogle();
    return this.createIfNew(result.user);
  }
}
