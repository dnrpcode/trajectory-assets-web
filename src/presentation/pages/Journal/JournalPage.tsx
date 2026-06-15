import React, { useState } from 'react';
import { PlusCircle, Activity, ArrowUp, ArrowRight, XCircle, DollarSign, CreditCard, RotateCcw, BookOpen } from 'lucide-react';
import { Layout } from '../../components/ui/Layout';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import { useEntries } from '../../hooks/useEntries';
import { formatDate, formatMonth } from '../../../shared/utils/formatDate';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { EntryType } from '../../../shared/types';
import { AssetEntry } from '../../../domain/entities/AssetEntry';

const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  new_position: 'Posisi Baru',
  price_update: 'Update Harga',
  top_up:       'Top Up',
  partial_sell: 'Jual Sebagian',
  full_sell:    'Jual Semua',
  income:       'Dividen/Kupon',
  fee:          'Biaya',
  correction:   'Koreksi',
};

function EntryIcon({ type }: { type: EntryType }) {
  const props = { size: 14, strokeWidth: 2 };
  const icons: Record<EntryType, React.ReactNode> = {
    new_position: <PlusCircle {...props} />,
    price_update: <Activity {...props} />,
    top_up:       <ArrowUp {...props} />,
    partial_sell: <ArrowRight {...props} />,
    full_sell:    <XCircle {...props} />,
    income:       <DollarSign {...props} />,
    fee:          <CreditCard {...props} />,
    correction:   <RotateCcw {...props} />,
  };
  return <>{icons[type]}</>;
}

const ENTRY_TYPE_BADGE: Record<EntryType, 'gain' | 'accent' | 'loss' | 'warn' | 'neutral'> = {
  new_position: 'gain',
  price_update: 'accent',
  top_up:       'accent',
  partial_sell: 'loss',
  full_sell:    'loss',
  income:       'gain',
  fee:          'warn',
  correction:   'neutral',
};

const ENTRY_TYPE_ICON_COLOR: Record<EntryType, string> = {
  new_position: 'var(--gain-400)',
  price_update: 'var(--blue-300)',
  top_up:       'var(--blue-300)',
  partial_sell: 'var(--loss-400)',
  full_sell:    'var(--loss-400)',
  income:       'var(--gain-400)',
  fee:          'var(--warn-400)',
  correction:   'var(--text-secondary)',
};

function groupByMonth(entries: AssetEntry[]): Map<string, AssetEntry[]> {
  const map = new Map<string, AssetEntry[]>();
  for (const entry of entries) {
    if (!map.has(entry.month)) map.set(entry.month, []);
    map.get(entry.month)!.push(entry);
  }
  return map;
}

const FILTER_TYPES: (EntryType | 'all')[] = ['all', 'new_position', 'price_update', 'top_up', 'partial_sell', 'full_sell', 'income', 'fee'];

export function JournalPage() {
  const { data: entries = [], isLoading } = useEntries();
  const [typeFilter, setTypeFilter] = useState<EntryType | 'all'>('all');

  const filtered = entries
    .filter((e) => typeFilter === 'all' || e.entryType === typeFilter)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const grouped = groupByMonth(filtered);
  const months = Array.from(grouped.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
          Jurnal Transaksi
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {entries.length} entri tercatat
        </p>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {FILTER_TYPES.map((t) => {
          const active = typeFilter === t;
          return (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
              style={{
                background: active ? 'var(--blue-400)' : 'var(--bg-raised)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: active ? '1px solid transparent' : '1px solid var(--border-default)',
                letterSpacing: 'var(--tracking-caps)',
                textTransform: 'uppercase',
              }}
            >
              {t === 'all' ? 'Semua' : ENTRY_TYPE_LABELS[t]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : months.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}
          >
            <BookOpen size={24} strokeWidth={1.75} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Belum ada entri jurnal</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tambahkan aset pertama dari halaman Portofolio</p>
        </div>
      ) : (
        <div className="space-y-8">
          {months.map((month) => (
            <div key={month}>
              <h2
                className="text-xs font-semibold uppercase mb-3"
                style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}
              >
                {formatMonth(month)}
              </h2>
              <div className="space-y-2">
                {grouped.get(month)!.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function EntryRow({ entry }: { entry: AssetEntry }) {
  const isGain = ['new_position', 'top_up', 'income'].includes(entry.entryType);
  const isLoss = ['partial_sell', 'full_sell', 'fee'].includes(entry.entryType);

  const valueIDR = entry.pricePerUnit && entry.units
    ? entry.pricePerUnit * entry.units * (entry.exchangeRateToIDR ?? 1)
    : (entry.amount ?? 0) * (entry.exchangeRateToIDR ?? 1);

  return (
    <div
      className="rounded-[var(--radius-lg)] px-4 py-3 flex items-center gap-4 transition-colors duration-150"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        opacity: entry.isCorrected ? 0.5 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--bg-raised)', color: ENTRY_TYPE_ICON_COLOR[entry.entryType] }}
      >
        <EntryIcon type={entry.entryType} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {entry.assetName ?? '—'}
          </p>
          <Badge variant={ENTRY_TYPE_BADGE[entry.entryType]}>
            {ENTRY_TYPE_LABELS[entry.entryType]}
          </Badge>
          {entry.isCorrected && <Badge variant="neutral">Dikoreksi</Badge>}
          {entry.platform && (
            <span className="text-[0.6875rem]" style={{ color: 'var(--text-muted)' }}>
              {entry.platform}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{formatDate(entry.date)}</p>
        {entry.notes && (
          <p className="text-xs mt-1 italic" style={{ color: 'var(--text-secondary)' }}>"{entry.notes}"</p>
        )}
      </div>

      {/* Value */}
      <div className="text-right flex-shrink-0">
        {valueIDR > 0 && (
          <p
            className="text-sm font-semibold font-mono"
            style={{
              color: isGain ? 'var(--gain-400)' : isLoss ? 'var(--loss-400)' : 'var(--text-primary)',
              letterSpacing: 'var(--tracking-mono)',
            }}
          >
            {isLoss ? '−' : ''}{formatCurrency(valueIDR)}
          </p>
        )}
        {entry.pricePerUnit && (
          <p className="text-[0.6875rem] mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            @ {formatCurrency(entry.pricePerUnit)}
            {entry.units ? ` × ${entry.units}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
