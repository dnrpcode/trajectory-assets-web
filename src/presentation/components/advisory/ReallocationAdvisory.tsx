import { ArrowUpRight, ArrowDownRight, CheckCircle } from 'lucide-react';
import { CategoryBreakdown, RebalancingAdvice } from '../../../shared/types';

interface Props {
  score: number;
  breakdown: CategoryBreakdown[];
  advices: RebalancingAdvice[];
  totalValue: number;
  riskProfileName: string;
}

function ScoreColor(score: number): { color: string; bg: string } {
  if (score >= 85) return { color: 'var(--gain-500)', bg: 'var(--gain-tint)' };
  if (score >= 60) return { color: 'var(--warn-400)', bg: 'var(--warn-tint)' };
  return { color: 'var(--loss-500)', bg: 'var(--loss-tint)' };
}

export function ReallocationAdvisory({ score, breakdown, advices, totalValue, riskProfileName }: Props) {
  const { color: scoreColor, bg: scoreBg } = ScoreColor(score);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          className="lg:col-span-2 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '24px' }}
        >
          <h3
            className="text-sm font-semibold mb-5"
            style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}
          >
            Perbandingan Distribusi Aset
          </h3>
          <div className="space-y-4">
            {breakdown.map((cat) => (
              <div key={cat.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{cat.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                      {cat.actualPercentage.toFixed(1)}%
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      target {cat.targetPercentage}%
                    </span>
                    {Math.abs(cat.gap) > 0.5 && (
                      <span
                        className="text-xs font-mono rounded-full px-1.5 py-0.5"
                        style={{
                          color: cat.gap > 0 ? 'var(--warn-400)' : 'var(--blue-400)',
                          background: cat.gap > 0 ? 'var(--warn-tint)' : 'var(--blue-tint)',
                        }}
                      >
                        {cat.gap > 0 ? '+' : ''}{cat.gap.toFixed(1)}%
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="relative h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-raised)' }}
                >
                  <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, cat.actualPercentage)}%`, background: cat.color }}
                  />
                  {cat.targetPercentage > 0 && (
                    <div
                      className="absolute top-0 h-full w-0.5"
                      style={{
                        left: `${Math.min(100, cat.targetPercentage)}%`,
                        background: 'var(--text-muted)',
                        opacity: 0.6,
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl flex flex-col items-center justify-center"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '24px' }}
        >
          <p className="text-xs font-semibold uppercase mb-4" style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}>
            Skor Rebalancing
          </p>
          <div
            className="w-28 h-28 rounded-full flex flex-col items-center justify-center mb-4"
            style={{ background: scoreBg, border: `3px solid ${scoreColor}` }}
          >
            <span className="text-4xl font-bold" style={{ color: scoreColor, fontFamily: 'var(--font-mono)' }}>
              {score}
            </span>
            <span className="text-xs" style={{ color: scoreColor }}>/ 100</span>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Profil: <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{riskProfileName}</span>
          </p>
          <p className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>
            Total Portofolio: <span style={{ color: 'var(--text-secondary)' }}>
              Rp {totalValue.toLocaleString('id-ID')}
            </span>
          </p>
        </div>
      </div>

      {advices.length > 0 && (
        <div
          className="rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '24px' }}
        >
          <h3
            className="text-sm font-semibold mb-4"
            style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}
          >
            Rekomendasi Rebalancing
          </h3>
          <div className="space-y-3">
            {advices.map((advice, i) => {
              const isIncrease = advice.type === 'increase';
              const cardColor = isIncrease ? 'var(--blue-400)' : 'var(--loss-400)';
              const cardBg = isIncrease ? 'var(--blue-tint)' : 'var(--loss-tint)';
              const cardBorder = isIncrease ? 'rgba(77,124,255,0.22)' : 'rgba(240,71,106,0.22)';
              return (
                <div
                  key={i}
                  className="rounded-xl flex gap-4"
                  style={{ background: cardBg, border: `1px solid ${cardBorder}`, padding: '16px' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: isIncrease ? 'rgba(77,124,255,0.15)' : 'rgba(240,71,106,0.15)' }}
                  >
                    {isIncrease ? (
                      <ArrowUpRight size={16} strokeWidth={2} style={{ color: cardColor }} />
                    ) : (
                      <ArrowDownRight size={16} strokeWidth={2} style={{ color: cardColor }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold mb-1" style={{ color: cardColor }}>{advice.title}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                      {advice.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {advices.length === 0 && (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-10"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'var(--gain-tint)', border: '1px solid rgba(15,186,130,0.22)' }}
          >
            <CheckCircle size={40} strokeWidth={1.5} style={{ color: 'var(--gain-500)' }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Portofolio Anda Sudah Seimbang</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Tidak ada rekomendasi rebalancing saat ini.</p>
        </div>
      )}
    </div>
  );
}
