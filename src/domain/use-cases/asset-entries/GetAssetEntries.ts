import { IAssetEntryRepository } from '../../repositories/IAssetEntryRepository';
import { AssetEntry } from '../../entities/AssetEntry';

export class GetAssetEntries {
  constructor(private entryRepo: IAssetEntryRepository) {}

  async executeByAsset(userId: string, assetId: string): Promise<AssetEntry[]> {
    return this.entryRepo.getByAssetId(userId, assetId);
  }

  async executeByUser(userId: string): Promise<AssetEntry[]> {
    return this.entryRepo.getByUserId(userId);
  }
}
