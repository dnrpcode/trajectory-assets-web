import { AssetEntry } from '@/shared/types/assetEntry';

export interface IAssetEntryRepository {
  getByUserId(userId: string): Promise<AssetEntry[]>;
  getByAssetId(userId: string, assetId: string): Promise<AssetEntry[]>;
  create(entry: Omit<AssetEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<AssetEntry>;
  markCorrected(userId: string, entryId: string): Promise<void>;
  delete(userId: string, entryId: string): Promise<void>;
  deleteByAssetId(userId: string, assetId: string): Promise<void>;
  updateMetaByAssetId(
    userId: string,
    assetId: string,
    patch: { assetName?: string; ticker?: string; platform?: string },
  ): Promise<void>;
}
