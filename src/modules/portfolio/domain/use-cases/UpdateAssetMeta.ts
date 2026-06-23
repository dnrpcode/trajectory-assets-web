import type { IAssetProjectionRepository } from '../repositories/IAssetProjectionRepository';

export interface UpdateAssetMetaInput {
  assetId: string;
  assetName?: string;
  ticker?: string;
  platform?: string;
}

export class UpdateAssetMeta {
  constructor(private projectionRepo: IAssetProjectionRepository) {}

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
  }
}
