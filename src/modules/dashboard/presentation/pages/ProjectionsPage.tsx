import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/ui/Layout';
import { CAGRProjectionChart } from '../components/CAGRProjectionChart';
import { usePortfolioSummary, usePortfolioHistory } from '../hooks/usePortfolio';
import { generateProjections, computeSmartCAGR, CAGRSource, RISK_FALLBACK } from '@/shared/utils/portfolioProjections';
import { formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { Card } from '@/shared/ui/Card';
import { useAuthStore } from '@/modules/auth';
import { RiskProfile } from '@/shared/types';
import { CATEGORY_LABELS } from '@/shared/constants/categories';

export function ProjectionsPage() {
  const { t } = useTranslation();
  const [monthlyContribution, setMonthlyContribution] = useState<number>(() =>
    parseInt(localStorage.getItem('proj_monthly') ?? '2500000'),
  );
  const [projectionYears, setProjectionYears] = useState<number>(() =>
    parseInt(localStorage.getItem('proj_years') ?? '10'),
  );

  const user = useAuthStore((s) => s.user);
  const { data: summary } = usePortfolioSummary();
  const { data: history = [] } = usePortfolioHistory();

  const currentValue = summary?.totalValueIDR ?? 0;
  const riskProfile: RiskProfile = user?.riskProfile ?? 'moderate';

  const { rate: cagrRate, source: cagrSource } = computeSmartCAGR(
    history,
    summary?.allocationActual,
    riskProfile,
  );

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
        <h1
          style={{
            color: 'var(--text-primary)',
            fontSize: '20px',
            fontWeight: 700,
            letterSpacing: 'var(--tracking-snug)',
          }}
        >
          {t('projections.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
          {t('projections.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Parameter panel */}
        <div
          className="lg:col-span-2 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '24px' }}
        >
          <h3
            className="text-sm font-semibold mb-5"
            style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}
          >
            {t('projections.parameters')}
          </h3>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}
                >
                  {t('projections.monthlyContribution')}
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
                <label
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}
                >
                  {t('projections.duration')}
                </label>
                <span className="text-sm font-bold font-mono" style={{ color: 'var(--blue-400)' }}>
                  {t('projections.durationYears', { count: projectionYears })}
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
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('projections.durationMin')}</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('projections.durationMax')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: result cards */}
        <div className="space-y-3">
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>
              {t('projections.currentValue')}
            </p>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
              {formatCurrencyCompact(currentValue)}
            </p>
          </div>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--gain-tint)', border: '1px solid rgba(15,186,130,0.22)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gain-500)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--gain-400)' }}>
                {t('projections.baseRate', { rate: cagrRate })}
              </p>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--gain-500)' }}>
              {formatCurrencyCompact(finalBase)}
            </p>
          </div>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--blue-tint)', border: '1px solid rgba(77,124,255,0.22)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ai-accent)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--blue-400)' }}>
                {t('projections.optimistic', { rate: optimisticRate })}
              </p>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--ai-accent)' }}>
              {formatCurrencyCompact(finalOpt)}
            </p>
          </div>
          <div
            className="rounded-xl px-4 py-3"
            style={{ background: 'var(--warn-tint)', border: '1px solid rgba(245,158,11,0.22)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--warn-400)' }} />
              <p className="text-xs font-semibold" style={{ color: 'var(--warn-400)' }}>
                {t('projections.pessimistic', { rate: pessimisticRate })}
              </p>
            </div>
            <p className="text-lg font-bold font-mono" style={{ color: 'var(--warn-400)' }}>
              {formatCurrencyCompact(finalPes)}
            </p>
          </div>
        </div>
      </div>

      {/* CAGR source transparency card */}
      <CAGRSourceCard source={cagrSource} cagrRate={cagrRate} optimisticRate={optimisticRate} pessimisticRate={pessimisticRate} />

      <Card variant="default" padding="none" className="mt-6">
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}
          >
            {t('projections.chartTitle', { years: projectionYears })}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {t('projections.chartSubtitle', { monthly: formatCurrencyCompact(monthlyContribution) })}
          </p>
        </div>
        <div className="px-2 py-6">
          <CAGRProjectionChart data={projections} />
        </div>
      </Card>
    </Layout>
  );
}

// --- Sub-component: CAGR source explanation ---

function CAGRSourceCard({ source, cagrRate, optimisticRate, pessimisticRate }: { source: CAGRSource; cagrRate: number; optimisticRate: string; pessimisticRate: string }) {
  const { t } = useTranslation();

  const labelStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 'var(--tracking-caps)',
    background: 'rgba(77,124,255,0.12)',
    color: 'var(--blue-400)',
    marginBottom: 12,
  };

  return (
    <div
      className="rounded-2xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '20px 24px' }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3
            className="text-sm font-semibold mb-1"
            style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}
          >
            {t('projections.cagrSource')}
          </h3>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {t('projections.cagrSourceDesc', { rate: cagrRate })}
          </p>
        </div>
        <div
          className="rounded-xl px-4 py-2 text-right flex-shrink-0"
          style={{ background: 'var(--gain-tint)', border: '1px solid rgba(15,186,130,0.2)' }}
        >
          <p className="text-xs font-semibold" style={{ color: 'var(--gain-400)' }}>{t('projections.baseCagr')}</p>
          <p className="text-2xl font-bold font-mono" style={{ color: 'var(--gain-500)' }}>
            {cagrRate}%
          </p>
        </div>
      </div>

      {source.type === 'historical_blend' && (
        <HistoricalBlendSource source={source} />
      )}
      {source.type === 'allocation' && (
        <AllocationSource source={source} labelStyle={labelStyle} />
      )}
      {source.type === 'risk_profile' && (
        <RiskProfileSource source={source} labelStyle={labelStyle} />
      )}

      <div
        className="mt-4 rounded-xl px-4 py-3 text-xs"
        style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', lineHeight: 1.6 }}
      >
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{t('projections.disclaimerNote')} </span>
        {t('projections.disclaimer', { optimistic: optimisticRate, pessimistic: pessimisticRate })}
      </div>
    </div>
  );
}

