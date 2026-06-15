import { FirebaseUserRepository } from '../../data/firebase/FirebaseUserRepository';
import { FirebaseAssetEntryRepository } from '../../data/firebase/FirebaseAssetEntryRepository';
import { FirebaseAssetProjectionRepository } from '../../data/firebase/FirebaseAssetProjectionRepository';
import { FirebasePortfolioRepository } from '../../data/firebase/FirebasePortfolioRepository';
import { CreateEntry } from '../../domain/use-cases/asset-entries/CreateEntry';
import { RecomputeAssetProjection } from '../../domain/use-cases/asset-entries/RecomputeAssetProjection';
import { GetActiveAssets } from '../../domain/use-cases/assets/GetActiveAssets';
import { GetAssetHistory } from '../../domain/use-cases/assets/GetAssetHistory';
import { DeleteAsset } from '../../domain/use-cases/assets/DeleteAsset';
import { GetPortfolioSummary } from '../../domain/use-cases/portfolio/GetPortfolioSummary';
import { GetPortfolioHistory } from '../../domain/use-cases/portfolio/GetPortfolioHistory';

// Repositories
export const userRepository = new FirebaseUserRepository();
export const entryRepository = new FirebaseAssetEntryRepository();
export const projectionRepository = new FirebaseAssetProjectionRepository();
export const portfolioRepository = new FirebasePortfolioRepository();

// Use cases
export const createEntry = new CreateEntry(entryRepository);
export const recomputeAssetProjection = new RecomputeAssetProjection(
  entryRepository,
  projectionRepository,
);
export const getActiveAssets = new GetActiveAssets(projectionRepository);
export const getAssetHistory = new GetAssetHistory(entryRepository);
export const deleteAsset = new DeleteAsset(projectionRepository, entryRepository);
export const getPortfolioSummary = new GetPortfolioSummary(projectionRepository);
export const getPortfolioHistory = new GetPortfolioHistory(portfolioRepository);
