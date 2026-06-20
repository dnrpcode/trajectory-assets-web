import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';

export class GetUserById {
  constructor(private userRepo: IUserRepository) {}

  async execute(id: string): Promise<User | null> {
    return this.userRepo.getById(id);
  }
}