function HistoricalBlendSource({
  source,
}: {
  source: Extract<CAGRSource, { type: 'historical_blend' }>;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold mb-3"
        style={{
          background: 'rgba(15,186,130,0.12)',
          color: 'var(--gain-400)',
          letterSpacing: 'var(--tracking-caps)',
        }}
      >
        <span>●</span> {t('projections.historicalBlend')}
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Rate dihitung dari <strong style={{ color: 'var(--text-primary)' }}>gabungan</strong> antara
        kinerja portofolio historis Anda selama{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{source.months} bulan</strong> dan
        model return ekspektasi per kelas aset.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {t('projections.historicalPortfolio', { months: source.months })}
          </p>
          <p className="text-lg font-bold font-mono" style={{ color: 'var(--gain-400)' }}>
            {source.historicalRate}% <span className="text-xs font-normal">× 60%</span>
          </p>
        </div>
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
            {t('projections.allocationModel')}
          </p>
          <p className="text-lg font-bold font-mono" style={{ color: 'var(--blue-400)' }}>
            {source.allocationRate}% <span className="text-xs font-normal">× 40%</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function AllocationSource({
  source,
  labelStyle,
}: {
  source: Extract<CAGRSource, { type: 'allocation' }>;
  labelStyle: React.CSSProperties;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div style={labelStyle}>
        <span>◆</span> {t('projections.allocationBased')}
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Rate dihitung dari rata-rata tertimbang{' '}
        <strong style={{ color: 'var(--text-primary)' }}>return ekspektasi per kelas aset</strong>{' '}
        berdasarkan alokasi portofolio Anda saat ini.
      </p>
      <div className="space-y-2">
        {source.breakdown.map((row) => (
          <div key={row.category} className="flex items-center gap-3">
            <span
              className="text-xs font-semibold"
              style={{ color: 'var(--text-secondary)', minWidth: 90 }}
            >
              {CATEGORY_LABELS[row.category]}
            </span>
            <div className="flex-1 flex items-center gap-2">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${Math.min(100, row.weight)}%`,
                  maxWidth: '120px',
                  background: 'var(--blue-400)',
                  opacity: 0.5,
                }}
              />
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)', minWidth: 36 }}>
                {row.weight.toFixed(1)}%
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)', minWidth: 44 }}>
              × {row.expectedReturn}%
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: 'var(--gain-400)', minWidth: 36, textAlign: 'right' }}
            >
              +{row.contribution.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-3 pt-3 flex justify-between items-center text-xs font-semibold"
        style={{ borderTop: '1px solid var(--border-dim)', color: 'var(--text-primary)' }}
      >
        <span>{t('projections.totalCagrModel')}</span>
        <span className="font-bold font-mono" style={{ color: 'var(--gain-400)' }}>
          {source.breakdown.reduce((s, r) => s + r.contribution, 0).toFixed(2)}% {t('projections.perYear')}
        </span>
      </div>
    </div>
  );
}

function RiskProfileSource({
  source,
  labelStyle,
}: {
  source: Extract<CAGRSource, { type: 'risk_profile' }>;
  labelStyle: React.CSSProperties;
}) {
  const { t } = useTranslation();

  const profileLabel: Record<RiskProfile, string> = {
    conservative: t('projections.conservative'),
    moderate: t('projections.moderate'),
    aggressive: t('projections.aggressive'),
  };

  return (
    <div>
      <div style={labelStyle}>
        <span>○</span> {t('projections.riskProfileBased')}
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Belum ada data portofolio cukup untuk menghitung CAGR dari riwayat atau komposisi aset.
        Rate diambil dari benchmark profil risiko{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{profileLabel[source.profile]}</strong>.
      </p>
      <div className="flex gap-3">
        {(['conservative', 'moderate', 'aggressive'] as RiskProfile[]).map((p) => (
          <div
            key={p}
            className="flex-1 rounded-xl px-3 py-2 text-center"
            style={{
              background: p === source.profile ? 'rgba(77,124,255,0.1)' : 'var(--bg-raised)',
              border: `1px solid ${p === source.profile ? 'var(--blue-400)' : 'var(--border-dim)'}`,
            }}
          >
            <p
              className="text-xs mb-1"
              style={{ color: p === source.profile ? 'var(--blue-400)' : 'var(--text-muted)' }}
            >
              {profileLabel[p]}
            </p>
            <p
              className="text-sm font-bold font-mono"
              style={{ color: p === source.profile ? 'var(--gain-400)' : 'var(--text-secondary)' }}
            >
              {RISK_FALLBACK[p]}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
