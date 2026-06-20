import { useState, useMemo } from 'react';
import { CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Resolver } from 'react-hook-form';
import { Layout } from '@/shared/ui/Layout';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { NumericInput } from '@/shared/ui/NumericInput';
import { Spinner } from '@/shared/ui/Spinner';
import { cn } from '@/shared/utils/cn';
import { formatCurrency, formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import { formatDate } from '@/shared/utils/formatDate';
import { CATEGORY_LABELS } from '@/shared/constants/categories';
import { useIncomeEvents, useCreateIncomeEvent, useDeleteIncomeEvent, useMarkEventReceived } from '../hooks/useIncome';
import { useActiveAssets } from '@/modules/portfolio/presentation/hooks/useAssets';
import type { IncomeEvent, IncomeEventType } from '../../domain/entities/IncomeEvent';
import type { Asset } from '@/modules/portfolio/domain/entities/Asset';
import type { AssetCategory } from '@/shared/types';

// ─── EventType config ──────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<IncomeEventType, string> = {
  dividend: 'Dividen',
  coupon: 'Kupon',
  interest: 'Bunga',
  other: 'Lainnya',
};

const EVENT_TYPE_COLORS: Record<IncomeEventType, string> = {
  dividend: 'var(--gain-500)',
  coupon: 'var(--blue-400)',
  interest: '#a855f7',
  other: 'var(--text-muted)',
};

const EVENT_TYPE_DOT_BG: Record<IncomeEventType, string> = {
  dividend: 'var(--gain-500)',
  coupon: 'var(--blue-400)',
  interest: '#a855f7',
  other: 'var(--text-muted)',
};

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  assetId: z.string().min(1, 'Pilih aset'),
  assetName: z.string().min(1),
  ticker: z.string().optional(),
  category: z.enum(['saham', 'reksa_dana', 'obligasi_sbn', 'emas', 'kripto', 'cash', 'lainnya']),
  eventType: z.enum(['dividend', 'coupon', 'interest', 'other']),
  paymentDate: z.string().min(1, 'Tanggal pembayaran wajib diisi'),
  exDate: z.string().optional(),
  estimatedAmountIDR: z.number().optional(),
  currency: z.string().default('IDR'),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const DAY_HEADERS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  // Shift so Monday=0: Sun(0) → 6, Mon(1) → 0, …, Sat(6) → 5
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

// ─── Add Event Form ───────────────────────────────────────────────────────────

interface AddEventFormProps {
  assets: Asset[];
  onSuccess: () => void;
}

