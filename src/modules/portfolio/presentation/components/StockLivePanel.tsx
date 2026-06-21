import { useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Check, Wifi, WifiOff } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Asset } from '@/modules/portfolio/domain/entities/Asset';
import { useStockQuote, useStockChart, useSyncStockPrice, ChartRange } from '../hooks/useStockData';
import { formatCurrency } from '@/shared/utils/formatCurrency';

interface Props { asset: Asset }

const RANGES: { label: string; value: ChartRange }[] = [
  { label: 'Hari ini', value: '1d' },
  { label: '5 Hari', value: '5d' },
  { label: '1 Bulan', value: '1mo' },
  { label: '1 Tahun', value: '1y' },
];

function PriceSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height: 32, width: 160, borderRadius: 6, background: 'var(--bg-hover)', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 16, width: 120, borderRadius: 6, background: 'var(--bg-hover)', animation: 'pulse 1.5s infinite' }} />
    </div>
  );
}

export function StockLivePanel({ asset }: Props) {
  const [range, setRange] = useState<ChartRange>('1d');
  const [synced, setSynced] = useState(false);

  const { data: quote, isLoading: quoteLoading, isError: quoteError } = useStockQuote(asset.ticker);
  const { data: chartData = [], isLoading: chartLoading } = useStockChart(asset.ticker, range);
  const { mutateAsync: syncPrice, isPending: isSyncing } = useSyncStockPrice(asset);

  const isUp = (quote?.changePct ?? 0) >= 0;
  const isMarketOpen = quote?.marketState === 'REGULAR';

  const handleSync = async () => {
    if (!quote) return;
    await syncPrice(quote.livePrice);
    setSynced(true);
    setTimeout(() => setSynced(false), 3000);
  };

  const priceColor = isUp ? 'var(--gain-400)' : 'var(--loss-400)';
  const areaColor = isUp ? 'var(--gain-500)' : 'var(--loss-500)';

  // Filter null prices for chart min/max
  const prices = chartData.map((d) => d.price).filter((p): p is number => p !== null);
  const yMin = prices.length > 0 ? Math.min(...prices) * 0.998 : undefined;
  const yMax = prices.length > 0 ? Math.max(...prices) * 1.002 : undefined;

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
              Harga Pasar
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                background: isMarketOpen ? 'var(--gain-tint)' : 'var(--bg-raised)',
                color: isMarketOpen ? 'var(--gain-400)' : 'var(--text-muted)',
                border: `1px solid ${isMarketOpen ? 'rgba(15,186,130,0.25)' : 'var(--border-dim)'}`,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              {isMarketOpen ? <Wifi size={9} strokeWidth={2.5} /> : <WifiOff size={9} strokeWidth={2.5} />}
              {isMarketOpen ? 'Live' : 'Tutup'}
            </span>
          </div>

          {quoteLoading ? <PriceSkeleton /> : quoteError ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gagal memuat harga pasar</p>
          ) : quote ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(quote.livePrice)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: priceColor }}>
                  {isUp ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                  {isUp ? '+' : ''}{formatCurrency(quote.change)} ({isUp ? '+' : ''}{quote.changePct.toFixed(2)}%)
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Penutupan kemarin: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatCurrency(quote.prevClose)}</span>
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Tersimpan: <span style={{ fontFamily: 'var(--font-mono)', color: asset.currentPricePerUnit !== quote.livePrice ? 'var(--warn-400)' : 'var(--text-secondary)' }}>
                    {formatCurrency(asset.currentPricePerUnit)}
                  </span>
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Sync button */}
        {quote && !quoteError && (
          <button
            onClick={handleSync}
            disabled={isSyncing || synced}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: isSyncing || synced ? 'default' : 'pointer',
              transition: 'all 200ms',
              background: synced ? 'var(--gain-tint)' : 'var(--blue-tint)',
              color: synced ? 'var(--gain-400)' : 'var(--blue-300)',
              border: `1px solid ${synced ? 'rgba(15,186,130,0.25)' : 'rgba(77,124,255,0.25)'}`,
              opacity: isSyncing ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            {synced ? (
              <><Check size={14} strokeWidth={2.5} /> Tersimpan</>
            ) : isSyncing ? (
              <><RefreshCw size={14} strokeWidth={2.5} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan…</>
            ) : (
              <><RefreshCw size={14} strokeWidth={2.5} /> Sync {formatCurrency(quote.livePrice)}</>
            )}
          </button>
        )}
      </div>

      {/* Chart area */}
      <div style={{ padding: '16px 12px 8px' }}>
        {chartLoading ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Memuat grafik…</span>
          </div>
        ) : chartData.length < 2 ? (
          <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Data grafik tidak tersedia</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="stockGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={areaColor} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[yMin ?? 'auto', yMax ?? 'auto']}
                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v: number) => {
                  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
                  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                  return String(Math.round(v));
                }}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), 'Harga']}
                contentStyle={{
                  background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
                  borderRadius: 8, fontSize: 12, color: 'var(--text-primary)',
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={areaColor}
                strokeWidth={2}
                fill="url(#stockGrad)"
                dot={false}
                activeDot={{ r: 4, fill: areaColor, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* Range selector */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 8 }}>
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'all 150ms',
                background: range === value ? 'var(--blue-tint)' : 'transparent',
                color: range === value ? 'var(--blue-300)' : 'var(--text-muted)',
                border: `1px solid ${range === value ? 'rgba(77,124,255,0.25)' : 'transparent'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
