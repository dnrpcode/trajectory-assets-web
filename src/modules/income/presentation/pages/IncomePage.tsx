import { useState, useMemo, useEffect, useRef } from 'react';
import {
  CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight,
  Search, TrendingUp, AlertCircle, CheckCircle2, MinusCircle,
} from 'lucide-react';
import { Layout } from '@/shared/ui/Layout';
import { Spinner } from '@/shared/ui/Spinner';
import { useToast } from '@/shared/ui/Toast';
import { cn } from '@/shared/utils/cn';
import { formatDate } from '@/shared/utils/formatDate';
import {
  useDividendWatchlist,
  useWatchlistDividends,
  useAddToDividendWatchlist,
  useRemoveFromDividendWatchlist,
  useDividendRotationRoadmap,
} from '../hooks/useDividend';
import { DividendRotationRoadmap } from '../components/DividendRotationRoadmap';
import { searchDividendTicker } from '@/infrastructure/di/container';
import type { DividendInfo, DividendEvent } from '../../domain/entities/Dividend';

// ─── Consistency helpers ───────────────────────────────────────────────────────

function consistencyLabel(years: number, total: number): { text: string; color: string; bg: string; icon: React.ReactNode } {
  const ratio = years / total;
  if (ratio >= 0.8) return {
    text: `Rutin (${years}/${total} tahun)`,
    color: 'var(--gain-400)',
    bg: 'var(--gain-tint)',
    icon: <CheckCircle2 size={11} />,
  };
  if (ratio >= 0.4) return {
    text: `Semi-rutin (${years}/${total} tahun)`,
    color: 'var(--warn-400)',
    bg: 'var(--warn-tint)',
    icon: <MinusCircle size={11} />,
  };
  return {
    text: `Tidak rutin (${years}/${total} tahun)`,
    color: 'var(--loss-400)',
    bg: 'var(--loss-tint)',
    icon: <AlertCircle size={11} />,
  };
}

function formatYield(y: number) {
  return y.toFixed(2) + '%';
}