function AddEventForm({ assets, onSuccess }: AddEventFormProps) {
  const { mutate: create, isPending } = useCreateIncomeEvent();
  const [assetSearch, setAssetSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      currency: 'IDR',
      eventType: 'dividend',
      category: 'saham',
    },
  });

  const selectedAssetId = watch('assetId');

  const filteredAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          a.assetName.toLowerCase().includes(assetSearch.toLowerCase()) ||
          (a.ticker && a.ticker.toLowerCase().includes(assetSearch.toLowerCase())),
      ),
    [assets, assetSearch],
  );

  const handleSelectAsset = (asset: Asset) => {
    setValue('assetId', asset.id);
    setValue('assetName', asset.assetName);
    setValue('ticker', asset.ticker ?? '');
    setValue('category', asset.category);
    setAssetSearch(asset.assetName + (asset.ticker ? ` (${asset.ticker})` : ''));
    setShowDropdown(false);
  };

  const onSubmit = (data: FormValues) => {
    create(
      {
        assetId: data.assetId,
        assetName: data.assetName,
        ticker: data.ticker || undefined,
        category: data.category as AssetCategory,
        eventType: data.eventType as IncomeEventType,
        paymentDate: new Date(data.paymentDate + 'T12:00:00'),
        exDate: data.exDate ? new Date(data.exDate + 'T12:00:00') : undefined,
        estimatedAmountIDR: data.estimatedAmountIDR,
        currency: data.currency,
        notes: data.notes || undefined,
      },
      { onSuccess },
    );
  };

  const labelStyle = {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 'var(--tracking-caps)',
    color: 'var(--text-secondary)',
    display: 'block',
    marginBottom: 6,
  };

  const selectStyle = {
    width: '100%',
    height: 40,
    background: 'var(--bg-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font-sans)',
    padding: '0 14px',
    outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Asset picker */}
      <div className="relative">
        <label style={labelStyle}>Pilih Aset</label>
        <input
          type="text"
          value={assetSearch}
          onChange={(e) => { setAssetSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Cari nama atau ticker..."
          style={{ ...selectStyle, padding: '0 14px' }}
          className="w-full"
        />
        {showDropdown && filteredAssets.length > 0 && (
          <div
            className="absolute z-50 w-full mt-1 rounded-md overflow-y-auto max-h-44"
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
          >
            {filteredAssets.map((a) => (
              <button
                key={a.id}
                type="button"
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-hover)] transition-colors"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}
                onMouseDown={() => handleSelectAsset(a)}
              >
                <span className="font-medium">{a.assetName}</span>
                {a.ticker && <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{a.ticker}</span>}
                <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>{CATEGORY_LABELS[a.category]}</span>
              </button>
            ))}
          </div>
        )}
        {errors.assetId && (
          <p className="mt-1 text-xs" style={{ color: 'var(--loss-400)' }}>{errors.assetId.message}</p>
        )}
        {/* Hidden fields */}
        <input type="hidden" {...register('assetId')} />
        <input type="hidden" {...register('assetName')} />
        <input type="hidden" {...register('ticker')} />
        <input type="hidden" {...register('category')} />
      </div>

      {/* Event type */}
      <div>
        <label style={labelStyle}>Jenis</label>
        <select {...register('eventType')} style={selectStyle}>
          <option value="dividend">Dividen Saham</option>
          <option value="coupon">Kupon Obligasi</option>
          <option value="interest">Bunga</option>
          <option value="other">Lainnya</option>
        </select>
      </div>

      {/* Payment date */}
      <Input
        label="Tanggal Pembayaran"
        type="date"
        error={errors.paymentDate?.message}
        {...register('paymentDate')}
      />

      {/* Ex-date */}
      <Input
        label="Tanggal Ex-Date (opsional)"
        type="date"
        {...register('exDate')}
      />

      {/* Estimated amount */}
      <div>
        <label style={labelStyle}>Estimasi Penerimaan IDR (opsional)</label>
        <Controller
          name="estimatedAmountIDR"
          control={control}
          render={({ field }) => (
            <NumericInput
              allowDecimal={false}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              prefix="Rp"
              placeholder="0"
            />
          )}
        />
      </div>

      {/* Notes */}
      <Input
        label="Catatan (opsional)"
        placeholder="Opsional..."
        {...register('notes')}
      />

      {!selectedAssetId && (
        <input type="hidden" value="" {...register('assetId')} />
      )}

      <Button type="submit" loading={isPending} fullWidth>
        Simpan Jadwal
      </Button>
    </form>
  );
}

// ─── Event Row ────────────────────────────────────────────────────────────────

interface EventRowProps {
  event: IncomeEvent;
  onDelete: (id: string) => void;
  onMarkReceived: (id: string) => void;
}

