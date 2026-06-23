import { IAuthService } from '@/shared/types/auth';

export class Logout {
  constructor(private authService: IAuthService) {}

  async execute(): Promise<void> {
    return this.authService.signOut();
  }
}
