import { IAuthService, AuthUser } from '../../repositories/IAuthService';

export class LoginWithEmail {
  constructor(private authService: IAuthService) {}

  async execute(email: string, password: string): Promise<AuthUser> {
    return this.authService.signInWithEmail(email, password);
  }
}