function EventRow({ event, onDelete, onMarkReceived }: EventRowProps) {
  const color = EVENT_TYPE_COLORS[event.eventType];

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
            {event.assetName}
          </span>
          {event.ticker && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)' }}
            >
              {event.ticker}
            </span>
          )}
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border-dim)' }}
          >
            {CATEGORY_LABELS[event.category]}
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color, background: `${color}18`, border: `1px solid ${color}44` }}
          >
            {EVENT_TYPE_LABELS[event.eventType]}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Bayar: <span style={{ color: 'var(--text-secondary)' }}>{formatDate(event.paymentDate)}</span>
          </span>
          {event.exDate && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Ex-date: <span style={{ color: 'var(--text-secondary)' }}>{formatDate(event.exDate)}</span>
            </span>
          )}
          {event.estimatedAmountIDR != null && (
            <span className="text-xs font-mono" style={{ color: 'var(--gain-400)' }}>
              {formatCurrency(event.estimatedAmountIDR)}
            </span>
          )}
        </div>

        {event.notes && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{event.notes}</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        {event.status === 'upcoming' ? (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: 'var(--warn-400)', background: 'var(--warn-tint)', border: '1px solid rgba(245,158,11,0.25)' }}
          >
            Mendatang
          </span>
        ) : (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ color: 'var(--gain-400)', background: 'var(--gain-tint)', border: '1px solid rgba(15,186,130,0.25)' }}
          >
            Diterima
          </span>
        )}

        {event.status === 'upcoming' && (
          <button
            onClick={() => onMarkReceived(event.id)}
            className="text-xs font-medium px-2 py-1 rounded-md transition-colors"
            style={{
              background: 'var(--bg-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-dim)',
            }}
          >
            Tandai Diterima
          </button>
        )}

        <button
          onClick={() => onDelete(event.id)}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-colors hover:bg-[var(--loss-tint)]"
          style={{ color: 'var(--text-muted)' }}
          title="Hapus"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function IncomePage() {
  const { data: events = [], isLoading } = useIncomeEvents();
  const { data: assets = [] } = useActiveAssets();
  const { mutate: deleteEvent } = useDeleteIncomeEvent();
  const { mutate: markReceived } = useMarkEventReceived();

  const [addModalOpen, setAddModalOpen] = useState(false);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const thisMonth = useMemo(() => {
    const y = today.getFullYear();
    const m = today.getMonth();
    return events
      .filter((e) => e.status === 'upcoming' && e.paymentDate.getFullYear() === y && e.paymentDate.getMonth() === m)
      .reduce((sum, e) => sum + (e.estimatedAmountIDR ?? 0), 0);
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  const thisYear = useMemo(() => {
    const y = today.getFullYear();
    return events
      .filter((e) => e.status === 'upcoming' && e.paymentDate.getFullYear() === y)
      .reduce((sum, e) => sum + (e.estimatedAmountIDR ?? 0), 0);
  }, [events]); // eslint-disable-line react-hooks/exhaustive-deps

  const upcomingCount = useMemo(() => events.filter((e) => e.status === 'upcoming').length, [events]);

  // ── Calendar ───────────────────────────────────────────────────────────────
  const calendarDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, IncomeEvent[]> = {};
    for (const e of events) {
      if (e.paymentDate.getFullYear() === calYear && e.paymentDate.getMonth() === calMonth) {
        const d = e.paymentDate.getDate();
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    }
    return map;
  }, [events, calYear, calMonth]);

  const displayedEvents = useMemo(() => {
    if (selectedDay !== null) {
      return eventsByDay[selectedDay] ?? [];
    }
    const monthEvents: IncomeEvent[] = [];
    for (const d of Object.keys(eventsByDay)) {
      monthEvents.push(...eventsByDay[Number(d)]);
    }
    return monthEvents.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  }, [eventsByDay, selectedDay]);

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
            Jadwal penerimaan dividen, kupon, dan bunga investasi kamu
          </p>
        </div>
        <Button
          onClick={() => setAddModalOpen(true)}
          icon={<Plus size={14} strokeWidth={2.5} />}
        >
          + Tambah Jadwal
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Bulan Ini', value: formatCurrencyCompact(thisMonth), mono: true },
          { label: 'Tahun Ini', value: formatCurrencyCompact(thisYear), mono: true },
          { label: 'Belum Diterima', value: upcomingCount.toString(), mono: false },
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

      {/* Calendar + events grid */}
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
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }
              const isToday = calYear === todayYear && calMonth === todayMonth && day === todayDay;
              const isSelected = day === selectedDay;
              const dayEvents = eventsByDay[day] ?? [];
              const hasEvents = dayEvents.length > 0;

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
                      color: isSelected
                        ? 'var(--blue-300)'
                        : isToday
                        ? 'var(--blue-400)'
                        : 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="flex gap-0.5 mt-1 flex-wrap justify-center max-w-full px-0.5">
                      {dayEvents.slice(0, 3).map((e, i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: EVENT_TYPE_DOT_BG[e.eventType] }}
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
            {(Object.keys(EVENT_TYPE_LABELS) as IncomeEventType[]).map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: EVENT_TYPE_DOT_BG[t] }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{EVENT_TYPE_LABELS[t]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Events list */}
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
          ) : displayedEvents.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-10 rounded-[var(--card-radius)]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              <CalendarDays size={28} className="mb-2 opacity-40" />
              <p className="text-sm">Belum ada jadwal bulan ini</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {displayedEvents.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onDelete={(id) => deleteEvent(id)}
                  onMarkReceived={(id) => markReceived(id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Jadwal Pendapatan"
        size="md"
      >
        <AddEventForm
          assets={assets}
          onSuccess={() => setAddModalOpen(false)}
        />
      </Modal>
    </Layout>
  );
}
