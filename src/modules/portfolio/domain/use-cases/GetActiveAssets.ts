import { IAssetProjectionRepository } from '../repositories/IAssetProjectionRepository';
import { Asset } from '../entities/Asset';

export class GetActiveAssets {
  constructor(private projectionRepo: IAssetProjectionRepository) {}

  async execute(userId: string): Promise<Asset[]> {
    const assets = await this.projectionRepo.getByUserId(userId);
    return assets.filter((a) => a.status === 'active');
  }
}
