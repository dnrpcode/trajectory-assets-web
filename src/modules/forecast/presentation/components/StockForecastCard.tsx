import { Sparkles, TrendingUp, TrendingDown, Info, ExternalLink, Newspaper } from 'lucide-react';
import type { Asset } from '@/modules/portfolio/domain/entities/Asset';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { useStockForecast, useStockNews } from '../hooks/useForecast';
import type { ForecastConfidence } from '../../domain/entities/Forecast';

interface Props {
  asset: Asset;
}

const CONFIDENCE_META: Record<ForecastConfidence, { label: string; color: string; tint: string }> = {
  high: { label: 'Keyakinan tinggi', color: 'var(--gain-400)', tint: 'var(--gain-tint)' },
  medium: { label: 'Keyakinan sedang', color: 'var(--warn-400)', tint: 'var(--warn-tint)' },
  low: { label: 'Keyakinan rendah', color: 'var(--loss-400)', tint: 'var(--loss-tint)' },
};

function timeAgo(ms: number): string {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'baru saja';
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  return `${d} hari lalu`;
}

export function StockForecastCard({ asset }: Props) {
  const { data, isLoading, isError } = useStockForecast(asset.ticker);
  const { data: news = [] } = useStockNews(asset.ticker);

  const result = data?.result ?? null;
  const isMarketOpen = data?.marketState === 'REGULAR';

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={15} strokeWidth={2} style={{ color: 'var(--ai-accent)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Estimasi Penutupan Berikutnya</span>
          {result && (
            <span
              style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: CONFIDENCE_META[result.confidence].tint,
                color: CONFIDENCE_META[result.confidence].color,
              }}
            >
              {CONFIDENCE_META[result.confidence].label}
            </span>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
          Simulasi Monte Carlo dari {result?.sampleDays ?? '—'} hari data historis ·{' '}
          {result?.simulations.toLocaleString('id-ID') ?? '—'} skenario
        </p>
      </div>

      <div style={{ padding: '16px 20px' }}>
        {isLoading ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Menghitung estimasi…</p>
        ) : isError ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>Gagal memuat data estimasi.</p>
        ) : !result ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', padding: '12px 0' }}>
            Data historis belum cukup untuk membuat estimasi (minimal 20 hari perdagangan).
          </p>
        ) : (
          <>
            {isMarketOpen && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 14,
                  borderRadius: 10, background: 'var(--blue-tint)', border: '1px solid rgba(77,124,255,0.2)',
                }}
              >
                <Info size={13} strokeWidth={2} style={{ color: 'var(--blue-300)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--blue-300)' }}>
                  Pasar sedang buka — estimasi ini untuk penutupan berikutnya.
                </span>
              </div>
            )}

            {/* Median estimate */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatCurrency(result.median)}
              </span>
              {(() => {
                const diffPct = result.lastPrice > 0 ? ((result.median - result.lastPrice) / result.lastPrice) * 100 : 0;
                const up = diffPct >= 0;
                return (
                  <span
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600,
                      color: up ? 'var(--gain-400)' : 'var(--loss-400)',
                    }}
                  >
                    {up ? <TrendingUp size={14} strokeWidth={2.5} /> : <TrendingDown size={14} strokeWidth={2.5} />}
                    {up ? '+' : ''}{diffPct.toFixed(2)}% vs {formatCurrency(result.lastPrice)}
                  </span>
                );
              })()}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16 }}>Estimasi tengah (median dari semua skenario)</p>

            {/* Likely range bar */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Rentang wajar <span style={{ color: 'var(--text-muted)' }}>(80% skenario)</span>
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formatCurrency(result.p10)} – {formatCurrency(result.p90)}
                </span>
              </div>
              <ForecastHistogram result={result} />
            </div>

            {/* Probability up/down */}
            <div style={{ display: 'flex', gap: 10 }}>
              <ProbCell label="Peluang Naik" pct={result.probUp * 100} color="var(--gain-400)" tint="var(--gain-tint)" />
              <ProbCell label="Peluang Turun" pct={(1 - result.probUp) * 100} color="var(--loss-400)" tint="var(--loss-tint)" />
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
              <span>Volatilitas harian: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{result.dailyVolatilityPct.toFixed(2)}%</span></span>
              <span>Tren harian: <span style={{ fontFamily: 'var(--font-mono)', color: result.dailyDriftPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)' }}>{result.dailyDriftPct >= 0 ? '+' : ''}{result.dailyDriftPct.toFixed(3)}%</span></span>
            </div>
          </>
        )}

        {/* News context */}
        {news.length > 0 && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Newspaper size={13} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Berita Terkait</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {news.map((n, i) => (
                <a
                  key={i}
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 10,
                    background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4, margin: 0 }}>{n.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                      {n.publisher}{n.publishedAt ? ` · ${timeAgo(n.publishedAt)}` : ''}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div
          style={{
            display: 'flex', gap: 8, marginTop: 16, padding: '10px 12px', borderRadius: 10,
            background: 'var(--bg-raised)', border: '1px solid var(--border-dim)',
          }}
        >
          <Info size={13} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Estimasi statistik dari pergerakan harga historis — <strong>bukan saran investasi</strong>. Harga saham
            tidak dapat diprediksi dengan pasti; pergunakan hanya sebagai gambaran rentang, bukan kepastian.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProbCell({ label, pct, color, tint }: { label: string; pct: number; color: string; tint: string }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, background: tint, textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color, margin: 0 }}>{pct.toFixed(0)}%</p>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</p>
    </div>
  );
}

function ForecastHistogram({ result }: { result: import('../../domain/entities/Forecast').ForecastResult }) {
  const maxCount = Math.max(...result.histogram.map((b) => b.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
      {result.histogram.map((b, i) => {
        const h = Math.max(4, (b.count / maxCount) * 100);
        // Bucket closest to median gets accent
        const isMedianBucket =
          Math.abs(b.price - result.median) ===
          Math.min(...result.histogram.map((x) => Math.abs(x.price - result.median)));
        return (
          <div
            key={i}
            title={`${formatCurrency(b.price)} · ${b.count} skenario`}
            style={{
              flex: 1,
              height: `${h}%`,
              borderRadius: 3,
              background: isMedianBucket
                ? 'var(--ai-accent)'
                : b.inRange
                ? 'var(--blue-400)'
                : 'var(--border-default)',
              opacity: b.inRange || isMedianBucket ? 1 : 0.6,
              transition: 'height 200ms',
            }}
          />
        );
      })}
    </div>
  );
}
