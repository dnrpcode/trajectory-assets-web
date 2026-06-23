import { IAuthService, AuthUser } from '@/modules/user';
import { IUserRepository } from '@/modules/user';
import { getAllocationTarget } from '@/shared/constants/allocationTargets';

export class RegisterWithEmail {
  constructor(
    private authService: IAuthService,
    private userRepo: IUserRepository,
  ) {}

  async execute(email: string, password: string, displayName: string): Promise<AuthUser> {
    const user = await this.authService.registerWithEmail(email, password, displayName);

    const now = new Date();
    await this.userRepo.create({
      id: user.uid,
      email,
      displayName,
      riskProfile: 'moderate',
      investmentHorizon: 'medium',
      baseCurrency: 'IDR',
      targetAllocation: getAllocationTarget('moderate', 'medium'),
      aiHistoryEnabled: false,
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
    });

    return user;
  }
}
