import { Sparkles, Info, ExternalLink, Newspaper, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Asset } from '@/modules/portfolio/domain/entities/Asset';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { useStockForecast, useStockNews } from '../hooks/useForecast';
import type { ForecastConfidence, ForecastResult, TrendSignal } from '../../domain/entities/Forecast';

interface Props { asset: Asset }

// ── Constants ─────────────────────────────────────────────────────────────────

const CONFIDENCE_META: Record<ForecastConfidence, { label: string; color: string; tint: string }> = {
  high:   { label: 'Volatilitas rendah',  color: 'var(--gain-400)', tint: 'var(--gain-tint)' },
  medium: { label: 'Volatilitas sedang',  color: 'var(--warn-400)', tint: 'var(--warn-tint)' },
  low:    { label: 'Volatilitas tinggi',  color: 'var(--loss-400)', tint: 'var(--loss-tint)' },
};

const TREND_META: Record<TrendSignal, { label: string; color: string; icon: React.ReactNode }> = {
  strong_up:   { label: 'Tren naik kuat',  color: 'var(--gain-400)',    icon: <TrendingUp size={13} strokeWidth={2.5} /> },
  up:          { label: 'Tren naik',        color: 'var(--gain-400)',    icon: <TrendingUp size={13} strokeWidth={2.5} /> },
  flat:        { label: 'Sideways',         color: 'var(--text-muted)',  icon: <Minus size={13} strokeWidth={2.5} /> },
  down:        { label: 'Tren turun',       color: 'var(--loss-400)',    icon: <TrendingDown size={13} strokeWidth={2.5} /> },
  strong_down: { label: 'Tren turun kuat',  color: 'var(--loss-400)',    icon: <TrendingDown size={13} strokeWidth={2.5} /> },
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function timeAgo(ms: number): string {
  if (!ms) return '';
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'baru saja';
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function pctColor(v: number | null) {
  if (v === null) return 'var(--text-muted)';
  return v > 0 ? 'var(--gain-400)' : v < 0 ? 'var(--loss-400)' : 'var(--text-secondary)';
}

function fmtPct(v: number | null, decimals = 2) {
  if (v === null) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(decimals)}%`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
      {children}
    </p>
  );
}

function StatRow({ label, value, color, mono = true }: { label: string; value: React.ReactNode; color?: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: 12, fontWeight: 600, color: color ?? 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  );
}

function RsiGauge({ rsi }: { rsi: number }) {
  const color = rsi < 30 ? 'var(--gain-400)' : rsi > 70 ? 'var(--loss-400)' : 'var(--blue-300)';
  const label = rsi < 30 ? 'Oversold — potensi rebound' : rsi > 70 ? 'Overbought — hati-hati' : 'Zona netral';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>RSI (14)</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color }}>{rsi.toFixed(1)}</span>
      </div>
      {/* Track */}
      <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'var(--bg-raised)', overflow: 'hidden' }}>
        {/* Zones */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', background: 'rgba(15,186,130,0.18)' }} />
        <div style={{ position: 'absolute', left: '70%', top: 0, bottom: 0, right: 0, background: 'rgba(240,71,106,0.18)' }} />
        {/* Needle */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 99, background: color, left: `calc(${Math.min(100, Math.max(0, rsi))}% - 1.5px)`, transition: 'left 600ms ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: 'var(--gain-400)' }}>Oversold 30</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>{label}</span>
        <span style={{ fontSize: 9, color: 'var(--loss-400)' }}>70 Overbought</span>
      </div>
    </div>
  );
}

function BollingerBar({ pctB }: { pctB: number }) {
  const clamp = Math.min(110, Math.max(-10, pctB));
  const color = pctB < 20 ? 'var(--gain-400)' : pctB > 80 ? 'var(--loss-400)' : 'var(--blue-300)';
  const label = pctB < 20 ? 'Dekat lower band' : pctB > 80 ? 'Dekat upper band' : 'Dalam channel';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Bollinger %B</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color }}>{pctB.toFixed(0)}%</span>
      </div>
      <div style={{ position: 'relative', height: 6, borderRadius: 99, background: 'linear-gradient(to right, rgba(15,186,130,0.25), var(--bg-raised), rgba(240,71,106,0.25))', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 99, background: color, left: `calc(${Math.min(100, Math.max(0, clamp))}% - 1.5px)`, transition: 'left 600ms ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span style={{ fontSize: 9, color: 'var(--gain-400)' }}>Lower band</span>
        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: 9, color: 'var(--loss-400)' }}>Upper band</span>
      </div>
    </div>
  );
}

function PriceZoneBar({ result }: { result: ForecastResult }) {
  const { support, resistance, high52w, low52w, priceVs52wPct } = result.levels;
  const last = result.lastPrice;
  const range52 = high52w - low52w || 1;

  const toBar = (price: number) => Math.min(100, Math.max(0, ((price - low52w) / range52) * 100));

  return (
    <div>
      {/* 52W range bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-secondary)' }}>Posisi dalam 52W range</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>{priceVs52wPct.toFixed(0)}%</span>
      </div>
      <div style={{ position: 'relative', height: 8, borderRadius: 99, background: 'var(--bg-raised)', overflow: 'visible', marginBottom: 6 }}>
        {/* Fill */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${priceVs52wPct}%`, borderRadius: 99, background: 'var(--blue-400)', opacity: 0.35 }} />
        {/* Support marker */}
        {support !== null && (
          <div title={`Support: ${formatCurrency(support)}`} style={{ position: 'absolute', top: -2, bottom: -2, width: 2, borderRadius: 99, background: 'var(--gain-400)', left: `${toBar(support)}%` }} />
        )}
        {/* Resistance marker */}
        {resistance !== null && (
          <div title={`Resistance: ${formatCurrency(resistance)}`} style={{ position: 'absolute', top: -2, bottom: -2, width: 2, borderRadius: 99, background: 'var(--loss-400)', left: `${toBar(resistance)}%` }} />
        )}
        {/* Current price dot */}
        <div style={{ position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: 'var(--blue-300)', border: '2px solid var(--bg-base)', left: `${toBar(last)}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)' }}>
        <span>52W Low: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatCurrency(low52w)}</span></span>
        <span>52W High: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatCurrency(high52w)}</span></span>
      </div>

      {/* Support / Resistance labels */}
      {(support !== null || resistance !== null) && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {support !== null && (
            <div style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'var(--gain-tint)', border: '1px solid rgba(15,186,130,0.2)' }}>
              <p style={{ fontSize: 10, color: 'var(--gain-400)', margin: 0, fontWeight: 600 }}>▲ Support</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--gain-400)', margin: '2px 0 0 0' }}>{formatCurrency(support)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '1px 0 0 0' }}>{(((last - support) / support) * 100).toFixed(1)}% di bawah</p>
            </div>
          )}
          {resistance !== null && (
            <div style={{ flex: 1, padding: '6px 10px', borderRadius: 8, background: 'var(--loss-tint)', border: '1px solid rgba(240,71,106,0.2)' }}>
              <p style={{ fontSize: 10, color: 'var(--loss-400)', margin: 0, fontWeight: 600 }}>▼ Resistance</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--loss-400)', margin: '2px 0 0 0' }}>{formatCurrency(resistance)}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '1px 0 0 0' }}>{(((resistance - last) / last) * 100).toFixed(1)}% di atas</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ForecastHistogram({ result }: { result: ForecastResult }) {
  const maxCount = Math.max(...result.histogram.map((b) => b.count), 1);
  // find bucket closest to median
  const medianIdx = result.histogram.reduce((best, b, i) =>
    Math.abs(b.price - result.median) < Math.abs(result.histogram[best].price - result.median) ? i : best, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 72 }}>
        {result.histogram.map((b, i) => {
          const h = Math.max(3, (b.count / maxCount) * 100);
          const isMedian = i === medianIdx;
          return (
            <div
              key={i}
              title={`~${formatCurrency(b.price)} · ${b.count} skenario`}
              style={{
                flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0',
                background: isMedian ? 'var(--ai-accent)' : b.inRange ? 'var(--blue-400)' : 'var(--border-default)',
                opacity: b.inRange || isMedian ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
      {/* Price axis — show 5 labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {[result.p10, result.p25, result.median, result.p75, result.p90].map((v, i) => (
          <div key={i} style={{ textAlign: 'center', minWidth: 0 }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{['P10','P25','P50','P75','P90'][i]}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, color: i === 2 ? 'var(--ai-accent)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {formatCurrency(v)}
            </div>
          </div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, marginTop: 6, justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--ai-accent)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Median (P50)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--blue-400)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>P25–P75 (50% skenario)</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StockForecastCard({ asset }: Props) {
  const { data, isLoading, isError } = useStockForecast(asset.ticker);
  const { data: news = [] } = useStockNews(asset.ticker);

  const result = data?.result ?? null;
  const isMarketOpen = data?.marketState === 'REGULAR';

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
      {/* ── Header ── */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--ai-accent)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Analisis &amp; Estimasi</span>
          <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Monte Carlo {result?.simulations.toLocaleString('id-ID') ?? '2.000'} sim · {result?.sampleDays ?? '—'} hari data · RSI · Bollinger · Support/Resistance
          </p>
        </div>
        {result && (
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, flexShrink: 0, background: CONFIDENCE_META[result.confidence].tint, color: CONFIDENCE_META[result.confidence].color }}>
            {CONFIDENCE_META[result.confidence].label}
          </span>
        )}
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {isLoading ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Menghitung analisis…</p>
        ) : isError ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Gagal memuat data.</p>
        ) : !result ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Data historis belum cukup (minimal 20 hari perdagangan).</p>
        ) : (
          <>
            {/* ── 1. Estimasi harga ── */}
            <div>
              <SectionTitle>Estimasi Penutupan Berikutnya</SectionTitle>

              {isMarketOpen && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', marginBottom: 12, borderRadius: 9, background: 'var(--blue-tint)', border: '1px solid rgba(77,124,255,0.2)' }}>
                  <Info size={12} strokeWidth={2} style={{ color: 'var(--blue-300)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--blue-300)' }}>Pasar sedang buka — estimasi untuk penutupan berikutnya</span>
                </div>
              )}

              {/* Median price */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {formatCurrency(result.median)}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                  P50 · ≈ {fmtPct(((result.median - result.lastPrice) / result.lastPrice) * 100)} dari harga terakhir
                </span>
              </div>

              {/* Prob row */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'var(--gain-tint)', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--gain-400)', margin: 0 }}>{(result.probUp * 100).toFixed(0)}%</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>Peluang naik</p>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'var(--loss-tint)', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--loss-400)', margin: 0 }}>{((1 - result.probUp) * 100).toFixed(0)}%</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>Peluang turun</p>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', textAlign: 'center' }}>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>±{result.technical.expectedDailyRangePct.toFixed(1)}%</p>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>Gerak harian rata-rata</p>
                </div>
              </div>

              {/* Histogram */}
              <ForecastHistogram result={result} />

              {/* Rentang tabel */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginTop: 12 }}>
                {[
                  { label: 'P10 — Bear case', value: result.p10, color: 'var(--loss-400)' },
                  { label: 'P50 — Base case', value: result.median, color: 'var(--ai-accent)' },
                  { label: 'P90 — Bull case', value: result.p90, color: 'var(--gain-400)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ padding: '8px 10px', borderRadius: 9, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0 }}>{label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color, margin: '3px 0 0 0' }}>{formatCurrency(value)}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: '1px 0 0 0' }}>{fmtPct(((value - result.lastPrice) / result.lastPrice) * 100)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 2. Sinyal teknikal ── */}
            <div>
              <SectionTitle>Sinyal Teknikal</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* RSI gauge */}
                {result.technical.rsi14 !== null && <RsiGauge rsi={result.technical.rsi14} />}
                {/* Bollinger */}
                {result.technical.bollingerPct !== null && <BollingerBar pctB={result.technical.bollingerPct} />}

                {/* Momentum + trend composite */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 9, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0 }}>Momentum 5H</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: pctColor(result.technical.momentum5d), margin: '3px 0 0 0' }}>
                      {fmtPct(result.technical.momentum5d)}
                    </p>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 9, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0 }}>Momentum 20H</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: pctColor(result.technical.momentum20d), margin: '3px 0 0 0' }}>
                      {fmtPct(result.technical.momentum20d)}
                    </p>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 9, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
                    <p style={{ fontSize: 9, color: 'var(--text-muted)', margin: 0 }}>Tren composite</p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: TREND_META[result.technical.trendSignal].color, margin: '3px 0 0 0' }}>
                      {TREND_META[result.technical.trendSignal].icon}
                      {TREND_META[result.technical.trendSignal].label}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── 3. Zona Harga ── */}
            <div>
              <SectionTitle>Zona Harga</SectionTitle>
              <PriceZoneBar result={result} />
            </div>

            {/* ── 4. Statistik historis ── */}
            <div>
              <SectionTitle>Statistik Historis ({result.sampleDays} hari)</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <StatRow label="Volatilitas harian" value={`${result.dailyVolatilityPct.toFixed(2)}%`} />
                <StatRow label="Volatilitas tahunan" value={`${result.technical.annualizedVolPct.toFixed(1)}%`} />
                <StatRow label="Tren 6 bulan (drift)" value={fmtPct(result.dailyDriftPct, 3) + '/hari'} color={pctColor(result.dailyDriftPct)} />
                <StatRow label="Hari terbaik" value={fmtPct(result.technical.bestDayPct)} color="var(--gain-400)" />
                <StatRow label="Hari terburuk" value={fmtPct(result.technical.worstDayPct)} color="var(--loss-400)" />
              </div>
            </div>
          </>
        )}

        {/* ── 5. Berita ── */}
        {news.length > 0 && (
          <div style={{ paddingTop: 4 }}>
            <SectionTitle>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Newspaper size={11} strokeWidth={2} />Berita Terkait
              </span>
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {news.map((n, i) => (
                <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 9, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)', textDecoration: 'none' }}>
                  <ExternalLink size={11} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }} />
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

        {/* ── Disclaimer ── */}
        <div style={{ display: 'flex', gap: 7, padding: '9px 11px', borderRadius: 9, background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
          <Info size={12} strokeWidth={2} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Estimasi statistik dari data harga historis — <strong>bukan saran investasi</strong>. Sinyal teknikal bersifat lagging dan tidak menjamin arah harga ke depan.
          </p>
        </div>
      </div>
    </div>
  );
}
