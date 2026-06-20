import { IAssetProjectionRepository } from '../repositories/IAssetProjectionRepository';
import { IAssetEntryRepository } from '../repositories/IAssetEntryRepository';

export class DeleteAsset {
  constructor(
    private projectionRepo: IAssetProjectionRepository,
    private entryRepo: IAssetEntryRepository,
  ) {}

  async execute(userId: string, assetId: string): Promise<void> {
    await this.entryRepo.deleteByAssetId(userId, assetId);
    await this.projectionRepo.delete(userId, assetId);
  }
}
