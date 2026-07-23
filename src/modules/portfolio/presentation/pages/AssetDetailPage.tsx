import { useState } from 'react';
import { PlusCircle, Activity, ArrowUp, ArrowRight, XCircle, DollarSign, CreditCard, RotateCcw, Trash2, ArrowLeft, Menu, TrendingUp, TrendingDown, Pencil } from 'lucide-react';
import { Navbar } from '@/shared/ui/Navbar';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useActiveAssets, useDeleteAsset, useUpdateAssetMeta } from '../hooks/useAssets';
import { useAssetEntries, useDeleteEntry, useEditEntry, useCreateEntry } from '../hooks/useEntries';
import { Modal } from '@/shared/ui/Modal';
import { EntryForm } from '../components/EntryForm';
import { Badge } from '@/shared/ui/Badge';
import { Card } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { formatCurrency, formatPercent, formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { CATEGORY_LABELS } from '@/shared/constants/categories';
import { buildPriceHistory } from '../utils/assetChartUtils';
import type { AssetEntry } from '@/modules/portfolio';
import { computeIsStale } from '@/shared/utils/calculations';
import { InfoTooltip } from '@/shared/ui/InfoTooltip';
import { AssetDetailSkeleton } from '@/shared/ui/Skeleton';
import { StockLivePanel } from '../components/StockLivePanel';
import { StockForecastCard } from '@/modules/portfolio';
import { PriceTargetCard } from '../components/PriceTargetCard';
import { InvestorFlowCard } from '../components/InvestorFlowCard';
import { AssetInsightCard } from '../components/AssetInsightCard';
import { DeleteEntryModal, EditEntryModal } from '../components/EntryActionModals';

// ── Edit Asset Modal ─────────────────────────────────────────────────────────

function EditAssetModal({
  asset,
  onClose,
  onSave,
  isSaving,
}: {
  asset: { id: string; assetName: string; ticker?: string; platform: string };
  onClose: () => void;
  onSave: (patch: { id: string; assetName: string; ticker: string; platform: string }) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(asset.assetName);
  const [ticker, setTicker] = useState(asset.ticker ?? '');
  const [platform, setPlatform] = useState(asset.platform);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ id: asset.id, assetName: name.trim(), ticker: ticker.trim().toUpperCase(), platform: platform.trim() });
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border-default)', background: 'var(--bg-raised)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'var(--font-sans)',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600,
    color: 'var(--text-secondary)', marginBottom: 5,
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(77,124,255,0.1)', border: '1px solid rgba(77,124,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Pencil size={15} stroke="var(--blue-400)" strokeWidth={2} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: 0 }}>Edit Info Aset</h3>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Nama Aset *</label>
            <input style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama aset" required />
          </div>
          <div>
            <label style={labelStyle}>Kode Tiket <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsional)</span></label>
            <input
              style={{ ...fieldStyle, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="mis. BBCA, GOTO"
            />
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>Untuk saham IDX, masukkan kode tanpa .JK (mis. BBCA)</p>
          </div>
          <div>
            <label style={labelStyle}>Platform</label>
            <input style={fieldStyle} value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="mis. Ajaib, IPOT, Bibit" />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button type="button" variant="secondary" size="md" onClick={onClose} style={{ flex: 1 }}>Batal</Button>
            <Button type="submit" variant="primary" size="md" loading={isSaving} style={{ flex: 1 }}>Simpan</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
type EntryColor = { bg: string; border: string; text: string };
const ENTRY_STYLES: Record<string, EntryColor> = {
  new_position: { bg: 'rgba(77,124,255,0.06)', border: 'rgba(77,124,255,0.2)', text: 'var(--blue-300)' },
  price_update: { bg: 'rgba(71,85,105,0.1)', border: 'var(--border-subtle)', text: 'var(--text-secondary)' },
  top_up: { bg: 'rgba(15,186,130,0.06)', border: 'rgba(15,186,130,0.18)', text: 'var(--gain-400)' },
  partial_sell: { bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', text: 'var(--warn-400)' },
  full_sell: { bg: 'rgba(240,71,106,0.06)', border: 'rgba(240,71,106,0.2)', text: 'var(--loss-400)' },
  income: { bg: 'rgba(15,186,130,0.06)', border: 'rgba(15,186,130,0.18)', text: 'var(--gain-400)' },
  fee: { bg: 'rgba(240,71,106,0.06)', border: 'rgba(240,71,106,0.18)', text: 'var(--loss-400)' },
  correction: { bg: 'rgba(167,139,250,0.06)', border: 'rgba(167,139,250,0.2)', text: 'var(--ai-accent)' },
};
const DEFAULT_STYLE: EntryColor = { bg: 'var(--bg-raised)', border: 'var(--border-subtle)', text: 'var(--text-secondary)' };


function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '8px 12px' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginBottom: 2 }}>{label}</p>
      <p style={{ color: 'var(--blue-300)', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600 }}>{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

function EntryIcon({ type, color }: { type: string; color: string }) {
  const p = { size: 14, strokeWidth: 2, color };
  if (type === 'new_position') return <PlusCircle {...p} />;
  if (type === 'price_update') return <Activity {...p} />;
  if (type === 'top_up') return <ArrowUp {...p} />;
  if (type === 'partial_sell') return <ArrowRight {...p} />;
  if (type === 'full_sell') return <XCircle {...p} />;
  if (type === 'income') return <DollarSign {...p} />;
  if (type === 'fee') return <CreditCard {...p} />;
  return <RotateCcw {...p} />;
}

function EntryRow({ entry, onDelete, onEdit }: { entry: AssetEntry; onDelete: (e: AssetEntry) => void; onEdit: (e: AssetEntry) => void }) {
  const { t } = useTranslation();
  const style = ENTRY_STYLES[entry.entryType] ?? DEFAULT_STYLE;

  const INCOME_FEE_LABELS: Record<string, string> = {
    dividend: t('entry.dividend'), coupon: t('entry.coupon'), interest: t('entry.interest'),
    platform_fee: t('entry.platform_fee'), tax: t('entry.tax'), other: t('entry.other'),
  };

  let headerVal: { label: string; value: string } | null = null;
  if (entry.entryType === 'price_update' && entry.pricePerUnit != null) {
    headerVal = { label: t('assetDetail.entryHeaderLatestPrice'), value: formatCurrency(entry.pricePerUnit) };
  } else if (entry.pricePerUnit != null && entry.units != null) {
    headerVal = { label: t('assetDetail.entryHeaderTotalValue'), value: formatCurrencyCompact(entry.pricePerUnit * entry.units) };
  } else if (entry.amount != null) {
    headerVal = { label: t('assetDetail.entryHeaderAmount'), value: formatCurrencyCompact(entry.amount) };
  } else if (entry.pricePerUnit != null) {
    headerVal = { label: t('assetDetail.entryHeaderPrice'), value: formatCurrency(entry.pricePerUnit) };
  }

  const details: { label: string; value: string }[] = [];
  if (entry.pricePerUnit != null) details.push({ label: t('assetDetail.entryFieldPricePerUnit'), value: formatCurrency(entry.pricePerUnit) });
  if (entry.units != null) details.push({ label: t('assetDetail.entryFieldUnit'), value: entry.units.toLocaleString('id-ID', { maximumFractionDigits: 6 }) });
  if (entry.pricePerUnit != null && entry.units != null) details.push({ label: t('assetDetail.entryFieldTotal'), value: formatCurrency(entry.pricePerUnit * entry.units) });
  if (entry.amount != null) details.push({ label: t('assetDetail.entryFieldNominal'), value: formatCurrency(entry.amount) });
  if (entry.currency && entry.currency !== 'IDR') {
    details.push({ label: t('assetDetail.entryFieldCurrency'), value: entry.currency });
    if (entry.exchangeRateToIDR) details.push({ label: t('assetDetail.entryFieldRate'), value: `Rp ${entry.exchangeRateToIDR.toLocaleString('id-ID')}/${entry.currency}` });
  }

  return (
    <div style={{ borderRadius: 10, background: entry.isCorrected ? 'transparent' : style.bg, border: `1px solid ${entry.isCorrected ? 'var(--border-dim)' : style.border}`, opacity: entry.isCorrected ? 0.45 : 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '9px 11px' }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: entry.isCorrected ? 'var(--bg-raised)' : style.bg, border: `1px solid ${entry.isCorrected ? 'var(--border-dim)' : style.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
          <EntryIcon type={entry.entryType} color={entry.isCorrected ? 'var(--text-muted)' : style.text} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
            <span style={{ color: entry.isCorrected ? 'var(--text-muted)' : style.text, fontSize: 12, fontWeight: 600 }}>{t(`entry.${entry.entryType}`)}</span>
            {entry.isCorrected && <Badge variant="neutral" size="sm">{t('entry.deletedLabel')}</Badge>}
            {entry.incomeFeeCategory && <Badge variant="neutral" size="sm">{INCOME_FEE_LABELS[entry.incomeFeeCategory] ?? entry.incomeFeeCategory}</Badge>}
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>
            {entry.date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexShrink: 0 }}>
          {headerVal && (
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: 10 }}>{headerVal.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: entry.isCorrected ? 'var(--text-muted)' : style.text }}>{headerVal.value}</span>
            </div>
          )}
          {!entry.isCorrected && (
            <>
              <button
                onClick={() => onEdit(entry)}
                title="Edit transaksi"
                style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 6, color: 'var(--text-muted)', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 150ms', marginTop: 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--blue-400)'; e.currentTarget.style.background = 'rgba(77,124,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(77,124,255,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <Pencil size={12} strokeWidth={2} />
              </button>
              <button
                onClick={() => onDelete(entry)}
                title={t('assetDetail.deleteTransaction')}
                style={{ background: 'transparent', border: '1px solid transparent', borderRadius: 6, color: 'var(--text-muted)', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 150ms', marginTop: 1 }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--loss-400)'; e.currentTarget.style.background = 'rgba(240,71,106,0.08)'; e.currentTarget.style.borderColor = 'rgba(240,71,106,0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
              >
                <Trash2 size={12} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </div>
      {!entry.isCorrected && details.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', padding: '7px 11px 9px', borderTop: `1px solid ${style.border}`, background: 'rgba(0,0,0,0.12)' }}>
          {details.map((d) => (
            <div key={d.label} style={{ minWidth: 70 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 10, display: 'block', marginBottom: 1 }}>{d.label}</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500 }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
      {!entry.isCorrected && entry.notes && (
        <div style={{ padding: '5px 11px 9px', borderTop: `1px solid ${style.border}`, background: 'rgba(0,0,0,0.08)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, display: 'block', marginBottom: 2 }}>{t('assetDetail.entryFieldNotes')}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontStyle: 'italic', lineHeight: 1.5 }}>{entry.notes}</span>
        </div>
      )}
    </div>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 150ms',
        background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? 'var(--blue-400)' : 'transparent'}`,
        color: active ? 'var(--blue-300)' : 'var(--text-muted)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, color, tooltip }: { label: string; value: string; color?: string; tooltip?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 80 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        {label}{tooltip && <InfoTooltip content={tooltip} size={10} />}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: color ?? 'var(--text-primary)', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'summary' | 'market' | 'journal';
type ActionEntryType = 'price_update' | 'top_up' | 'partial_sell' | 'full_sell';

export function AssetDetailPage() {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('summary');
  const [entryToDelete, setEntryToDelete] = useState<AssetEntry | null>(null);
  const [entryToEdit, setEntryToEdit]     = useState<AssetEntry | null>(null);
  const [showCorrected, setShowCorrected] = useState(false);
  const [actionModal, setActionModal] = useState<ActionEntryType | null>(null);
  const [deleteAssetConfirm, setDeleteAssetConfirm] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: assets = [], isLoading: assetsLoading } = useActiveAssets();
  const { data: entries = [], isLoading: entriesLoading } = useAssetEntries(assetId ?? '');
  const { mutateAsync: deleteEntry, isPending: isDeletingEntry } = useDeleteEntry();
  const { mutateAsync: editEntry,  isPending: isEditingEntry  } = useEditEntry();
  const { mutateAsync: createEntry, isPending: isQuickUpdating } = useCreateEntry();
  const { mutateAsync: deleteAssetMutation, isPending: isDeletingAsset } = useDeleteAsset();
  const { mutateAsync: updateAssetMeta, isPending: isSavingMeta } = useUpdateAssetMeta();

  const asset = assets.find((a) => a.id === assetId);
  const isLoading = assetsLoading || entriesLoading;

  if (isLoading) {
    return <AssetDetailSkeleton />;
  }

  if (!asset) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('assetDetail.notFound')}</p>
        <button onClick={() => navigate('/portfolio')} style={{ color: 'var(--blue-400)', fontSize: 14 }}>{t('assetDetail.backToPortfolioLink')}</button>
      </div>
    );
  }

  const isStale = computeIsStale(asset);
  const isPositive = asset.unrealizedGainIDR >= 0;
  const isSaham = asset.category === 'saham' && !!asset.ticker;
  const priceHistory = buildPriceHistory(entries);
  const activeEntries = entries.filter((e) => !e.isCorrected);
  const correctedEntries = entries.filter((e) => e.isCorrected);
  const sortedEntries = [...(showCorrected ? entries : activeEntries)].sort((a, b) => b.date.getTime() - a.date.getTime());
  const handleDeleteEntryConfirm = async () => {
    if (!entryToDelete) return;
    await deleteEntry(entryToDelete);
    setEntryToDelete(null);
  };

  const handleDeleteAsset = async () => {
    await deleteAssetMutation(asset.id);
    navigate('/portfolio');
  };

  const handleQuickPriceUpdate = async () => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await createEntry({
      userId: asset.userId,
      assetId: asset.id,
      assetName: asset.assetName,
      ticker: asset.ticker,
      category: asset.category,
      platform: asset.platform,
      entryType: 'price_update',
      month,
      pricePerUnit: asset.currentPricePerUnit,
      currency: asset.currency,
      date: now,
    });
  };

  return (
    <>
      <Navbar mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />
      <div className="md:ml-[var(--sidebar-width)]" style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>

        {/* ── Topbar ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 35, background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="md:hidden flex-shrink-0 p-1.5 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-raised)] transition-colors" onClick={() => setDrawerOpen(true)}>
            <Menu size={18} />
          </button>
          <button
            onClick={() => navigate('/portfolio')}
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-secondary)', padding: '5px 10px', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} strokeWidth={2} />{t('assetDetail.backToPortfolio')}
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.assetName}</span>
        </div>

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 0' }}>

          {/* ── Compact header card ── */}
          <Card variant="elevated" padding="none">
            <div style={{ padding: '14px 16px' }}>
              {/* Name row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <h1 style={{ color: 'var(--text-primary)', fontSize: 16, fontWeight: 700, margin: 0 }}>{asset.assetName}</h1>
                    {asset.ticker && <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{asset.ticker}</span>}
                    {isStale && <Badge variant="stale" dot>STALE</Badge>}
                    <button
                      onClick={() => setEditOpen(true)}
                      title="Edit info aset"
                      style={{ background: 'none', border: 'none', padding: 3, cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', borderRadius: 4, transition: 'color 120ms' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--blue-400)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Pencil size={13} strokeWidth={2} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 5 }}>
                    <Badge variant="accent">{CATEGORY_LABELS[asset.category]}</Badge>
                    <Badge variant="neutral">{asset.platform}</Badge>
                  </div>
                </div>
                {/* Value block */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, margin: 0 }}>
                    {formatCurrency(asset.currentValueIDR)}
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, marginTop: 2, color: isPositive ? 'var(--gain-400)' : 'var(--loss-400)' }}>
                    {isPositive ? <TrendingUp size={13} strokeWidth={2.5} /> : <TrendingDown size={13} strokeWidth={2.5} />}
                    {formatPercent(asset.unrealizedGainPct)}
                    <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)' }}>({formatCurrencyCompact(asset.unrealizedGainIDR)})</span>
                  </p>
                </div>
              </div>

              {/* Stats row — horizontally scrollable on mobile */}
              <div style={{ display: 'flex', gap: 16, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', overflowX: 'auto', paddingBottom: 2 }}>
                <StatPill label={t('assetDetail.avgCost')} value={formatCurrency(asset.avgCostPerUnit)} tooltip={t('tooltip.avgCost')} />
                <StatPill label={t('assetDetail.currentPriceLabel')} value={formatCurrency(asset.currentPricePerUnit)} />
                <StatPill label={t('assetDetail.totalUnits')} value={asset.totalUnits.toLocaleString('id-ID', { maximumFractionDigits: 4 })} />
                <StatPill label={t('assetDetail.capital')} value={formatCurrencyCompact(asset.totalCostBasisIDR)} tooltip={t('tooltip.capital')} />
                <StatPill label={t('assetDetail.realizedGain')} value={formatCurrencyCompact(asset.realizedGainIDR)} color={asset.realizedGainIDR >= 0 ? 'var(--gain-400)' : 'var(--loss-400)'} tooltip={t('tooltip.realizedGain')} />
                {asset.totalIncomeIDR > 0 && <StatPill label={t('assetDetail.income')} value={formatCurrencyCompact(asset.totalIncomeIDR)} color="var(--gain-400)" />}
                {(asset.totalFeesIDR ?? 0) > 0 && <StatPill label={t('assetDetail.totalFees')} value={formatCurrencyCompact(asset.totalFeesIDR ?? 0)} color="var(--loss-400)" />}
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div style={{ display: 'flex', borderTop: '1px solid var(--border-subtle)' }}>
              {/* price_update with inline quick-update option */}
              <div style={{ flex: 1, display: 'flex', borderRight: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => setActionModal('price_update')}
                  style={{ flex: 1, padding: '9px 4px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--bg-raised)', border: 'none', color: 'var(--text-secondary)', transition: 'background 150ms', borderRight: '1px solid var(--border-subtle)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(77,124,255,0.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg-raised)'; }}
                >
                  {t('portfolio.updatePrice')}
                </button>
                <button
                  onClick={handleQuickPriceUpdate}
                  disabled={isQuickUpdating || asset.currentPricePerUnit <= 0}
                  title={`Pakai harga terakhir: ${formatCurrency(asset.currentPricePerUnit)}`}
                  style={{ padding: '9px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'rgba(77,124,255,0.06)', border: 'none', color: 'var(--blue-400)', transition: 'background 150ms', whiteSpace: 'nowrap', opacity: isQuickUpdating ? 0.6 : 1 }}
                  onMouseEnter={(e) => { if (!isQuickUpdating) e.currentTarget.style.background = 'rgba(77,124,255,0.14)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(77,124,255,0.06)'; }}
                >
                  {isQuickUpdating ? '...' : '↺ Hari Ini'}
                </button>
              </div>
              {[
                { key: 'top_up', label: t('portfolio.topUp'), color: 'var(--gain-400)', bg: 'rgba(15,186,130,0.04)', hover: 'rgba(15,186,130,0.1)' },
                { key: 'partial_sell', label: t('portfolio.sellPartial'), color: 'var(--warn-400)', bg: 'rgba(245,158,11,0.04)', hover: 'rgba(245,158,11,0.1)' },
                { key: 'full_sell', label: t('portfolio.sellAll'), color: 'var(--loss-400)', bg: 'rgba(240,71,106,0.04)', hover: 'rgba(240,71,106,0.1)' },
              ].map(({ key, label, color, bg, hover }) => (
                <button
                  key={key}
                  onClick={() => setActionModal(key as ActionEntryType)}
                  style={{ flex: 1, padding: '9px 4px', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: bg, border: 'none', borderRight: '1px solid var(--border-subtle)', color, transition: 'background 150ms' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = hover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = bg; }}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => setDeleteAssetConfirm(true)}
                style={{ padding: '9px 10px', fontSize: 11, cursor: 'pointer', background: 'transparent', border: 'none', color: 'var(--text-muted)', transition: 'all 150ms', display: 'flex', alignItems: 'center' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--loss-400)'; e.currentTarget.style.background = 'rgba(240,71,106,0.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                title={t('portfolio.deleteAsset')}
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          </Card>

          {/* ── Tab bar ── */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginTop: 12, overflowX: 'auto' }}>
            <TabBtn active={tab === 'summary'} onClick={() => setTab('summary')}>Ringkasan</TabBtn>
            {isSaham && <TabBtn active={tab === 'market'} onClick={() => setTab('market')}>Pasar</TabBtn>}
            <TabBtn active={tab === 'journal'} onClick={() => setTab('journal')}>
              Jurnal {activeEntries.length > 0 && <span style={{ marginLeft: 5, padding: '1px 6px', borderRadius: 99, fontSize: 10, background: 'var(--bg-raised)', color: 'var(--text-muted)' }}>{activeEntries.length}</span>}
            </TabBtn>
          </div>

          {/* ── Tab content ── */}
          <div style={{ paddingTop: 14, paddingBottom: 48 }}>

            {/* SUMMARY tab */}
            {tab === 'summary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Price history chart */}
                <Card variant="default" padding="md">
                  <h2 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: '0 0 12px 0' }}>{t('assetDetail.priceHistory')}</h2>
                  {priceHistory.length < 2 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text-muted)', fontSize: 13 }}>{t('assetDetail.noPriceHistory')}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={priceHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                        <YAxis
                          tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={50}
                          tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}rb` : String(v)}
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
                    <p style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 6, textAlign: 'center' }}>{t('assetDetail.avgCostLine')}</p>
                  )}
                </Card>

                {/* AI insights */}
                <AssetInsightCard asset={asset} entries={activeEntries} />
              </div>
            )}

            {/* MARKET tab */}
            {tab === 'market' && isSaham && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <StockLivePanel asset={asset} />
                <PriceTargetCard asset={asset} />
                <InvestorFlowCard ticker={asset.ticker!} />
                <StockForecastCard asset={asset} />
              </div>
            )}

            {/* JOURNAL tab */}
            {tab === 'journal' && (
              <Card variant="default" padding="md">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h2 style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, margin: 0 }}>{t('assetDetail.transactionLog')}</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: '2px 0 0 0' }}>
                      {activeEntries.length} {t('assetDetail.active')}{correctedEntries.length > 0 ? ` · ${correctedEntries.length} ${t('assetDetail.deleted')}` : ''}
                    </p>
                  </div>
                  {correctedEntries.length > 0 && (
                    <button
                      onClick={() => setShowCorrected((v) => !v)}
                      style={{ background: showCorrected ? 'rgba(71,85,105,0.2)' : 'transparent', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-secondary)', padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
                    >
                      {showCorrected ? t('assetDetail.hideDeleted') : t('assetDetail.showDeleted')}
                    </button>
                  )}
                </div>
                {sortedEntries.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>{t('assetDetail.noTransactions')}</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {sortedEntries.map((entry) => (
                      <EntryRow key={entry.id} entry={entry} onDelete={setEntryToDelete} onEdit={setEntryToEdit} />
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {editOpen && (
        <EditAssetModal
          asset={asset}
          onClose={() => setEditOpen(false)}
          isSaving={isSavingMeta}
          onSave={async (patch) => {
            await updateAssetMeta({ assetId: patch.id, assetName: patch.assetName, ticker: patch.ticker, platform: patch.platform });
            setEditOpen(false);
          }}
        />
      )}

      {entryToDelete && (
        <DeleteEntryModal entry={entryToDelete} onConfirm={handleDeleteEntryConfirm} onCancel={() => setEntryToDelete(null)} isDeleting={isDeletingEntry} />
      )}

      {entryToEdit && (
        <EditEntryModal
          entry={entryToEdit}
          isSaving={isEditingEntry}
          onCancel={() => setEntryToEdit(null)}
          onSave={async (patch) => {
            await editEntry({ original: entryToEdit, patch });
            setEntryToEdit(null);
          }}
        />
      )}

      {actionModal && (
        <Modal open={true} onClose={() => setActionModal(null)} title={`${asset.assetName} — ${t(`entry.${actionModal}`)}`}>
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

      {deleteAssetConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={() => setDeleteAssetConfirm(false)}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(240,71,106,0.1)', border: '1px solid rgba(240,71,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trash2 size={16} stroke="var(--loss-400)" strokeWidth={2} />
              </div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: 0 }}>{t('portfolio.deleteTitle')}</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: '0 0 6px 0' }}>
              {t('portfolio.deleteAssetQuestion')} <strong style={{ color: 'var(--text-primary)' }}>{asset.assetName}</strong>?
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, margin: '0 0 20px 0' }}>{t('portfolio.deleteAssetDesc')}</p>
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
