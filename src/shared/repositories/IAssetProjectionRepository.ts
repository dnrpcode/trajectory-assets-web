import { Asset } from '@/shared/types/asset';

export interface IAssetProjectionRepository {
  getByUserId(userId: string): Promise<Asset[]>;
  getById(userId: string, assetId: string): Promise<Asset | null>;
  save(asset: Asset): Promise<void>;
  delete(userId: string, assetId: string): Promise<void>;
}
