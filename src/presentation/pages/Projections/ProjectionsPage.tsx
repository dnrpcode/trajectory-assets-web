import { useState } from 'react';
import { Layout } from '@/presentation/components/ui/Layout';
import { CAGRProjectionChart } from '@/presentation/components/charts/CAGRProjectionChart';
import { usePortfolioSummary, usePortfolioHistory } from '@/presentation/hooks/usePortfolio';
import { generateProjections, calculateCAGR } from '@/shared/utils/portfolioProjections';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { Card } from '@/presentation/components/ui/Card';

export function ProjectionsPage() {
  const [monthlyContribution, setMonthlyContribution] = useState<number>(() => {
    return parseInt(localStorage.getItem('proj_monthly') ?? '2500000');
  });
  const [projectionYears, setProjectionYears] = useState<number>(() => {
    return parseInt(localStorage.getItem('proj_years') ?? '10');
  });

  const { data: summary } = usePortfolioSummary();
  const { data: history = [] } = usePortfolioHistory();

  const currentValue = summary?.totalValueIDR ?? 0;

  let cagrRate = 8.5;
  if (history.length >= 2) {
    const start = history[0].totalValueIDR;
    const end = history[history.length - 1].totalValueIDR;
    const months = history.length - 1;
    const calc = calculateCAGR(start, end, months);
    if (calc > 0 && calc < 150) cagrRate = Math.round(calc * 100) / 100;
  }

  const projections = generateProjections(currentValue, monthlyContribution, cagrRate, projectionYears);
  const finalBase = projections[projections.length - 1]?.base ?? 0;
  const finalOpt = projections[projections.length - 1]?.optimistic ?? 0;
  const finalPes = projections[projections.length - 1]?.pessimistic ?? 0;

  const updateMonthly = (v: number) => {
    setMonthlyContribution(v);
    localStorage.setItem('proj_monthly', String(v));
  };
  const updateYears = (v: number) => {
    setProjectionYears(v);
    localStorage.setItem('proj_years', String(v));
  };

  const optimisticRate = Math.min(40, cagrRate * 1.5).toFixed(1);
  const pessimisticRate = Math.max(2, cagrRate * 0.5).toFixed(1);

  return (
    <Layout>
      <div className="mb-6">
        <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, letterSpacing: 'var(--tracking-snug)' }}>
          Simulasi CAGR
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
          Proyeksi akumulasi kekayaan berdasarkan data portofolio dan kontribusi bulanan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div
          className="lg:col-span-2 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '24px' }}
        >
          <h3 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
            Parameter Simulasi
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}>
                  Kontribusi Bulanan
                </label>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--blue-400)' }}>
                  {formatCurrencyCompact(monthlyContribution)}
                </span>
              </div>
              <input
                type="range"
                min={500000}
                max={25000000}
                step={500000}
                value={monthlyContribution}
                onChange={(e) => updateMonthly(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--blue-400)', background: 'var(--bg-raised)' }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rp 500rb</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rp 25jt</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase" style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}>
                  Jangka Waktu
                </label>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--blue-400)' }}>
                  {projectionYears} tahun
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={20}
                step={1}
                value={projectionYears}
                onChange={(e) => updateYears(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--blue-400)', background: 'var(--bg-raised)' }}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>2 tahun</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>20 tahun</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>Nilai Saat Ini</p>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{formatCurrencyCompact(currentValue)}</p>
          </div>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--gain-tint)', border: '1px solid rgba(15,186,130,0.22)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gain-500)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--gain-400)' }}>Base Rate ({cagrRate}%)</p>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--gain-500)' }}>{formatCurrencyCompact(finalBase)}</p>
          </div>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--blue-tint)', border: '1px solid rgba(77,124,255,0.22)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ai-accent)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--blue-400)' }}>Optimis ({optimisticRate}%)</p>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--ai-accent)' }}>{formatCurrencyCompact(finalOpt)}</p>
          </div>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--warn-tint)', border: '1px solid rgba(245,158,11,0.22)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--warn-400)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--warn-400)' }}>Pesimis ({pessimisticRate}%)</p>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--warn-400)' }}>{formatCurrencyCompact(finalPes)}</p>
          </div>
        </div>
      </div>

      <Card variant="default" padding="none">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
            Grafik Proyeksi {projectionYears} Tahun
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Berdasarkan nilai portofolio saat ini + kontribusi {formatCurrencyCompact(monthlyContribution)}/bulan
          </p>
        </div>
        <div className="px-2 py-6">
          <CAGRProjectionChart data={projections} />
        </div>
      </Card>
    </Layout>
  );
}
