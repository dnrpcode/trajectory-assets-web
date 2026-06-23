import { useState } from 'react';
import { Plus, Briefcase } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Spinner } from '@/shared/ui/Spinner';
import { AssetCard } from '../components/AssetCard';
import { EntryForm } from '../components/EntryForm';
import { useActiveAssets, useAllAssets } from '../hooks/useAssets';
import { AssetCategory } from '@/shared/types';
import { CATEGORY_LABELS, ALL_CATEGORIES } from '@/shared/constants/categories';

export function PortfolioPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const staleFilter = searchParams.get('filter') === 'stale';
  const { data: assets = [], isLoading, isError } = useActiveAssets();
  const { data: allAssets = [] } = useAllAssets();
  const hasClosedAssets = assets.length === 0 && allAssets.some((a) => a.status === 'closed');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>('all');

  const filtered = assets.filter((a) => {
    if (staleFilter && !a.isStale) return false;
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    return true;
  });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
            {t('portfolio.title')}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {assets.length} {t('portfolio.noAssets')}
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          size="md"
          icon={
            <Plus size={14} strokeWidth={2.5} />
          }
        >
          {t('portfolio.addPosition')}
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {(['all', ...ALL_CATEGORIES] as const).map((cat) => {
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={{
                background: active ? 'var(--blue-400)' : 'var(--bg-raised)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: active ? '1px solid transparent' : '1px solid var(--border-default)',
                letterSpacing: 'var(--tracking-caps)',
                textTransform: 'uppercase',
              }}
            >
              {cat === 'all' ? t('common.filter') : CATEGORY_LABELS[cat]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Gagal memuat portofolio</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Periksa koneksi internet dan muat ulang halaman.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}
          >
            <Briefcase size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            {hasClosedAssets ? t('portfolio.allClosed') : t('portfolio.noAssets')}
          </p>
          <p className="text-xs mb-6" style={{ color: 'var(--text-secondary)' }}>
            {hasClosedAssets
              ? t('portfolio.allClosedDesc')
              : assets.length === 0
                ? t('dashboard.noAssets')
                : t('common.filter')}
          </p>
          {!hasClosedAssets && assets.length === 0 && (
            <Button onClick={() => setAddModalOpen(true)} size="md">
              {t('portfolio.addPosition')}
            </Button>
          )}
          {hasClosedAssets && (
            <Button onClick={() => setAddModalOpen(true)} size="md">
              {t('portfolio.addPosition')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title={t('entry.new_position')} size="lg">
        <EntryForm onSuccess={() => setAddModalOpen(false)} defaultEntryType="new_position" />
      </Modal>
    </Layout>
  );
}
