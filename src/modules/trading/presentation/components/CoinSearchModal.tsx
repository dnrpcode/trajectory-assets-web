import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Loader } from 'lucide-react';
import { CoinGeckoService, CoinSearchResult } from '../../data/CoinGeckoRepository';
import { useAddToWatchlist, useWatchlist } from '../hooks/useTrading';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CoinSearchModal({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CoinSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data: watchlist = [] } = useWatchlist();
  const addMutation = useAddToWatchlist();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await CoinGeckoService.search(query);
        setResults(res);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const watchlistIds = new Set(watchlist.map((w) => w.coinId));

  const handleAdd = async (coin: CoinSearchResult) => {
    await addMutation.mutateAsync({ coinId: coin.id, symbol: coin.symbol.toUpperCase(), name: coin.name });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 16, width: '100%', maxWidth: 480, overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari coin... (BTC, Ethereum, Solana)"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)',
            }}
          />
          {loading && <Loader size={14} style={{ color: 'var(--text-muted)', animation: 'spin 1s linear infinite' }} />}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {results.length === 0 && query && !loading && (
            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Tidak ada hasil untuk "{query}"
            </p>
          )}
          {results.length === 0 && !query && (
            <p style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Ketik nama atau simbol coin untuk mencari
            </p>
          )}
          {results.map((coin) => {
            const inWatchlist = watchlistIds.has(coin.id);
            return (
              <div
                key={coin.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  cursor: inWatchlist ? 'default' : 'pointer',
                  opacity: inWatchlist ? 0.5 : 1,
                  transition: 'background 150ms',
                }}
                onMouseEnter={(e) => { if (!inWatchlist) (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; }}
                onClick={() => !inWatchlist && handleAdd(coin)}
              >
                {coin.thumb ? (
                  <img src={coin.thumb} alt={coin.name} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {coin.symbol.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{coin.name}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{coin.symbol.toUpperCase()}</p>
                </div>
                {inWatchlist ? (
                  <span style={{ fontSize: '11px', color: 'var(--gain-500)', fontWeight: 600 }}>Sudah ditambahkan</span>
                ) : (
                  <Plus size={16} style={{ color: 'var(--blue-400)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
