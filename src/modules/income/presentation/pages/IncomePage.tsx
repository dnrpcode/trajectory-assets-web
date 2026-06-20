import { useState, useMemo } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/Spinner';
import { cn } from '@/shared/utils/cn';
import { formatCurrency, formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { formatDate } from '@/shared/utils/formatDate';
import { CATEGORY_LABELS } from '@/shared/constants/categories';
import { useEntries } from '@/modules/portfolio/presentation/hooks/useEntries';
import type { AssetEntry } from '@/modules/portfolio/domain/entities/AssetEntry';

// ─── Type config ───────────────────────────────────────────────────────────────

type IncomeCategory = 'dividend' | 'coupon' | 'interest' | 'other';

const TYPE_LABELS: Record<IncomeCategory, string> = {
  dividend: 'Dividen',
  coupon: 'Kupon',
  interest: 'Bunga',
  other: 'Lainnya',
};

const TYPE_COLORS: Record<IncomeCategory, string> = {
  dividend: 'var(--gain-500)',
  coupon: 'var(--blue-400)',
  interest: '#a855f7',
  other: 'var(--text-muted)',
};

function incomeCategory(entry: AssetEntry): IncomeCategory {
  const c = entry.incomeFeeCategory;
  if (c === 'dividend') return 'dividend';
  if (c === 'coupon') return 'coupon';
  if (c === 'interest') return 'interest';
  return 'other';
}

function amountIDR(entry: AssetEntry): number {
  return (entry.amount ?? 0) * (entry.exchangeRateToIDR ?? 1);
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

// ─── Entry Row ────────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: AssetEntry }) {
  const cat = incomeCategory(entry);
  const color = TYPE_COLORS[cat];
  const idr = amountIDR(entry);

  return (
    <div
      className="flex items-start gap-3 rounded-lg p-4"
      style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {entry.assetName ?? '—'}
          </span>
          {entry.ticker && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)' }}
            >
              {entry.ticker}
            </span>
          )}
          {entry.category && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-dim)' }}
            >
              {CATEGORY_LABELS[entry.category]}
            </span>
          )}
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
          >
            {TYPE_LABELS[cat]}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Tanggal: <span style={{ color: 'var(--text-secondary)' }}>{formatDate(entry.date)}</span>
          </span>
          {idr > 0 && (
            <span className="text-xs font-mono" style={{ color: 'var(--gain-400)' }}>
              {formatCurrency(idr)}
            </span>
          )}
          {entry.currency !== 'IDR' && entry.amount != null && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ({entry.amount.toLocaleString('id-ID')} {entry.currency})
            </span>
          )}
        </div>

        {entry.notes && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{entry.notes}</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function IncomePage() {
  const { data: allEntries = [], isLoading } = useEntries();
  const navigate = useNavigate();

  const incomeEntries = useMemo(
    () => allEntries.filter((e) => e.entryType === 'income' && !e.isCorrected),
    [allEntries],
  );

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const thisMonthTotal = useMemo(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    return incomeEntries
      .filter((e) => e.date.getFullYear() === y && e.date.getMonth() === m)
      .reduce((sum, e) => sum + amountIDR(e), 0);
  }, [incomeEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  const thisYearTotal = useMemo(() => {
    const y = today.getFullYear();
    return incomeEntries
      .filter((e) => e.date.getFullYear() === y)
      .reduce((sum, e) => sum + amountIDR(e), 0);
  }, [incomeEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCount = incomeEntries.length;

  // ── Calendar ───────────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const entriesByDay = useMemo(() => {
    const map: Record<number, AssetEntry[]> = {};
    for (const e of incomeEntries) {
      if (e.date.getFullYear() === calYear && e.date.getMonth() === calMonth) {
        const d = e.date.getDate();
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    }
    return map;
  }, [incomeEntries, calYear, calMonth]);

  const displayedEntries = useMemo(() => {
    if (selectedDay !== null) {
      return entriesByDay[selectedDay] ?? [];
    }
    const month: AssetEntry[] = [];
    for (const d of Object.keys(entriesByDay)) {
      month.push(...entriesByDay[Number(d)]);
    }
    return month.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entriesByDay, selectedDay]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  return (
    <Layout>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={22} style={{ color: 'var(--blue-400)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
              Kalender Dividen &amp; Kupon
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Riwayat penerimaan dividen, kupon, dan bunga dari jurnal transaksi
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate('/journal')}
          icon={<BookOpen size={14} />}
        >
          Buka Jurnal
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Diterima Bulan Ini', value: formatCurrencyCompact(thisMonthTotal), mono: true },
          { label: 'Diterima Tahun Ini', value: formatCurrencyCompact(thisYearTotal), mono: true },
          { label: 'Total Transaksi', value: totalCount.toString(), mono: false },
        ].map(({ label, value, mono }) => (
          <div
            key={label}
            className="rounded-[var(--card-radius)] flex flex-col gap-1.5"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', padding: '16px 20px' }}
          >
            <span
              className="text-xs font-semibold uppercase"
              style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}
            >
              {label}
            </span>
            <span
              className="font-bold leading-tight"
              style={{
                fontSize: 'var(--text-2xl)',
                color: 'var(--text-primary)',
                fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
                letterSpacing: mono ? 'var(--tracking-tight)' : 'var(--tracking-snug)',
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Calendar + list grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Calendar */}
        <div
          className="rounded-[var(--card-radius)] p-5"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-raised)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-semibold text-base" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
              {MONTH_NAMES_ID[calMonth]} {calYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-raised)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_HEADERS.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold py-1"
                style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />;
              const isToday = calYear === todayYear && calMonth === todayMonth && day === todayDay;
              const isSelected = day === selectedDay;
              const dayEntries = entriesByDay[day] ?? [];
              const hasEntries = dayEntries.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg min-h-[48px] transition-colors duration-150',
                    isSelected ? 'bg-[var(--blue-tint-2)]' : 'hover:bg-[var(--bg-raised)]',
                  )}
                  style={{
                    outline: isToday ? '2px solid var(--blue-400)' : 'none',
                    outlineOffset: '-2px',
                  }}
                >
                  <span
                    className="text-sm font-medium leading-none"
                    style={{
                      color: isSelected ? 'var(--blue-300)' : isToday ? 'var(--blue-400)' : 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {day}
                  </span>
                  {hasEntries && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full px-0.5">
                      {dayEntries.slice(0, 3).map((e, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: TYPE_COLORS[incomeCategory(e)] }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-5 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            {(Object.keys(TYPE_LABELS) as IncomeCategory[]).map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: TYPE_COLORS[t] }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{TYPE_LABELS[t]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Entries list */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2
              className="font-semibold text-xs uppercase"
              style={{ color: 'var(--text-secondary)', letterSpacing: 'var(--tracking-caps)' }}
            >
              {selectedDay !== null
                ? `${selectedDay} ${MONTH_NAMES_ID[calMonth]} ${calYear}`
                : `${MONTH_NAMES_ID[calMonth]} ${calYear}`}
            </h2>
            {selectedDay !== null && (
              <button
                onClick={() => setSelectedDay(null)}
                className="text-xs transition-colors"
                style={{ color: 'var(--blue-400)' }}
              >
                Lihat semua
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : displayedEntries.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-[var(--card-radius)]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              <CalendarDays size={28} className="mb-2 opacity-40" />
              <p className="text-sm">
                {incomeEntries.length === 0
                  ? 'Belum ada transaksi pendapatan di jurnal'
                  : 'Tidak ada pendapatan di bulan ini'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayedEntries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
