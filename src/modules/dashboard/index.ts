// Domain
export type { PortfolioHistoryPoint, PortfolioSummary } from './domain/entities/Portfolio';
export type { IPortfolioRepository } from './domain/repositories/IPortfolioRepository';
export { GetPortfolioSummary } from './domain/use-cases/GetPortfolioSummary';
export { GetPortfolioHistory } from './domain/use-cases/GetPortfolioHistory';
export { BackfillPortfolioHistory } from './domain/use-cases/BackfillPortfolioHistory';

// Data
export { FirebasePortfolioRepository } from './data/FirebasePortfolioRepository';

// Hooks
export { usePortfolioSummary, usePortfolioHistory } from './presentation/hooks/usePortfolio';

// Pages
export { DashboardPage } from './presentation/pages/DashboardPage';
export { ProjectionsPage } from './presentation/pages/ProjectionsPage';
export { AdvisoryPage } from './presentation/pages/AdvisoryPage';
export { JournalPage } from './presentation/pages/JournalPage';

// Components
export { AllocationPieChart } from './presentation/components/AllocationPieChart';
export { WealthGrowthChart } from './presentation/components/WealthGrowthChart';
export { PlatformAllocationChart } from './presentation/components/PlatformAllocationChart';
export { PnLByCategoryChart } from './presentation/components/PnLByCategoryChart';
export { CAGRProjectionChart } from './presentation/components/CAGRProjectionChart';
export { ReallocationAdvisory } from './presentation/components/ReallocationAdvisory';
