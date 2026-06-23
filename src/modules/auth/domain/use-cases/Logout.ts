import { IAuthService } from '@/modules/user';

export class Logout {
  constructor(private authService: IAuthService) {}

  async execute(): Promise<void> {
    return this.authService.signOut();
  }
}
