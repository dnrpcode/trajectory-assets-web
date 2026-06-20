import { useState } from 'react';
import { PlusCircle, Activity, ArrowUp, ArrowRight, XCircle, DollarSign, CreditCard, RotateCcw, Trash2, ArrowLeft, Sparkles, Menu } from 'lucide-react';
import { Navbar } from '@/shared/ui/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useActiveAssets, useDeleteAsset } from '../hooks/useAssets';
import { useAssetEntries, useDeleteEntry } from '../hooks/useEntries';
import { Modal } from '@/shared/ui/Modal';
import { EntryForm } from '../components/EntryForm';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { formatCurrency, formatPercent, formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { CATEGORY_LABELS } from '@/shared/constants/categories';
import { AssetEntry } from '@/modules/portfolio/domain/entities/AssetEntry';
import { computeIsStale } from '@/shared/utils/calculations';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';

// ── Price chart helpers ──────────────────────────────────────────────────────

function buildPriceHistory(entries: AssetEntry[]) {
  const priceEntryTypes = new Set([
    'new_position',
    'price_update',
    'top_up',
    'partial_sell',
    'full_sell',
  ]);
  return entries
    .filter((e) => !e.isCorrected && priceEntryTypes.has(e.entryType) && e.pricePerUnit != null)
    .map((e) => ({
      date: e.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' }),
      price: e.pricePerUnit!,
    }));
}

// ── Constants ────────────────────────────────────────────────────────────────

type EntryColor = { bg: string; border: string; text: string; dot: string };
const ENTRY_STYLES: Record<string, EntryColor> = {
  new_position: { bg: 'rgba(77,124,255,0.06)', border: 'rgba(77,124,255,0.2)', text: 'var(--blue-300)', dot: 'var(--blue-400)' },
  price_update: { bg: 'rgba(71,85,105,0.1)', border: 'var(--border-subtle)', text: 'var(--text-secondary)', dot: 'var(--text-muted)' },
  top_up: { bg: 'rgba(15,186,130,0.06)', border: 'rgba(15,186,130,0.18)', text: 'var(--gain-400)', dot: 'var(--gain-400)' },
  partial_sell: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', text: 'var(--warn-400)', dot: 'var(--warn-400)' },
  full_sell: { bg: 'rgba(240,71,106,0.06)', border: 'rgba(240,71,106,0.2)', text: 'var(--loss-400)', dot: 'var(--loss-400)' },
  income: { bg: 'rgba(15,186,130,0.06)', border: 'rgba(15,186,130,0.18)', text: 'var(--gain-400)', dot: 'var(--gain-400)' },
  fee: { bg: 'rgba(240,71,106,0.06)', border: 'rgba(240,71,106,0.18)', text: 'var(--loss-400)', dot: 'var(--loss-400)' },
  correction: { bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.2)', text: 'var(--ai-accent)', dot: 'var(--ai-accent)' },
};
const DEFAULT_STYLE: EntryColor = { bg: 'var(--bg-raised)', border: 'var(--border-subtle)', text: 'var(--text-secondary)', dot: 'var(--text-muted)' };

// ── AI Mock ──────────────────────────────────────────────────────────────────

function buildMockRecommendation(
  assetName: string, unrealizedGainPct: number, isStale: boolean,
  totalIncomeIDR: number, realizedGainIDR: number,
) {
  const insights: string[] = [];
  if (isStale) insights.push(`Harga ${assetName} belum diperbarui bulan ini. Perbarui harga untuk melihat valuasi terkini dan menghindari distorsi pada alokasi portofolio.`);
  if (unrealizedGainPct > 20) insights.push(`${assetName} telah naik ${unrealizedGainPct.toFixed(1)}% dari harga rata-rata beli. Pertimbangkan untuk melakukan partial sell untuk mengurangi risiko konsentrasi.`);
  else if (unrealizedGainPct < -15) insights.push(`${assetName} saat ini rugi ${Math.abs(unrealizedGainPct).toFixed(1)}% dari harga rata-rata beli. Evaluasi apakah fundamental masih kuat sebelum averaging down atau cut loss.`);
  else insights.push(`Posisi ${assetName} berada di zona netral (${unrealizedGainPct >= 0 ? '+' : ''}${unrealizedGainPct.toFixed(1)}%). Pantau terus perkembangan fundamental untuk menentukan waktu yang tepat untuk top up atau ambil profit.`);
  if (totalIncomeIDR > 0) insights.push(`Aset ini telah menghasilkan pendapatan sebesar ${formatCurrency(totalIncomeIDR)}. Income yang konsisten adalah sinyal positif untuk investasi jangka panjang.`);
  if (realizedGainIDR > 0) insights.push(`Kamu telah merealisasikan keuntungan ${formatCurrency(realizedGainIDR)} dari aset ini.`);
  return insights;
}

// ── Custom chart tooltip ─────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 12px' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginBottom: 2 }}>{label}</p>
      <p style={{ color: 'var(--blue-300)', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600 }}>
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

// ── Entry icon ───────────────────────────────────────────────────────────────

function EntryIcon({ type, color }: { type: string; color: string }) {
  const props = { size: 15, strokeWidth: 2, color };
  if (type === 'new_position') return <PlusCircle {...props} />;
  if (type === 'price_update') return <Activity {...props} />;
  if (type === 'top_up') return <ArrowUp {...props} />;
  if (type === 'partial_sell') return <ArrowRight {...props} />;
  if (type === 'full_sell') return <XCircle {...props} />;
  if (type === 'income') return <DollarSign {...props} />;
  if (type === 'fee') return <CreditCard {...props} />;
  return <RotateCcw {...props} />;
}

// ── Detail field helpers ──────────────────────────────────────────────────────

function DetailField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ minWidth: 80 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block', marginBottom: 1 }}>{label}</span>
      <span style={{ color: 'var(--text-secondary)', fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontSize: '12px', fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

// ── Entry row ────────────────────────────────────────────────────────────────

function EntryRow({ entry, onDelete }: { entry: AssetEntry; onDelete: (e: AssetEntry) => void }) {
  const { t } = useTranslation();
  const style = ENTRY_STYLES[entry.entryType] ?? DEFAULT_STYLE;

  const INCOME_FEE_LABELS: Record<string, string> = {
    dividend: t('entry.dividend'),
    coupon: t('entry.coupon'),
    interest: t('entry.interest'),
    platform_fee: t('entry.platform_fee'),
    tax: t('entry.tax'),
    other: t('entry.other'),
  };

  // Build header value
  let headerVal: { label: string; value: string } | null = null;
  if (entry.entryType === 'price_update') {
    if (entry.pricePerUnit != null) {
      headerVal = { label: t('assetDetail.entryHeaderLatestPrice'), value: formatCurrency(entry.pricePerUnit) };
    }
  } else if (entry.pricePerUnit != null && entry.units != null) {
    const total = entry.pricePerUnit * entry.units;
    headerVal = { label: t('assetDetail.entryHeaderTotalValue'), value: formatCurrencyCompact(total) };
  } else if (entry.amount != null) {
    headerVal = { label: t('assetDetail.entryHeaderAmount'), value: formatCurrencyCompact(entry.amount) };
  } else if (entry.pricePerUnit != null) {
    headerVal = { label: t('assetDetail.entryHeaderPrice'), value: formatCurrency(entry.pricePerUnit) };
  }

  // Build detail fields per entry type
  const details: { label: string; value: string; mono?: boolean }[] = [];
  if (entry.pricePerUnit != null) {
    details.push({ label: t('assetDetail.entryFieldPricePerUnit'), value: formatCurrency(entry.pricePerUnit), mono: true });
  }
  if (entry.units != null) {
    details.push({ label: t('assetDetail.entryFieldUnit'), value: entry.units.toLocaleString('id-ID', { maximumFractionDigits: 6 }), mono: true });
  }
  if (entry.pricePerUnit != null && entry.units != null) {
    details.push({ label: t('assetDetail.entryFieldTotal'), value: formatCurrency(entry.pricePerUnit * entry.units), mono: true });
  }
  if (entry.amount != null) {
    details.push({ label: t('assetDetail.entryFieldNominal'), value: formatCurrency(entry.amount), mono: true });
  }
  if (entry.currency && entry.currency !== 'IDR') {
    details.push({ label: t('assetDetail.entryFieldCurrency'), value: entry.currency });
    if (entry.exchangeRateToIDR) {
      details.push({ label: t('assetDetail.entryFieldRate'), value: `Rp ${entry.exchangeRateToIDR.toLocaleString('id-ID')}/${entry.currency}`, mono: true });
    }
  }
  if (entry.platform) {
    details.push({ label: t('assetDetail.entryFieldPlatform'), value: entry.platform });
  }

  return (
    <div
      style={{
        borderRadius: '10px',
        background: entry.isCorrected ? 'transparent' : style.bg,
        border: `1px solid ${entry.isCorrected ? 'var(--border-dim)' : style.border}`,
        opacity: entry.isCorrected ? 0.45 : 1,
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px' }}>
        {/* Icon */}
        <div style={{
          width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
          background: entry.isCorrected ? 'var(--bg-raised)' : style.bg,
          border: `1px solid ${entry.isCorrected ? 'var(--border-dim)' : style.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
        }}>
          <EntryIcon type={entry.entryType} color={entry.isCorrected ? 'var(--text-muted)' : style.text} />
        </div>

        {/* Type + date */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ color: entry.isCorrected ? 'var(--text-muted)' : style.text, fontSize: '13px', fontWeight: 600 }}>
              {t(`entry.${entry.entryType}`)}
            </span>
            {entry.isCorrected && <Badge variant="neutral" size="sm">{t('entry.deletedLabel')}</Badge>}
            {entry.incomeFeeCategory && (
              <Badge variant="neutral" size="sm">{INCOME_FEE_LABELS[entry.incomeFeeCategory] ?? entry.incomeFeeCategory}</Badge>
            )}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {entry.date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Header value + delete */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexShrink: 0 }}>
          {headerVal && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '10px' }}>{headerVal.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 700, color: entry.isCorrected ? 'var(--text-muted)' : style.text }}>
                {headerVal.value}
              </span>
            </div>
          )}
          {!entry.isCorrected && (
            <button
              onClick={() => onDelete(entry)}
              title={t('assetDetail.deleteTransaction')}
              style={{
                background: 'transparent', border: '1px solid transparent', borderRadius: '6px',
                color: 'var(--text-muted)', padding: '5px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms', marginTop: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--loss-400)';
                e.currentTarget.style.background = 'rgba(240,71,106,0.08)';
                e.currentTarget.style.borderColor = 'rgba(240,71,106,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <Trash2 size={13} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* ── Detail fields ── */}
      {!entry.isCorrected && details.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '8px 20px',
          padding: '8px 12px 10px',
          borderTop: `1px solid ${style.border}`,
          background: 'rgba(0,0,0,0.14)',
        }}>
          {details.map((d) => (
            <DetailField key={d.label} label={d.label} value={d.value} mono={d.mono} />
          ))}
        </div>
      )}

      {/* ── Notes ── */}
      {!entry.isCorrected && entry.notes && (
        <div style={{
          padding: '6px 12px 10px',
          borderTop: `1px solid ${style.border}`,
          background: 'rgba(0,0,0,0.08)',
        }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block', marginBottom: 2 }}>{t('assetDetail.entryFieldNotes')}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic', lineHeight: 1.5 }}>
            {entry.notes}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteEntryModal({
  entry,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  entry: AssetEntry;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '14px',
          padding: '24px',
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(240,71,106,0.1)',
            border: '1px solid rgba(240,71,106,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Trash2 size={16} strokeWidth={2} style={{ color: 'var(--loss-400)' }} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, margin: 0 }}>
            {t('assetDetail.deleteEntryTitle')}
          </h3>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 8px 0' }}>
          {t('assetDetail.deleteEntryDesc')} <strong style={{ color: 'var(--text-primary)' }}>{t(`entry.${entry.entryType}`)}</strong>{' '}
          {t('assetDetail.deleteEntryOn')}{' '}
          {entry.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
          {t('assetDetail.deleteTransactionDesc')}
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="button" variant="secondary" size="md" onClick={onCancel} style={{ flex: 1 }}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="danger" size="md" onClick={onConfirm} loading={isDeleting} style={{ flex: 1 }}>
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type ActionEntryType = 'price_update' | 'top_up' | 'partial_sell' | 'full_sell';

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [entryToDelete, setEntryToDelete] = useState<AssetEntry | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const [actionModal, setActionModal] = useState<ActionEntryType | null>(null);
  const [deleteAssetConfirm, setDeleteAssetConfirm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: assets = [], isLoading: assetsLoading } = useActiveAssets();
  const { data: entries = [], isLoading: entriesLoading } = useAssetEntries(assetId ?? '');
  const { mutateAsync: deleteEntry, isPending: isDeletingEntry } = useDeleteEntry();
  const { mutateAsync: deleteAssetMutation, isPending: isDeletingAsset } = useDeleteAsset();

  const asset = assets.find((a) => a.id === assetId);
  const isLoading = assetsLoading || entriesLoading;

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{t('common.loading')}</div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('assetDetail.notFound')}</p>
        <button onClick={() => navigate('/portfolio')} style={{ color: 'var(--blue-400)', fontSize: '14px' }}>{t('assetDetail.backToPortfolioLink')}</button>
      </div>
    );
  }

  const isStale = computeIsStale(asset);
  const isPositive = asset.unrealizedGainIDR >= 0;
  const priceHistory = buildPriceHistory(entries);
  const activeEntries = entries.filter((e) => !e.isCorrected);
  const correctedEntries = entries.filter((e) => e.isCorrected);
  const sortedEntries = [...(showCorrected ? entries : activeEntries)].sort((a, b) => b.date.getTime() - a.date.getTime());
  const aiInsights = buildMockRecommendation(asset.assetName, asset.unrealizedGainPct, isStale, asset.totalIncomeIDR, asset.realizedGainIDR);

  const handleDeleteEntryConfirm = async () => {
    if (!entryToDelete) return;
    await deleteEntry(entryToDelete);
    setEntryToDelete(null);
  };

  const handleDeleteAsset = async () => {
    if (!asset) return;
    await deleteAssetMutation(asset.id);
    navigate('/portfolio');
  };

  return (
    <>
      <Navbar mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />
      <div className="md:ml-[var(--sidebar-width)]" style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 48 }}>
        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 35,
          background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)',
          padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex-shrink-0 p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-raised)] transition-colors"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => navigate('/portfolio')}
            style={{
              background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
              borderRadius: '8px', color: 'var(--text-secondary)', padding: '6px 10px',
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ArrowLeft size={14} strokeWidth={2} />
            {t('assetDetail.backToPortfolio')}
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{t('assetDetail.detailAset')}</span>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Header card ── */}
          <Card variant="elevated" padding="md">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    {asset.assetName}
                  </h1>
                  {asset.ticker && (
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                      {asset.ticker}
                    </span>
                  )}
                  {isStale && <Badge variant="stale" dot>STALE</Badge>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Badge variant="accent">{CATEGORY_LABELS[asset.category]}</Badge>
                  <Badge variant="neutral">{asset.platform}</Badge>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, margin: 0 }}>
                  {formatCurrency(asset.currentValueIDR)}
                </p>
                <p style={{ color: isPositive ? 'var(--gain-400)' : 'var(--loss-400)', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 600, marginTop: 2 }}>
                  {formatPercent(asset.unrealizedGainPct)} ({formatCurrency(asset.unrealizedGainIDR)})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
              {[
                { label: t('assetDetail.avgCost'), value: formatCurrency(asset.avgCostPerUnit), tooltip: t('tooltip.avgCost') },
                { label: t('assetDetail.currentPriceLabel'), value: formatCurrency(asset.currentPricePerUnit) },
                { label: t('assetDetail.totalUnits'), value: asset.totalUnits.toLocaleString('id-ID', { maximumFractionDigits: 6 }) },
                { label: t('assetDetail.capital'), value: formatCurrency(asset.totalCostBasisIDR), tooltip: t('tooltip.capital') },
                { label: t('assetDetail.realizedGain'), value: formatCurrency(asset.realizedGainIDR), colored: asset.realizedGainIDR !== 0, positive: asset.realizedGainIDR >= 0, tooltip: t('tooltip.realizedGain') },
                { label: t('assetDetail.income'), value: formatCurrency(asset.totalIncomeIDR), colored: asset.totalIncomeIDR > 0, positive: true },
                { label: t('assetDetail.totalFees'), value: formatCurrency(asset.totalFeesIDR ?? 0), colored: (asset.totalFeesIDR ?? 0) > 0, positive: false },
              ].map(({ label, value, colored, positive, tooltip }) => (
                <div key={label}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '11px', marginBottom: 2 }}>
                    {label}{tooltip && <InfoTooltip content={tooltip} size={11} />}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: colored ? (positive ? 'var(--gain-400)' : 'var(--loss-400)') : 'var(--text-primary)' }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Action buttons ── */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActionModal('price_update')}
                style={{ flex: '1 1 auto', minWidth: 100, padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', transition: 'all 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--blue-400)'; e.currentTarget.style.color = 'var(--blue-300)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                {t('portfolio.updatePrice')}
              </button>
              <button
                onClick={() => setActionModal('top_up')}
                style={{ flex: '1 1 auto', minWidth: 100, padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'rgba(15,186,130,0.06)', border: '1px solid rgba(15,186,130,0.2)', color: 'var(--gain-400)', transition: 'all 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(15,186,130,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15,186,130,0.06)'; }}
              >
                {t('portfolio.topUp')}
              </button>
              <button
                onClick={() => setActionModal('partial_sell')}
                style={{ flex: '1 1 auto', minWidth: 100, padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', color: 'var(--warn-400)', transition: 'all 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.06)'; }}
              >
                {t('portfolio.sellPartial')}
              </button>
              <button
                onClick={() => setActionModal('full_sell')}
                style={{ flex: '1 1 auto', minWidth: 100, padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'rgba(240,71,106,0.06)', border: '1px solid rgba(240,71,106,0.2)', color: 'var(--loss-400)', transition: 'all 150ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(240,71,106,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(240,71,106,0.06)'; }}
              >
                {t('portfolio.sellAll')}
              </button>
              <button
                onClick={() => setDeleteAssetConfirm(true)}
                style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-muted)', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--loss-400)'; e.currentTarget.style.color = 'var(--loss-400)'; e.currentTarget.style.background = 'rgba(240,71,106,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <Trash2 size={13} strokeWidth={2} />
                {t('portfolio.deleteAsset')}
              </button>
            </div>
          </Card>

          {/* ── Price history chart ── */}
          <Card variant="default" padding="md">
            <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0' }}>
              {t('assetDetail.priceHistory')}
            </h2>
            {priceHistory.length < 2 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                {t('assetDetail.noPriceHistory')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={priceHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={52}
                    tickFormatter={(v: number) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}rb`;
                      return String(v);
                    }}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <ReferenceLine y={asset.avgCostPerUnit} stroke="var(--warn-400)" strokeDasharray="4 3" strokeOpacity={0.6} />
                  <Line type="monotone" dataKey="price" stroke={isPositive ? 'var(--gain-400)' : 'var(--loss-400)'} strokeWidth={2}
                    dot={{ fill: isPositive ? 'var(--gain-400)' : 'var(--loss-400)', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
            {priceHistory.length >= 2 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '10px', marginTop: 8, textAlign: 'center' }}>
                {t('assetDetail.avgCostLine')}
              </p>
            )}
          </Card>

          {/* ── AI Recommendation (mock) ── */}
          <Card variant="accent" padding="md">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Sparkles size={14} strokeWidth={2} style={{ color: 'var(--ai-accent)' }} />
              </div>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>{t('assetDetail.aiRecommendation')}</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '10px', margin: 0 }}>{t('assetDetail.aiMock')}</p>
              </div>
              <span style={{ marginLeft: 'auto' }}><Badge variant="ai">Beta</Badge></span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {aiInsights.map((insight, i) => (
                <div key={i} style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {insight}
                </div>
              ))}
            </div>
          </Card>

          {/* ── Journal log ── */}
          <Card variant="default" padding="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div>
                <h2 style={{ color: 'var(--text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                  {t('assetDetail.transactionLog')}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '2px 0 0 0' }}>
                  {activeEntries.length} {t('assetDetail.active')}{correctedEntries.length > 0 ? ` · ${correctedEntries.length} ${t('assetDetail.deleted')}` : ''}
                </p>
              </div>
              {correctedEntries.length > 0 && (
                <button
                  onClick={() => setShowCorrected((v) => !v)}
                  style={{
                    background: showCorrected ? 'rgba(71,85,105,0.2)' : 'transparent',
                    border: '1px solid var(--border-default)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    padding: '4px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {showCorrected ? t('assetDetail.hideDeleted') : t('assetDetail.showDeleted')}
                </button>
              )}
            </div>

            {sortedEntries.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
                {t('assetDetail.noTransactions')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedEntries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} onDelete={setEntryToDelete} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Entry delete modal */}
      {entryToDelete && (
        <DeleteEntryModal
          entry={entryToDelete}
          onConfirm={handleDeleteEntryConfirm}
          onCancel={() => setEntryToDelete(null)}
          isDeleting={isDeletingEntry}
        />
      )}

      {/* Action entry modal */}
      {actionModal && asset && (
        <Modal
          open={true}
          onClose={() => setActionModal(null)}
          title={`${asset.assetName} — ${t(`entry.${actionModal}`)}`}
        >
          <EntryForm
            onSuccess={() => setActionModal(null)}
            defaultEntryType={actionModal}
            defaultAssetId={asset.id}
            defaultAssetName={asset.assetName}
            defaultCategory={asset.category}
            defaultPlatform={asset.platform}
            isExistingAsset={true}
          />
        </Modal>
      )}

      {/* Delete asset confirm modal */}
      {deleteAssetConfirm && asset && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDeleteAssetConfirm(false)}
        >
          <div
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '14px', padding: '24px', width: '100%', maxWidth: 360, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(240,71,106,0.1)', border: '1px solid rgba(240,71,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={16} stroke="var(--loss-400)" strokeWidth={2} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 600, margin: 0 }}>{t('portfolio.deleteTitle')}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 6px 0' }}>
              {t('portfolio.deleteAssetQuestion')} <strong style={{ color: 'var(--text-primary)' }}>{asset.assetName}</strong>?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {t('portfolio.deleteAssetDesc')}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button type="button" variant="secondary" size="md" onClick={() => setDeleteAssetConfirm(false)} style={{ flex: 1 }}>{t('common.cancel')}</Button>
              <Button type="button" variant="danger" size="md" onClick={handleDeleteAsset} loading={isDeletingAsset} style={{ flex: 1 }}>{t('common.delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
