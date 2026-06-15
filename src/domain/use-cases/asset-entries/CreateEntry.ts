import { IAssetEntryRepository } from '../../repositories/IAssetEntryRepository';
import { AssetEntry } from '../../entities/AssetEntry';

export type CreateEntryInput = Omit<AssetEntry, 'id' | 'createdAt' | 'updatedAt' | 'isCorrected'>;

export class CreateEntry {
  constructor(private entryRepo: IAssetEntryRepository) {}

  async execute(input: CreateEntryInput): Promise<AssetEntry> {
    return this.entryRepo.create({ ...input, isCorrected: false });
  }
}
