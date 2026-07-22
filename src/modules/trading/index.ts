// Domain entities
export type { WatchlistCoin } from './domain/entities/Watchlist';
export type { PaperTrade } from './domain/entities/PaperTrade';
export type { BacktestResult, BacktestTrade, BacktestSideStats } from './domain/entities/Backtest';
export type { PriceAlert, AlertMetric, AlertCondition, CreatePriceAlertInput } from './domain/entities/PriceAlert';

// Domain repositories
export type { IWatchlistRepository } from './domain/repositories/IWatchlistRepository';
export type { IPaperTradeRepository } from './domain/repositories/IPaperTradeRepository';

// Domain use-cases
export { GetWatchlist } from './domain/use-cases/GetWatchlist';
export { AddToWatchlist } from './domain/use-cases/AddToWatchlist';
export { RemoveFromWatchlist } from './domain/use-cases/RemoveFromWatchlist';
export { ExecutePaperTrade } from './domain/use-cases/ExecutePaperTrade';
export { GetPaperTrades } from './domain/use-cases/GetPaperTrades';
export { BacktestSignalStrategy } from './domain/use-cases/BacktestSignalStrategy';
export { GetPriceAlerts, CreatePriceAlert, MarkPriceAlertTriggered, DeletePriceAlert } from './domain/use-cases/ManagePriceAlerts';
export { EvaluatePriceAlerts } from './domain/use-cases/EvaluatePriceAlerts';

// Data
export { CoinGeckoService } from './data/CoinGeckoRepository';
export type { CoinMarket, OHLCPoint, CoinSearchResult } from './data/CoinGeckoRepository';
export { FirebaseWatchlistRepository } from './data/FirebaseWatchlistRepository';
export { FirebasePaperTradeRepository } from './data/FirebasePaperTradeRepository';

// Hooks
export { useWatchlist, useCoinMarkets, useCoinDetail, useAddToWatchlist, useRemoveFromWatchlist, useExecutePaperTrade, usePaperTrades, useSignalBacktest } from './presentation/hooks/useTrading';
export { usePriceAlerts, useCoinPriceAlerts, useCreatePriceAlert, useDeletePriceAlert, useAlertWatcher, requestNotificationPermission } from './presentation/hooks/usePriceAlerts';

// Pages
export { TradingPage } from './presentation/pages/TradingPage';
export { CoinDetailPage } from './presentation/pages/CoinDetailPage';

// Components
export { CoinCard } from './presentation/components/CoinCard';
export { CoinSearchModal } from './presentation/components/CoinSearchModal';
export { SignalBadge } from './presentation/components/SignalBadge';
export { SignalScannerModal } from './presentation/components/SignalScannerModal';
export { TradeSetupCard } from './presentation/components/TradeSetupCard';
export { PaperTradeForm } from './presentation/components/PaperTradeForm';
export { BacktestPanel } from './presentation/components/BacktestPanel';
export { PriceAlertModal } from './presentation/components/PriceAlertModal';
export { AlertsList } from './presentation/components/AlertsList';
