import { useState, useMemo } from 'react';
import { Plus, TrendingUp, Scan, AlertTriangle } from 'lucide-react';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { CoinListSkeleton } from '@/shared/ui/Skeleton';
import { CoinCard } from '../components/CoinCard';
import { CoinSearchModal } from '../components/CoinSearchModal';
import { SignalScannerModal } from '../components/SignalScannerModal';
import { useWatchlist, useCoinMarkets } from '../hooks/useTrading';
import { getCoinGeckoErrorMessage, CoinMarket } from '../../data/CoinGeckoRepository';

export function TradingPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const { data: watchlist = [], isLoading: watchlistLoading } = useWatchlist();

  const coinIds = useMemo(() => watchlist.map((w) => w.coinId), [watchlist]);
  const { data: markets = [], error: marketsError } = useCoinMarkets(coinIds);
  const marketMap = useMemo(() => Object.fromEntries(markets.map((m: CoinMarket) => [m.id, m])), [markets]);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
            Trading
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Sinyal RSI + MA · Setup entry, stop loss & take profit
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" onClick={() => setScannerOpen(true)} icon={<Scan size={14} />}>
            Cari Sinyal
          </Button>
          <Button onClick={() => setSearchOpen(true)} icon={<Plus size={14} strokeWidth={2.5} />}>
            Tambah Coin
          </Button>
        </div>
      </div>

      {/* API error banner */}
      {!!marketsError && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 10, marginBottom: 16,
          background: 'var(--warn-tint)', border: '1px solid rgba(245,158,11,0.25)',
        }}>
          <AlertTriangle size={14} style={{ color: 'var(--warn-400)', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--warn-400)' }}>
            {getCoinGeckoErrorMessage(marketsError)} Harga mungkin tidak terupdate.
          </p>
        </div>
      )}

      {/* Watchlist */}
      {watchlistLoading ? (
        <CoinListSkeleton />
      ) : watchlist.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '64px 24px', textAlign: 'center',
          background: 'var(--bg-surface)', border: '1px dashed var(--border-default)', borderRadius: 16,
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <TrendingUp size={24} style={{ color: 'var(--blue-400)' }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Belum ada coin di watchlist</h3>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-muted)', maxWidth: 320 }}>
            Tambahkan coin crypto untuk melihat sinyal RSI & MA, rekomendasi entry, stop loss, take profit, dan leverage.
          </p>
          <Button onClick={() => setSearchOpen(true)} icon={<Plus size={14} />}>
            Tambah Coin Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlist.map((coin) => (
            <CoinCard key={coin.coinId} coin={coin} market={marketMap[coin.coinId]} />
          ))}
        </div>
      )}

      <CoinSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SignalScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </Layout>
  );
}
