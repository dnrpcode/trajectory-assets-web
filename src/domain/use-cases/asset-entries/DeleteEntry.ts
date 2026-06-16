import { IAssetEntryRepository } from '../../repositories/IAssetEntryRepository';
import { RecomputeAssetProjection } from './RecomputeAssetProjection';

export class DeleteEntry {
  constructor(
    private entryRepo: IAssetEntryRepository,
    private recompute: RecomputeAssetProjection,
  ) {}

  async execute(userId: string, entryId: string, assetId?: string): Promise<void> {
    await this.entryRepo.delete(userId, entryId);
    if (assetId) {
      await this.recompute.execute(userId, assetId);
    }
  }
}
