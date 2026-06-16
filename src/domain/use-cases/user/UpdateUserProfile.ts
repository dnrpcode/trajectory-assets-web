import { IUserRepository } from '../../repositories/IUserRepository';
import { User } from '../../entities/User';

export class UpdateUserProfile {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string, data: Partial<User>): Promise<void> {
    return this.userRepo.update(userId, data);
  }
}
