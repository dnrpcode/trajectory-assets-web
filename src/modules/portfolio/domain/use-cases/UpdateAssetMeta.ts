import type { IAssetProjectionRepository } from '../repositories/IAssetProjectionRepository';
import type { IAssetEntryRepository } from '../repositories/IAssetEntryRepository';

export interface UpdateAssetMetaInput {
  assetId: string;
  assetName?: string;
  ticker?: string;
  platform?: string;
}

export class UpdateAssetMeta {
  constructor(
    private projectionRepo: IAssetProjectionRepository,
    private entryRepo: IAssetEntryRepository,
  ) {}

  async execute(userId: string, input: UpdateAssetMetaInput): Promise<void> {
    const current = await this.projectionRepo.getById(userId, input.assetId);
    if (!current) throw new Error(`Asset ${input.assetId} not found`);

    const updated = {
      ...current,
      ...(input.assetName !== undefined && { assetName: input.assetName }),
      ...(input.ticker !== undefined && { ticker: input.ticker }),
      ...(input.platform !== undefined && { platform: input.platform }),
      updatedAt: new Date(),
    };

    await this.projectionRepo.save(updated);

    // Entries are the source of truth replayed by RecomputeAssetProjection —
    // without this, the next entry mutation would revert the asset's meta fields.
    await this.entryRepo.updateMetaByAssetId(userId, input.assetId, {
      assetName: input.assetName,
      ticker: input.ticker,
      platform: input.platform,
    });
  }
}
