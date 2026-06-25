import { Target, Info } from 'lucide-react';
import type { Asset } from '@/modules/portfolio/domain/entities/Asset';
import { formatCurrency } from '@/shared/utils/formatCurrency';
import { Spinner } from '@/shared/ui/Spinner';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { usePriceTargets } from '../hooks/useForecast';
import type { PriceTarget } from '../../domain/entities/Forecast';

interface Props { asset: Asset }

const HORIZONS: { key: '1d' | '7d' | '30d' | '1y'; label: string }[] = [
  { key: '1d',  label: '1 Hari' },
  { key: '7d',  label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: '1y',  label: '1 Tahun' },
];

const SCENARIOS: { key: 'bull' | 'base' | 'bear'; label: string; pctKey: 'bullPct' | 'basePct' | 'bearPct'; color: string; tint: string; badge: string }[] = [
  { key: 'bull', label: 'Bull',  pctKey: 'bullPct', color: 'var(--gain-400)', tint: 'var(--gain-tint)', badge: '▲' },
  { key: 'base', label: 'Base',  pctKey: 'basePct', color: 'var(--blue-400)', tint: 'var(--blue-tint)', badge: '◆' },
  { key: 'bear', label: 'Bear',  pctKey: 'bearPct', color: 'var(--loss-400)', tint: 'var(--loss-tint)', badge: '▼' },
];

function fmtPct(v: number) {
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function PctBadge({ value, color }: { value: number; color: string }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: 10,
      fontWeight: 700,
      color,
      background: value > 0.05 ? 'var(--gain-tint)' : value < -0.05 ? 'var(--loss-tint)' : 'var(--bg-hover)',
      borderRadius: 4,
      padding: '1px 5px',
    }}>
      {fmtPct(value)}
    </span>
  );
}

function HorizonCell({ target, scenario }: { target: PriceTarget; scenario: typeof SCENARIOS[number] }) {
  const price = target[scenario.key];
  const pct   = target[scenario.pctKey];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 700,
        color: scenario.color,
      }}>
        {formatCurrency(price)}
      </span>
      <PctBadge value={pct} color={pct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)'} />
    </div>
  );
}

const TOOLTIP_TEXT =
  'Model log-normal dari volatilitas historis harga saham. ' +
  'Bull = P75, Base = median (P50), Bear = P25. ' +
  'Bukan rekomendasi investasi.';

export function PriceTargetCard({ asset }: Props) {
  const { data, isLoading, isError } = usePriceTargets(asset.ticker);

  const isStock = asset.category === 'saham';
  if (!isStock || !asset.ticker) return null;

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'rgba(77,124,255,0.12)',
            border: '1px solid rgba(77,124,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Target size={14} color="var(--blue-400)" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Estimasi Target Harga
            </p>
            {data && (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                Model log-normal • {data.sampleDays} sesi • Volatilitas {data.annualizedVolPct.toFixed(0)}%/tahun
              </p>
            )}
          </div>
        </div>
        <InfoTooltip content={TOOLTIP_TEXT} />
      </div>

      {/* Body */}
      {isLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <Spinner size="sm" />
        </div>
      )}

      {isError && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Data tidak tersedia untuk saham ini.
          </p>
        </div>
      )}

      {data && (
        <div style={{ padding: '0 0 4px' }}>
          {/* Current price row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 16px 10px',
            background: 'var(--bg-raised)',
            borderBottom: '1px solid var(--border-dim)',
          }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Harga saat ini
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>
              {formatCurrency(data.lastPrice)}
            </span>
          </div>

          {/* Grid header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '72px repeat(4, 1fr)',
            padding: '8px 16px 6px',
            borderBottom: '1px solid var(--border-dim)',
          }}>
            <div />
            {HORIZONS.map((h) => (
              <div key={h.key} style={{ textAlign: 'center' }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {h.label}
                </span>
              </div>
            ))}
          </div>

          {/* Scenario rows */}
          {SCENARIOS.map((scenario, si) => (
            <div
              key={scenario.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px repeat(4, 1fr)',
                padding: '10px 16px',
                borderBottom: si < SCENARIOS.length - 1 ? '1px solid var(--border-dim)' : 'none',
                background: si % 2 === 1 ? 'var(--bg-raised)' : 'transparent',
              }}
            >
              {/* Scenario label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  fontSize: 11,
                  color: scenario.color,
                  fontWeight: 700,
                }}>
                  {scenario.badge}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: scenario.color,
                }}>
                  {scenario.label}
                </span>
              </div>

              {/* Cells per horizon */}
              {HORIZONS.map((h) => (
                <HorizonCell key={h.key} target={data.targets[h.key]} scenario={scenario} />
              ))}
            </div>
          ))}

          {/* Disclaimer */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 6,
            margin: '4px 16px 12px',
            padding: '8px 10px',
            background: 'var(--bg-raised)',
            borderRadius: 8,
            border: '1px solid var(--border-dim)',
          }}>
            <Info size={11} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Estimasi statistik berbasis volatilitas historis — bukan prediksi atau rekomendasi investasi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
