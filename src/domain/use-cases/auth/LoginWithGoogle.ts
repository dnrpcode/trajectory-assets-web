import { IAuthService, AuthUser } from '../../repositories/IAuthService';
import { IUserRepository } from '../../repositories/IUserRepository';
import { getAllocationTarget } from '../../../shared/constants/allocationTargets';

export class LoginWithGoogle {
  constructor(
    private authService: IAuthService,
    private userRepo: IUserRepository,
  ) {}

  async execute(): Promise<AuthUser> {
    const { user, isNew } = await this.authService.signInWithGoogle();

    if (isNew) {
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
}
