import { IAssetProjectionRepository } from '../../repositories/IAssetProjectionRepository';
import { IAssetEntryRepository } from '../../repositories/IAssetEntryRepository';

export class DeleteAsset {
  constructor(
    private projectionRepo: IAssetProjectionRepository,
    private entryRepo: IAssetEntryRepository,
  ) {}

  async execute(userId: string, assetId: string): Promise<void> {
    // Delete entries first (to maintain referential integrity)
    await this.entryRepo.deleteByAssetId(userId, assetId);
    // Then delete the asset projection
    await this.projectionRepo.delete(userId, assetId);
  }
}