function formatPrice(price: number, currency: string) {
  if (currency === 'IDR') return `Rp ${price.toLocaleString('id-ID')}`;
  return `${currency} ${price.toLocaleString('id-ID')}`;
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

// ─── Ticker search ────────────────────────────────────────────────────────────

interface TickerSearchProps {
  watchlistTickers: string[];
  onAdd: (ticker: string) => void;
}

function TickerSearch({ watchlistTickers, onAdd }: TickerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ ticker: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchDividendTicker.execute(query);
        setResults(res);
        setOpen(true);
      } catch {
        setResults([]);
        toast('Pencarian gagal. Periksa koneksi dan coba lagi.', 'error');
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  const handleAdd = (ticker: string) => {
    onAdd(ticker);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" style={{ maxWidth: 340 }}>
      <div
        className="flex items-center gap-2 rounded-[var(--radius-md)] px-3"
        style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-default)',
          height: 38,
        }}
      >
        {searching ? <Spinner size="sm" /> : <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Cari saham IDX (contoh: BBCA, TLKM)..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
        />
      </div>

      {open && results.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 rounded-[var(--radius-md)] overflow-hidden"
          style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
        >
          {results.map((r) => {
            const already = watchlistTickers.includes(r.ticker);
            return (
              <button
                key={r.ticker}
                onMouseDown={() => !already && handleAdd(r.ticker)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors',
                  already ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[var(--bg-hover)]',
                )}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--blue-tint-2)', color: 'var(--blue-300)' }}>
                    {r.ticker}
                  </span>
                  <span className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{r.name}</span>
                </div>
                {already
                  ? <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>Sudah ditambahkan</span>
                  : <Plus size={13} style={{ color: 'var(--blue-400)', flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Stock card in watchlist panel ────────────────────────────────────────────

interface StockCardProps {
  info: DividendInfo;
  isSelected: boolean;
  onClick: () => void;
  onRemove: () => void;
}

function StockCard({ info, isSelected, onClick, onRemove }: StockCardProps) {
  const consistency = consistencyLabel(info.consistentYears, info.totalYearsChecked);

  return (
    <div
      onClick={onClick}
      className="rounded-[var(--radius-md)] p-3 cursor-pointer transition-colors"
      style={{
        background: isSelected ? 'var(--blue-tint-2)' : 'var(--bg-raised)',
        border: isSelected ? '1px solid rgba(77,124,255,0.35)' : '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-mono font-bold text-sm" style={{ color: isSelected ? 'var(--blue-300)' : 'var(--text-primary)' }}>
              {info.ticker}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{info.name}</p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-[var(--loss-tint)] flex-shrink-0 mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {info.trailingYield > 0 && (
          <span className="text-xs font-mono font-semibold" style={{ color: 'var(--gain-400)' }}>
            {formatYield(info.trailingYield)} yield
          </span>
        )}
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1"
          style={{ color: consistency.color, background: consistency.bg }}
        >
          {consistency.icon}
          {consistency.text}
        </span>
      </div>

      {info.lastDividend && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
          Terakhir: <span style={{ color: 'var(--text-secondary)' }}>
            {formatPrice(info.lastDividend.amount, info.currency)}/lembar · {formatDate(info.lastDividend.date)}
          </span>
        </p>
      )}
    </div>
  );
}

// ─── Dividend history table ────────────────────────────────────────────────────

interface DividendDetailProps {
  info: DividendInfo;
}

function DividendDetail({ info }: DividendDetailProps) {
  const consistency = consistencyLabel(info.consistentYears, info.totalYearsChecked);
  const sorted = [...info.events].reverse();

  return (
    <div
      className="rounded-[var(--card-radius)] p-5"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <TrendingUp size={16} style={{ color: 'var(--blue-400)' }} />
            <span className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{info.ticker}</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{info.name}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Harga saat ini</p>
          <p className="font-mono font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {formatPrice(info.currentPrice, info.currency)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-md p-3" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
          <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Yield Trailing 12 Bulan</p>
          <p className="font-mono font-bold text-lg" style={{ color: info.trailingYield > 0 ? 'var(--gain-400)' : 'var(--text-muted)' }}>
            {info.trailingYield > 0 ? formatYield(info.trailingYield) : '—'}
          </p>
        </div>
        <div className="rounded-md p-3" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}>
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Konsistensi Dividen</p>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"
            style={{ color: consistency.color, background: consistency.bg }}
          >
            {consistency.icon}
            {consistency.text}
          </span>
        </div>
      </div>

      {/* History */}
      <p className="text-xs font-semibold uppercase mb-2" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>
        Riwayat Pembagian Dividen
      </p>
      {sorted.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Tidak ada riwayat dividen</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto pr-1">
          {sorted.map((ev, i) => {
            const yieldPct = info.currentPrice > 0 ? (ev.amount / info.currentPrice) * 100 : null;
            return (
              <div
                key={i}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-md"
                style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-dim)' }}
              >
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{formatDate(ev.date)}</span>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-xs font-semibold" style={{ color: 'var(--gain-400)' }}>
                    {formatPrice(ev.amount, info.currency)}/lbr
                  </span>
                  {yieldPct != null && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {yieldPct.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pending ticker skeleton ───────────────────────────────────────────────────

function LoadingCard({ ticker }: { ticker: string }) {
  return (
    <div className="rounded-[var(--radius-md)] p-3 animate-pulse" style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-muted)' }}>{ticker}</span>
        <Spinner size="sm" />
      </div>
      <div className="h-3 rounded w-3/4" style={{ background: 'var(--bg-hover)' }} />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const PALETTE = ['var(--gain-500)', 'var(--blue-400)', '#a855f7', 'var(--warn-400)', '#f43f5e', '#06b6d4', '#f97316'];

export function IncomePage() {
  const { data: watchlist = [], isLoading: watchlistLoading } = useDividendWatchlist();
  const { mutate: add } = useAddToDividendWatchlist();
  const { mutate: remove } = useRemoveFromDividendWatchlist();

  const tickers = useMemo(() => watchlist.map((w) => w.ticker), [watchlist]);
  const { data: infos = [], isLoading: infosLoading } = useWatchlistDividends(tickers);

  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const selectedInfo = infos.find((i) => i.ticker === selectedTicker) ?? null;

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Map date → events for calendar month
  const eventsByDay = useMemo(() => {
    const map: Record<number, { ticker: string; event: DividendEvent }[]> = {};
    for (const info of infos) {
      for (const ev of info.events) {
        if (ev.date.getFullYear() === calYear && ev.date.getMonth() === calMonth) {
          const d = ev.date.getDate();
          if (!map[d]) map[d] = [];
          map[d].push({ ticker: info.ticker, event: ev });
        }
      }
    }
    return map;
  }, [infos, calYear, calMonth]);

  // All events for the month sorted by date
  const monthEvents = useMemo(() => {
    const all: { ticker: string; event: DividendEvent }[] = [];
    for (const d of Object.keys(eventsByDay)) all.push(...eventsByDay[Number(d)]);
    return all.sort((a, b) => a.event.date.getTime() - b.event.date.getTime());
  }, [eventsByDay]);

  const dayEvents = selectedDay !== null ? (eventsByDay[selectedDay] ?? []) : [];
  const displayedEvents = selectedDay !== null ? dayEvents : monthEvents;

  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

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

  const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

  const tickerColor = useMemo(() => {
    const map: Record<string, string> = {};
    tickers.forEach((t, i) => { map[t] = PALETTE[i % PALETTE.length]; });
    return map;
  }, [tickers]);

  const loadingTickers = watchlistLoading ? [] : tickers.filter((t) => !infos.some((i) => i.ticker === t));
  const rotationRoadmap = useDividendRotationRoadmap(infos);

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays size={22} style={{ color: 'var(--blue-400)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
              Kalender Dividen &amp; Kupon
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Pantau jadwal dividen emiten IDX · yield · konsistensi pembagian
          </p>
        </div>
        <TickerSearch watchlistTickers={tickers} onAdd={(t) => add(t)} />
      </div>

      {watchlistLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : tickers.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-[var(--card-radius)]"
          style={{ background: 'var(--bg-surface)', border: '1px dashed var(--border-default)' }}
        >
          <CalendarDays size={32} className="mb-3 opacity-30" />
          <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Belum ada saham dipantau</h3>
          <p className="text-sm text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Cari ticker saham IDX di atas untuk mulai memantau jadwal dividen dan yield-nya.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_340px] gap-5">

          {/* ── Left: watchlist ─────────────────────────────────── */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase mb-1" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>
              Watchlist ({tickers.length})
            </p>
            {loadingTickers.map((t) => <LoadingCard key={t} ticker={t} />)}
            {infos.map((info) => (
              <StockCard
                key={info.ticker}
                info={info}
                isSelected={selectedTicker === info.ticker}
                onClick={() => setSelectedTicker(selectedTicker === info.ticker ? null : info.ticker)}
                onRemove={() => { remove(info.ticker); if (selectedTicker === info.ticker) setSelectedTicker(null); }}
              />
            ))}
          </div>

          {/* ── Center: calendar ────────────────────────────────── */}
          <div
            className="rounded-[var(--card-radius)] p-5 h-fit"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-5">
              <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--bg-raised)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                <ChevronLeft size={16} />
              </button>
              <span className="font-semibold text-base" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
                {MONTH_NAMES_ID[calMonth]} {calYear}
              </span>
              <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[var(--bg-raised)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_HEADERS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>{d}</div>
              ))}
            </div>

            {/* Day cells */}
            {infosLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, idx) => {
                  if (day === null) return <div key={`e-${idx}`} />;
                  const isToday = calYear === todayY && calMonth === todayM && day === todayD;
                  const isSelected = day === selectedDay;
                  const dayEvs = eventsByDay[day] ?? [];
                  const hasEvs = dayEvs.length > 0;

                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={cn(
                        'flex flex-col items-center justify-start pt-1.5 pb-1 rounded-lg min-h-[52px] transition-colors duration-150',
                        isSelected ? 'bg-[var(--blue-tint-2)]' : 'hover:bg-[var(--bg-raised)]',
                      )}
                      style={{ outline: isToday ? '2px solid var(--blue-400)' : 'none', outlineOffset: '-2px' }}
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
                      {hasEvs && (
                        <div className="flex gap-0.5 mt-1 flex-wrap justify-center px-0.5">
                          {dayEvs.slice(0, 4).map((e, i) => (
                            <span
                              key={i}
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: tickerColor[e.ticker] ?? 'var(--text-muted)' }}
                              title={e.ticker}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Legend */}
            {infos.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {infos.map((info) => (
                  <div key={info.ticker} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: tickerColor[info.ticker] }} />
                    <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{info.ticker}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: detail / event list ──────────────────────── */}
          <div className="flex flex-col gap-4">
            {/* If a stock is selected, show its dividend detail */}
            {selectedInfo && <DividendDetail info={selectedInfo} />}

            {/* Events list for selected day or month */}
            <div
              className="rounded-[var(--card-radius)] p-4"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)', letterSpacing: 'var(--tracking-caps)' }}>
                  {selectedDay !== null
                    ? `${selectedDay} ${MONTH_NAMES_ID[calMonth]} ${calYear}`
                    : `${MONTH_NAMES_ID[calMonth]} ${calYear}`}
                </p>
                {selectedDay !== null && (
                  <button onClick={() => setSelectedDay(null)} className="text-xs" style={{ color: 'var(--blue-400)' }}>
                    Lihat semua
                  </button>
                )}
              </div>

              {displayedEvents.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>
                  Tidak ada pembagian dividen bulan ini
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {displayedEvents.map(({ ticker, event }, i) => {
                    const info = infos.find((x) => x.ticker === ticker);
                    const yieldPct = info && info.currentPrice > 0
                      ? (event.amount / info.currentPrice) * 100
                      : null;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 rounded-md p-2.5 cursor-pointer transition-colors"
                        onClick={() => setSelectedTicker(ticker === selectedTicker ? null : ticker)}
                        style={{
                          background: 'var(--bg-raised)',
                          border: '1px solid var(--border-dim)',
                          borderLeft: `3px solid ${tickerColor[ticker] ?? 'var(--border-dim)'}`,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-mono font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{ticker}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                              {formatDate(event.date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold" style={{ color: 'var(--gain-400)' }}>
                              {info ? formatPrice(event.amount, info.currency) : event.amount.toLocaleString('id-ID')}/lbr
                            </span>
                            {yieldPct != null && (
                              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{yieldPct.toFixed(2)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {tickers.length >= 2 && (
        <div className="mt-5">
          <DividendRotationRoadmap roadmap={rotationRoadmap} />
        </div>
      )}
    </Layout>
  );
}
