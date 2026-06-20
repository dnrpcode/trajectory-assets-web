import { useState } from 'react';
import { Plus, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/ui/Layout';
import { StatCard } from '@/shared/ui/StatCard';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Spinner } from '@/shared/ui/Spinner';
import { AllocationPieChart } from '../components/AllocationPieChart';
import { WealthGrowthChart } from '../components/WealthGrowthChart';
import { PlatformAllocationChart } from '../components/PlatformAllocationChart';
import { PnLByCategoryChart } from '../components/PnLByCategoryChart';
import { StaleAssetBanner } from '@/modules/portfolio/presentation/components/StaleAssetBanner';
import { EntryForm } from '@/modules/portfolio/presentation/components/EntryForm';
import { usePortfolioSummary, usePortfolioHistory } from '../hooks/usePortfolio';
import { useActiveAssets } from '@/modules/portfolio/presentation/hooks/useAssets';
import { useAuthStore } from '@/modules/auth';
import { formatCurrencyCompact, formatPercent } from '@/shared/utils/formatCurrency';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { CATEGORY_LABELS } from '@/shared/constants/categories';
import { computeSmartCAGR, computeCategoryBreakdown, getRebalancingRecommendations } from '@/shared/utils/portfolioProjections';

export function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: summary, isLoading: summaryLoading } = usePortfolioSummary();
  const { data: history = [] } = usePortfolioHistory();
  const { data: assets = [] } = useActiveAssets();
  const [addModalOpen, setAddModalOpen] = useState(false);

  const monthOverMonth = history.length >= 2
    ? history[history.length - 1].totalValueIDR - history[history.length - 2].totalValueIDR
    : 0;
  const momPct = history.length >= 2 && history[history.length - 2].totalValueIDR > 0
    ? (monthOverMonth / history[history.length - 2].totalValueIDR) * 100
    : 0;

  const { rate: cagrRate } = computeSmartCAGR(
    history,
    summary?.allocationActual,
    user?.riskProfile ?? 'moderate',
  );

  const totalAssetValue = assets.filter((a) => a.status === 'active').reduce((s, a) => s + a.currentValueIDR, 0);
  const breakdown = user ? computeCategoryBreakdown(assets, user) : [];
  const { score } = breakdown.length > 0 ? getRebalancingRecommendations(breakdown, totalAssetValue) : { score: 0 };

  const scoreColor = score >= 85 ? 'var(--gain-500)' : score >= 60 ? 'var(--warn-400)' : 'var(--loss-500)';
  const scoreBg = score >= 85 ? 'var(--gain-tint)' : score >= 60 ? 'var(--warn-tint)' : 'var(--loss-tint)';

  const topAssets = [...assets]
    .filter((a) => a.status === 'active')
    .sort((a, b) => b.currentValueIDR - a.currentValueIDR)
    .slice(0, 5);

  return (
    <Layout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ letterSpacing: 'var(--tracking-snug)' }}>
            Halo, {user?.displayName?.split(' ')[0]}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.totalValue')}</p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} size="md" icon={
          <Plus size={14} strokeWidth={2.5} />
        }>
          {t('portfolio.addPosition')}
        </Button>
      </div>

      {summary && summary.staleAssetCount > 0 && (
        <div className="mb-6">
          <StaleAssetBanner count={summary.staleAssetCount} />
        </div>
      )}

      {summaryLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : !summary || summary.totalValueIDR === 0 ? (
        <EmptyState onAdd={() => setAddModalOpen(true)} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-tour="dashboard-stats">
            <StatCard
              label={t('dashboard.totalValue')}
              value={formatCurrencyCompact(summary.totalValueIDR)}
              change={parseFloat(momPct.toFixed(2))}
              changeLabel={`${momPct >= 0 ? '+' : ''}${momPct.toFixed(1)}% bulan ini`}
              mono={false}
              valueSize="var(--text-2xl)"
              className="col-span-2"
            />
            <StatCard
              label={<span className="flex items-center gap-1">{t('dashboard.unrealizedGain')} <InfoTooltip content={t('tooltip.unrealizedGain')} /></span>}
              value={formatCurrencyCompact(summary.unrealizedGainIDR)}
              change={parseFloat(summary.unrealizedGainPct.toFixed(2))}
              changeLabel={formatPercent(summary.unrealizedGainPct)}
              mono={false}
            />
            <StatCard
              label={<span className="flex items-center gap-1">{t('dashboard.cagrLabel')} <InfoTooltip content={t('tooltip.cagr')} /></span>}
              value={`${cagrRate.toFixed(1)}%`}
              changeLabel={t('dashboard.cagrSuffix')}
              mono={false}
              variant="accent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card variant="default" padding="none" className="lg:col-span-2">
              <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm" style={{ letterSpacing: 'var(--tracking-snug)' }}>
                  Pertumbuhan Portofolio
                </h3>
              </div>
              <div className="px-2 py-6">
                <WealthGrowthChart data={history} />
              </div>
            </Card>

            <div className="space-y-4">
              <Card variant="default" padding="none">
                <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
                  <h3 className="font-semibold text-[var(--text-primary)] text-sm" style={{ letterSpacing: 'var(--tracking-snug)' }}>
                    {t('dashboard.allocation')}
                  </h3>
                </div>
                <div className="p-4">
                  <AllocationPieChart
                    actual={summary.allocationActual}
                    target={user?.targetAllocation}
                  />
                </div>
              </Card>

              <div
                data-tour="rebalancing-score"
                className="rounded-[var(--card-radius)] p-5 flex flex-col items-center cursor-pointer transition-opacity hover:opacity-80"
                style={{ background: scoreBg, border: `1px solid ${scoreColor}33` }}
                onClick={() => navigate('/advisory')}
              >
                <p className="text-xs font-semibold uppercase mb-2 flex items-center gap-1" style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}>
                  {t('dashboard.rebalancingScore')} <InfoTooltip content={t('tooltip.rebalancingScore')} />
                </p>
                <div
                  className="w-16 h-16 rounded-full flex flex-col items-center justify-center mb-2"
                  style={{ border: `2px solid ${scoreColor}` }}
                >
                  <span className="text-2xl font-bold font-mono" style={{ color: scoreColor }}>{score}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('dashboard.openAdvisory')}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="default" padding="none">
              <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm" style={{ letterSpacing: 'var(--tracking-snug)' }}>
                  Alokasi per Platform
                </h3>
              </div>
              <div className="px-4 pt-4 pb-5">
                <PlatformAllocationChart assets={assets} />
              </div>
            </Card>

            <Card variant="default" padding="none">
              <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm" style={{ letterSpacing: 'var(--tracking-snug)' }}>
                  P&amp;L per Tipe Aset
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Unrealized + Realized + Income − Fee</p>
              </div>
              <div className="px-2 pt-4 pb-5">
                <PnLByCategoryChart assets={assets} />
              </div>
            </Card>
          </div>

          {topAssets.length > 0 && (
            <Card variant="default" padding="none">
              <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm" style={{ letterSpacing: 'var(--tracking-snug)' }}>
                  {t('dashboard.holdings')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      {['Aset', 'Kategori', 'Nilai', 'Gain/Loss'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-semibold uppercase"
                          style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topAssets.map((asset) => (
                      <tr
                        key={asset.id}
                        className="cursor-pointer transition-colors hover:bg-[var(--bg-raised)]"
                        onClick={() => navigate(`/portfolio/${asset.id}`)}
                        style={{ borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        <td className="px-6 py-3">
                          <div>
                            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{asset.assetName}</p>
                            {asset.ticker && (
                              <p className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{asset.ticker}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: 'var(--bg-raised)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                          >
                            {CATEGORY_LABELS[asset.category]}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {formatCurrencyCompact(asset.currentValueIDR)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className="text-xs font-mono font-semibold"
                            style={{ color: asset.unrealizedGainPct >= 0 ? 'var(--gain-400)' : 'var(--loss-400)' }}
                          >
                            {asset.unrealizedGainPct >= 0 ? '+' : ''}{asset.unrealizedGainPct.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={t('entry.new_position')}
        size="lg"
      >
        <EntryForm
          onSuccess={() => setAddModalOpen(false)}
          defaultEntryType="new_position"
        />
      </Modal>
    </Layout>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: 'var(--blue-tint)', border: '1px solid rgba(77,124,255,0.22)' }}
      >
        <Activity size={28} strokeWidth={1.75} style={{ color: 'var(--blue-400)' }} />
      </div>
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2" style={{ letterSpacing: 'var(--tracking-snug)' }}>
        {t('dashboard.noAssets')}
      </h2>
      <p className="text-sm mb-8 max-w-sm" style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
        {t('dashboard.noAssets')}
      </p>
      <Button onClick={onAdd} size="lg">
        {t('portfolio.addPosition')}
      </Button>
    </div>
  );
}
