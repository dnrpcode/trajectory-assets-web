import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Asset } from '@/domain/entities/Asset';
import { Card } from '@/presentation/components/ui/Card';
import { Badge } from '@/presentation/components/ui/Badge';
import { Button } from '@/presentation/components/ui/Button';
import { Modal } from '@/presentation/components/ui/Modal';
import { EntryForm } from '@/presentation/components/forms/EntryForm';
import { useDeleteAsset } from '@/presentation/hooks/useAssets';
import { formatCurrency, formatPercent } from '@/shared/utils/formatCurrency';
import { computeIsStale } from '@/shared/utils/calculations';

type FormEntryType = 'new_position' | 'price_update' | 'top_up' | 'partial_sell' | 'full_sell' | 'income' | 'fee';

interface Props {
  asset: Asset;
}

export function AssetCard({ asset }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [entryType, setEntryType] = useState<FormEntryType>('price_update');
  const { mutateAsync: deleteAssetMutation, isPending: isDeleting } = useDeleteAsset();

  const openModal = (type: FormEntryType) => {
    setEntryType(type);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteAssetMutation(asset.id);
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const isStale = computeIsStale(asset);
  const isPositive = asset.unrealizedGainIDR >= 0;

  const getModalTitle = () => {
    if (entryType === 'price_update') return t('portfolio.updatePrice');
    if (entryType === 'top_up') return t('portfolio.topUp');
    return t('portfolio.sell');
  };

  return (
    <>
      <Card
        variant="default"
        padding="none"
        hoverable
        className="overflow-hidden"
        style={isStale ? { borderColor: 'rgba(245,158,11,0.45)', boxShadow: '0 0 0 1px rgba(245,158,11,0.15)' } : undefined}
        onClick={() => navigate(`/portfolio/${asset.id}`)}
      >
        {isStale && (
          <div
            style={{
              background: 'rgba(245,158,11,0.08)',
              borderBottom: '1px solid rgba(245,158,11,0.2)',
              padding: '5px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <AlertTriangle size={12} strokeWidth={2} style={{ color: 'var(--warn-400)', flexShrink: 0 }} />
            <span style={{ color: 'var(--warn-400)', fontSize: '11px', fontWeight: 500 }}>
              {t('portfolio.staleWarning')}
            </span>
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">{asset.assetName}</h3>
                {asset.ticker && (
                  <span className="text-xs font-mono text-[var(--text-secondary)]">{asset.ticker}</span>
                )}
                {isStale && (
                  <Badge variant="stale" dot>STALE</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="accent">{asset.category}</Badge>
                <Badge variant="neutral">{asset.platform}</Badge>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-3">
              <p className="font-bold text-[var(--text-primary)] font-mono text-sm" style={{ letterSpacing: 'var(--tracking-tight)' }}>
                {formatCurrency(asset.currentValueIDR)}
              </p>
              <p className={`text-sm font-semibold font-mono mt-0.5`} style={{ color: isPositive ? 'var(--gain-400)' : 'var(--loss-400)' }}>
                {formatPercent(asset.unrealizedGainPct)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
            {[
              { label: t('portfolio.avgCost'), value: formatCurrency(asset.avgCostPerUnit) },
              { label: t('portfolio.currentPrice'), value: formatCurrency(asset.currentPricePerUnit) },
              { label: t('portfolio.units'), value: asset.totalUnits.toLocaleString('id-ID') },
              { label: t('portfolio.gainLoss'), value: formatCurrency(asset.unrealizedGainIDR), colored: true },
            ].map(({ label, value, colored }) => (
              <div key={label}>
                <span className="block" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span
                  className="font-medium font-mono"
                  style={{
                    color: colored
                      ? (isPositive ? 'var(--gain-400)' : 'var(--loss-400)')
                      : 'var(--text-primary)',
                    letterSpacing: 'var(--tracking-mono)',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="sm" onClick={() => openModal('price_update')} className="flex-1 text-xs">
              {t('portfolio.updatePrice')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => openModal('top_up')} className="flex-1 text-xs">
              {t('portfolio.topUp')}
            </Button>
            <Button variant="danger" size="sm" onClick={() => openModal('partial_sell')} className="flex-1 text-xs">
              {t('portfolio.sell')}
            </Button>
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-150"
              style={{
                background: 'var(--bg-raised)',
                color: 'var(--loss-400)',
                border: '1px solid var(--border-default)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(240,71,106,0.1)';
                e.currentTarget.style.borderColor = 'var(--loss-400)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-raised)';
                e.currentTarget.style.borderColor = 'var(--border-default)';
              }}
              title={t('portfolio.deleteAsset')}
            >
              <Trash2 size={12} strokeWidth={2} style={{ display: 'inline' }} />
            </button>
          </div>
        </div>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${asset.assetName} — ${getModalTitle()}`}
      >
        <EntryForm
          onSuccess={() => setModalOpen(false)}
          defaultEntryType={entryType}
          defaultAssetId={asset.id}
          defaultAssetName={asset.assetName}
          defaultCategory={asset.category}
          defaultPlatform={asset.platform}
          isExistingAsset={true}
        />
      </Modal>

      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={t('portfolio.deleteTitle')}
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {t('portfolio.deleteAssetQuestion')} <strong>{asset.assetName}</strong>?
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
              {t('portfolio.deleteAssetDescLong')}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteConfirmOpen(false)}
              size="md"
              style={{ flex: 1 }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDelete}
              loading={isDeleting}
              size="md"
              style={{ flex: 1 }}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
