import { IAssetEntryRepository } from '../../repositories/IAssetEntryRepository';
import { AssetEntry } from '../../entities/AssetEntry';

export class GetAssetHistory {
  constructor(private entryRepo: IAssetEntryRepository) {}

  async execute(userId: string, assetId: string): Promise<AssetEntry[]> {
    return this.entryRepo.getByAssetId(userId, assetId);
  }
}
