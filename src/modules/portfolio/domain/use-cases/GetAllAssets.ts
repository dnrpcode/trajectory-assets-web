import { IAssetProjectionRepository } from '../repositories/IAssetProjectionRepository';
import { Asset } from '../entities/Asset';

export class GetAllAssets {
  constructor(private projectionRepo: IAssetProjectionRepository) {}

  async execute(userId: string): Promise<Asset[]> {
    return this.projectionRepo.getByUserId(userId);
  }
}
