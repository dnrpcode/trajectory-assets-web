// Domain entities
export type { Asset } from './domain/entities/Asset';
export type { AssetEntry } from './domain/entities/AssetEntry';

// Domain repositories
export type { IAssetEntryRepository } from './domain/repositories/IAssetEntryRepository';
export type { IAssetProjectionRepository } from './domain/repositories/IAssetProjectionRepository';

// Domain entities (investor flow)
export type { InvestorFlowData, FlowSeriesPoint, ScorecardPoint, FlowSignal } from './domain/entities/InvestorFlow';

// Domain use-cases
export { CreateEntry } from './domain/use-cases/CreateEntry';
export type { CreateEntryInput } from './domain/use-cases/CreateEntry';
export { DeleteEntry } from './domain/use-cases/DeleteEntry';
export { GetAssetEntries } from './domain/use-cases/GetAssetEntries';
export { RecomputeAssetProjection } from './domain/use-cases/RecomputeAssetProjection';
export { GetActiveAssets } from './domain/use-cases/GetActiveAssets';
export { GetAllAssets } from './domain/use-cases/GetAllAssets';
export { DeleteAsset } from './domain/use-cases/DeleteAsset';
export { UpdateAssetMeta } from './domain/use-cases/UpdateAssetMeta';
export type { UpdateAssetMetaInput } from './domain/use-cases/UpdateAssetMeta';

// Data
export { FirebaseAssetEntryRepository } from './data/FirebaseAssetEntryRepository';
export { FirebaseAssetProjectionRepository } from './data/FirebaseAssetProjectionRepository';

// Presentation hooks
export { useActiveAssets, useAllAssets, useDeleteAsset } from './presentation/hooks/useAssets';
export { useAssetEntries, useEntries, useDeleteEntry, useCreateEntry } from './presentation/hooks/useEntries';

// Presentation pages
export { PortfolioPage } from './presentation/pages/PortfolioPage';
export { AssetDetailPage } from './presentation/pages/AssetDetailPage';

// Presentation components
export { AssetCard } from './presentation/components/AssetCard';
export { StaleAssetBanner } from './presentation/components/StaleAssetBanner';
export { EntryForm } from './presentation/components/EntryForm';
export { StockForecastCard } from './presentation/components/StockForecastCard';
