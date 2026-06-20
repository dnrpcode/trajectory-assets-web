import { useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { WatchlistCoin } from '../../../domain/entities/Watchlist';
import { CoinMarket } from '../../../data/coingecko/CoinGeckoService';
import { SignalBadge } from './SignalBadge';
import { useCoinDetail, useRemoveFromWatchlist } from '../../hooks/useTrading';

interface Props {
  coin: WatchlistCoin;
  market?: CoinMarket;
}

export function CoinCard({ coin, market }: Props) {
  const navigate = useNavigate();
  const { data: detail } = useCoinDetail(coin.coinId);
  const removeMutation = useRemoveFromWatchlist();

  const priceChange = market?.price_change_percentage_24h ?? 0;
  const isUp = priceChange >= 0;

  return (
    <div
      onClick={() => navigate(`/trading/${coin.coinId}`)}
      style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
        borderRadius: 14, padding: '16px', cursor: 'pointer',
        transition: 'border-color 150ms, background 150ms',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-default)';
        (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-raised)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
        (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-surface)';
      }}
    >
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); removeMutation.mutate(coin.coinId); }}
        style={{
          position: 'absolute', top: 10, right: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: 4, borderRadius: 6,
          opacity: 0.5, transition: 'opacity 150ms',
        }}
        onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
        onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.opacity = '0.5'}
      >
        <Trash2 size={13} />
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingRight: 20 }}>
        {market?.image ? (
          <img src={market.image} alt={coin.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
        ) : (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
            {coin.symbol.slice(0, 2)}
          </div>
        )}
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{coin.name}</p>
          <p style={{ margin: 0, fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{coin.symbol}</p>
        </div>
        {detail && <SignalBadge signal={detail.signal.signal} size="sm" />}
      </div>

      {/* Price */}
      {market && (
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            ${market.current_price.toLocaleString('en-US', { maximumFractionDigits: 4 })}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isUp ? <TrendingUp size={12} style={{ color: 'var(--gain-500)' }} /> : <TrendingDown size={12} style={{ color: 'var(--loss-500)' }} />}
            <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: isUp ? 'var(--gain-500)' : 'var(--loss-500)' }}>
              {isUp ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>
        </div>
      )}

      {/* RSI indicator */}
      {detail && !isNaN(detail.signal.rsi) && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>RSI</span>
          <div style={{ flex: 1, height: 4, background: 'var(--bg-overlay)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${detail.signal.rsi}%`,
              background: detail.signal.rsi > 70 ? 'var(--loss-500)' : detail.signal.rsi < 30 ? 'var(--gain-500)' : 'var(--blue-400)',
              borderRadius: 2,
              transition: 'width 400ms ease',
            }} />
          </div>
          <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', minWidth: 24 }}>
            {detail.signal.rsi.toFixed(0)}
          </span>
        </div>
      )}

      {detail && (
        <p style={{ margin: '6px 0 0', fontSize: '10px', color: 'var(--text-muted)' }}>
          {detail.signal.reason}
        </p>
      )}
    </div>
  );
}
