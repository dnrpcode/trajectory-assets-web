// Domain entities
export type { WatchlistCoin } from './domain/entities/Watchlist';
export type { PaperTrade } from './domain/entities/PaperTrade';

// Domain repositories
export type { IWatchlistRepository } from './domain/repositories/IWatchlistRepository';
export type { IPaperTradeRepository } from './domain/repositories/IPaperTradeRepository';

// Domain use-cases
export { GetWatchlist } from './domain/use-cases/GetWatchlist';
export { AddToWatchlist } from './domain/use-cases/AddToWatchlist';
export { RemoveFromWatchlist } from './domain/use-cases/RemoveFromWatchlist';
export { ExecutePaperTrade } from './domain/use-cases/ExecutePaperTrade';
export { GetPaperTrades } from './domain/use-cases/GetPaperTrades';

// Data
export { CoinGeckoService } from './data/CoinGeckoRepository';
export type { CoinMarket, OHLCPoint, CoinSearchResult } from './data/CoinGeckoRepository';
export { FirebaseWatchlistRepository } from './data/FirebaseWatchlistRepository';
export { FirebasePaperTradeRepository } from './data/FirebasePaperTradeRepository';

// Hooks
export { useWatchlist, useCoinMarkets, useCoinDetail, useAddToWatchlist, useRemoveFromWatchlist, useExecutePaperTrade, usePaperTrades } from './presentation/hooks/useTrading';

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
