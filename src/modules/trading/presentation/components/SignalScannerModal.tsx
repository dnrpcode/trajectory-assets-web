import { useQueryClient } from '@tanstack/react-query';
import { Scan, X, Loader2, Plus } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { SignalBadge } from './SignalBadge';
import { useSignalScanner, useAddToWatchlist, useWatchlist, ScanResult } from '../hooks/useTrading';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SignalScannerModal({ open, onClose }: Props) {
  const qc = useQueryClient();
  const { data: results, isFetching, isError } = useSignalScanner();
  const { data: watchlist = [] } = useWatchlist();
  const addMutation = useAddToWatchlist();

  const watchlistIds = new Set(watchlist.map((w) => w.coinId));

  const handleScan = () => {
    qc.invalidateQueries({ queryKey: ['signalScanner'] });
    qc.fetchQuery({ queryKey: ['signalScanner'] });
  };

  const byScoreStrength = (a: ScanResult, b: ScanResult) => Math.abs(b.signal.score) - Math.abs(a.signal.score);
  const strong = (results?.filter((r) => r.signal.signal !== 'HOLD') ?? []).sort(byScoreStrength);
  const hold = (results?.filter((r) => r.signal.signal === 'HOLD') ?? []).sort(byScoreStrength);

  const renderRow = (r: ScanResult) => (
    <div key={r.id} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'var(--bg-raised)', borderRadius: 10, border: '1px solid var(--border-subtle)',
    }}>
      {r.image && <img src={r.image} style={{ width: 28, height: 28, borderRadius: '50%' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{r.symbol}</span>
          <SignalBadge signal={r.signal.signal} size="sm" />
          <span style={{
            fontSize: '10px', fontWeight: 700, fontFamily: 'var(--font-mono)',
            color: r.signal.score >= 30 ? 'var(--gain-500)' : r.signal.score <= -30 ? 'var(--loss-500)' : 'var(--text-muted)',
          }}>
            {r.signal.score >= 0 ? '+' : ''}{r.signal.score}
          </span>
        </div>
        <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--text-muted)' }}>{r.signal.reason}</p>
      </div>
      <div style={{ textAlign: 'right', marginRight: 8 }}>
        {r.currentPrice !== undefined && (
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            ${r.currentPrice.toLocaleString('en-US', { maximumFractionDigits: 4 })}
          </p>
        )}
        {r.priceChange24h !== undefined && (
          <p style={{ margin: 0, fontSize: '10px', color: r.priceChange24h >= 0 ? 'var(--gain-500)' : 'var(--loss-500)', fontFamily: 'var(--font-mono)' }}>
            {r.priceChange24h >= 0 ? '+' : ''}{r.priceChange24h.toFixed(2)}%
          </p>
        )}
      </div>
      {!watchlistIds.has(r.id) && (
        <button
          onClick={() => addMutation.mutate({ coinId: r.id, symbol: r.symbol, name: r.name })}
          disabled={addMutation.isPending}
          style={{
            background: 'var(--blue-tint)', border: '1px solid rgba(77,124,255,0.2)',
            borderRadius: 7, padding: '5px 8px', cursor: 'pointer',
            color: 'var(--blue-400)', display: 'flex', alignItems: 'center', gap: 3,
            fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
          }}
        >
          <Plus size={11} /> Add
        </button>
      )}
    </div>
  );

  return (
    <Modal open={open} onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Scan size={16} style={{ color: 'var(--blue-400)' }} />
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Signal Scanner</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={16} />
          </button>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Scan RSI + MA crossover untuk {12} top crypto. Masing-masing ~300ms, total ±4 detik.
        </p>

        {/* Scan button */}
        {!results && !isFetching && (
          <button
            onClick={handleScan}
            style={{
              width: '100%', padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--blue-500)', color: '#fff', fontWeight: 700, fontSize: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Scan size={15} /> Mulai Scan
          </button>
        )}

        {/* Loading */}
        {isFetching && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '32px 0' }}>
            <Loader2 size={28} style={{ color: 'var(--blue-400)', animation: 'spin 1s linear infinite' }} />
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>Scanning signals...</p>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Mengambil data 30 hari dari CoinGecko</p>
          </div>
        )}

        {/* Error */}
        {isError && !isFetching && (
          <div style={{ padding: '12px', background: 'var(--loss-tint)', borderRadius: 8, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--loss-500)' }}>Gagal scan. CoinGecko mungkin rate-limit. Coba lagi dalam 1 menit.</p>
          </div>
        )}

        {/* Results */}
        {results && !isFetching && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {strong.length > 0 && (
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Sinyal Kuat ({strong.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {strong.map(renderRow)}
                </div>
              </div>
            )}

            {hold.length > 0 && (
              <div>
                <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Hold / Netral ({hold.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {hold.map(renderRow)}
                </div>
              </div>
            )}

            <button
              onClick={handleScan}
              style={{
                padding: '8px', borderRadius: 8, border: '1px solid var(--border-default)',
                background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
                fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'var(--font-sans)',
              }}
            >
              <Scan size={12} /> Refresh Scan
            </button>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </Modal>
  );
}
