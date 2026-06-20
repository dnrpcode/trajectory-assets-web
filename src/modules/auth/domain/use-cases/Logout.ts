import { IAuthService } from '@/modules/user/domain/repositories/IAuthService';

export class Logout {
  constructor(private authService: IAuthService) {}

  async execute(): Promise<void> {
    return this.authService.signOut();
  }
}
