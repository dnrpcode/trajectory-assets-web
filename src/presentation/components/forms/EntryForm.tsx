import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AssetCategory } from '../../../shared/types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { NumericInput } from '../ui/NumericInput';
import { ALL_CATEGORIES } from '../../../shared/constants/categories';
import { ALL_PLATFORMS } from '../../../shared/constants/platforms';
import { useCreateEntry } from '../../hooks/useEntries';
import { useAuthStore } from '../../hooks/useAuth';
import { useThemeContext } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../../shared/utils/formatCurrency';

const formEntryTypes = [
  'new_position',
  'price_update',
  'top_up',
  'partial_sell',
  'full_sell',
  'income',
  'fee',
] as const;

type FormEntryType = (typeof formEntryTypes)[number];

const INCOME_FEE_CATEGORY_VALUES = [
  'dividend', 'coupon', 'interest', 'platform_fee', 'tax', 'other',
] as const;

const baseSchema = z.object({
  entryType: z.enum(formEntryTypes),
  assetId: z.string().optional(),
  assetName: z.string().min(1, 'Nama aset wajib diisi'),
  ticker: z.string().optional(),
  category: z.enum(['saham', 'reksa_dana', 'obligasi_sbn', 'emas', 'kripto', 'cash', 'lainnya']),
  platform: z.string().min(1, 'Platform wajib diisi'),
  currency: z.string().default('IDR'),
  exchangeRateToIDR: z.coerce.number().optional(),
  pricePerUnit: z.coerce.number().optional(),
  units: z.coerce.number().optional(),
  amount: z.coerce.number().optional(),
  incomeFeeCategory: z.enum(['dividend', 'coupon', 'interest', 'platform_fee', 'tax', 'other']).optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  notes: z.string().optional(),
});

const schema = baseSchema
  .refine(
    (d) => d.currency === 'IDR' || (d.exchangeRateToIDR != null && d.exchangeRateToIDR > 0),
    { message: 'Kurs ke IDR wajib diisi (> 0)', path: ['exchangeRateToIDR'] },
  )
  .refine(
    (d) => {
      const needs = ['new_position', 'price_update', 'top_up', 'partial_sell', 'full_sell'].includes(d.entryType);
      return !needs || (d.pricePerUnit != null && d.pricePerUnit > 0);
    },
    { message: 'Harga per unit wajib diisi', path: ['pricePerUnit'] },
  )
  .refine(
    (d) => {
      const needs = ['new_position', 'top_up', 'partial_sell'].includes(d.entryType);
      return !needs || (d.units != null && d.units > 0);
    },
    { message: 'Jumlah unit wajib diisi', path: ['units'] },
  )
  .refine(
    (d) => {
      const needs = ['income', 'fee'].includes(d.entryType);
      return !needs || (d.amount != null && d.amount > 0);
    },
    { message: 'Jumlah wajib diisi', path: ['amount'] },
  );

type FormValues = z.infer<typeof baseSchema>;


interface Props {
  onSuccess: () => void;
  defaultEntryType?: FormEntryType;
  defaultAssetId?: string;
  defaultAssetName?: string;
  defaultCategory?: AssetCategory;
  defaultPlatform?: string;
  isExistingAsset?: boolean;
}

// Shared label style for the form
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--text-xs)',
  fontWeight: 'var(--weight-semibold)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-caps)',
  color: 'var(--text-secondary)',
  marginBottom: '6px',
};

const selectStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-raised)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  padding: '0 14px',
  height: '40px',
  fontSize: 'var(--text-sm)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235c738f' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: '32px',
};

export function EntryForm({
  onSuccess,
  defaultEntryType = 'new_position',
  defaultAssetId,
  defaultAssetName = '',
  defaultCategory,
  defaultPlatform = '',
  isExistingAsset = false,
}: Props) {
  const { t } = useTranslation();
  const { theme } = useThemeContext();
  const user = useAuthStore((s) => s.user);
  const { mutateAsync, isPending } = useCreateEntry();

  const ENTRY_TYPE_LABELS: Record<FormEntryType, string> = {
    new_position: t('entry.new_position'),
    price_update: t('entry.price_update'),
    top_up:       t('entry.top_up'),
    partial_sell: t('entry.partial_sell'),
    full_sell:    t('entry.full_sell'),
    income:       t('entry.income'),
    fee:          t('entry.fee'),
  };

  const INCOME_FEE_CATEGORIES = INCOME_FEE_CATEGORY_VALUES.map((v) => ({
    value: v,
    label: t(`entry.${v}`),
  }));

  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      entryType: defaultEntryType,
      assetId: defaultAssetId || '',
      assetName: defaultAssetName || '',
      ticker: '',
      category: defaultCategory || 'saham',
      platform: defaultPlatform || '',
      currency: 'IDR',
      date: today,
      notes: '',
      incomeFeeCategory: 'dividend',
    },
  });

  const entryType = watch('entryType');
  const currency = watch('currency');
  const watchedPrice = watch('pricePerUnit');
  const watchedUnits = watch('units');

  const needsPrice   = ['new_position', 'price_update', 'top_up', 'partial_sell', 'full_sell'].includes(entryType);
  const needsUnits   = ['new_position', 'top_up', 'partial_sell'].includes(entryType);
  const needsAmount  = ['income', 'fee'].includes(entryType);
  const needsIncomeCategory = needsAmount;
  const showAssetFields = !isExistingAsset;

  const onSubmit = async (data: FormValues) => {
    if (!user) return;

    const dateObj = new Date(data.date + 'T12:00:00'); // avoid timezone off-by-one
    const month = data.date.substring(0, 7);
    const assetId =
      data.assetId ||
      `${user.id}_${data.assetName.replace(/\s+/g, '_').toLowerCase()}_${data.category}`;

    // Build input — all required fields must be present; optional ones conditional
    const input = {
      userId: user.id,
      assetId: assetId || undefined,
      assetName: data.assetName,
      ticker: data.ticker || undefined,
      category: data.category,
      platform: data.platform,
      entryType: data.entryType,
      month,
      currency: data.currency,
      exchangeRateToIDR: data.currency === 'IDR' ? 1 : data.exchangeRateToIDR!,
      pricePerUnit: data.pricePerUnit || undefined,
      units: data.units || undefined,
      amount: data.amount || undefined,
      incomeFeeCategory: (data.incomeFeeCategory && needsIncomeCategory) ? data.incomeFeeCategory : undefined,
      notes: data.notes || undefined,
      isCorrected: false,
      date: dateObj,
    };

    await mutateAsync(input);
    onSuccess();
  };

  const availableTypes: FormEntryType[] = isExistingAsset
    ? ['price_update', 'top_up', 'partial_sell', 'full_sell', 'income', 'fee']
    : [...formEntryTypes];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Entry Type */}
      <div>
        <label style={labelStyle}>{t('entry.type')}</label>
        <select {...register('entryType')} style={selectStyle}>
          {availableTypes.map((t) => (
            <option key={t} value={t} style={{ background: 'var(--bg-raised)' }}>
              {ENTRY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {/* Asset fields */}
      {showAssetFields && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>{t('entry.assetName')} *</label>
              <input
                type="text"
                placeholder={t('entry.assetNamePlaceholder')}
                {...register('assetName')}
                style={{
                  width: '100%',
                  background: 'var(--bg-raised)',
                  border: `1px solid ${errors.assetName ? 'var(--loss-500)' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '0 14px',
                  height: '40px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-400)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.assetName ? 'var(--loss-500)' : 'var(--border-default)'; }}
              />
              {errors.assetName && <p className="text-xs mt-1" style={{ color: 'var(--loss-400)' }}>{errors.assetName.message}</p>}
            </div>
            <Input
              label={t('entry.ticker')}
              placeholder={t('entry.tickerPlaceholder')}
              {...register('ticker')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>{t('entry.category')} *</label>
              <select {...register('category')} style={selectStyle}>
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} style={{ background: 'var(--bg-raised)' }}>
                    {t(`category.${cat}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{t('entry.platform')} *</label>
              <select {...register('platform')} style={selectStyle}>
                <option value="" style={{ background: 'var(--bg-raised)' }}>{t('entry.platform')}</option>
                {ALL_PLATFORMS.map((p) => (
                  <option key={p} value={p} style={{ background: 'var(--bg-raised)' }}>
                    {p}
                  </option>
                ))}
              </select>
              {errors.platform && (
                <p className="text-xs mt-1" style={{ color: 'var(--loss-400)' }}>{errors.platform.message}</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Date */}
      <div>
        <label style={labelStyle}>{t('entry.date')} *</label>
        <input
          type="date"
          {...register('date')}
          style={{
            width: '100%',
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '0 14px',
            height: '40px',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            cursor: 'pointer',
            colorScheme: theme,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-400)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
        />
        {errors.date && <p className="text-xs mt-1" style={{ color: 'var(--loss-400)' }}>{errors.date.message}</p>}
      </div>

      {/* Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label style={labelStyle}>{t('entry.currency')}</label>
          <select {...register('currency')} style={selectStyle}>
            {['IDR', 'USD', 'EUR', 'SGD'].map((c) => (
              <option key={c} value={c} style={{ background: 'var(--bg-raised)' }}>{c}</option>
            ))}
          </select>
        </div>
        {currency !== 'IDR' && (
          <Controller
            name="exchangeRateToIDR"
            control={control}
            render={({ field }) => (
              <NumericInput
                label={`${t('entry.exchangeRate')} *`}
                placeholder="cth: 15.800"
                error={errors.exchangeRateToIDR?.message}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
        )}
      </div>

      {/* Price per unit */}
      {needsPrice && (
        <Controller
          name="pricePerUnit"
          control={control}
          render={({ field }) => (
            <NumericInput
              label={`${t('entry.pricePerUnit')} (${currency}) *`}
              placeholder="0"
              prefix={currency === 'IDR' ? 'Rp' : currency}
              allowDecimal
              error={errors.pricePerUnit?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      )}

      {/* Units */}
      {needsUnits && (
        <Controller
          name="units"
          control={control}
          render={({ field }) => (
            <NumericInput
              label={`${t('entry.units')} *`}
              placeholder="0"
              allowDecimal
              error={errors.units?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      )}

      {/* Total estimate: price × units */}
      {needsPrice && needsUnits && watchedPrice && watchedUnits && watchedPrice > 0 && watchedUnits > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-dim)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {watchedUnits.toLocaleString('id-ID', { maximumFractionDigits: 8 })} unit
            {' × '}
            {currency !== 'IDR' ? currency + ' ' : 'Rp '}
            {watchedPrice.toLocaleString('id-ID', { maximumFractionDigits: 8 })}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {currency === 'IDR'
              ? formatCurrency(watchedPrice * watchedUnits)
              : `${currency} ${(watchedPrice * watchedUnits).toLocaleString('id-ID', { maximumFractionDigits: 4 })}`}
          </span>
        </div>
      )}

      {/* Income / fee category */}
      {needsIncomeCategory && (
        <div>
          <label style={labelStyle}>{entryType === 'income' ? t('entry.incomeCategory') : t('entry.feeCategory')}</label>
          <select {...register('incomeFeeCategory')} style={selectStyle}>
            {INCOME_FEE_CATEGORIES
              .filter((c) => entryType === 'income'
                ? !['platform_fee', 'tax'].includes(c.value)
                : ['platform_fee', 'tax', 'other'].includes(c.value),
              )
              .map((c) => (
                <option key={c.value} value={c.value} style={{ background: 'var(--bg-raised)' }}>
                  {c.label}
                </option>
              ))}
          </select>
        </div>
      )}

      {/* Amount for income/fee */}
      {needsAmount && (
        <Controller
          name="amount"
          control={control}
          render={({ field }) => (
            <NumericInput
              label={`${t('entry.amount')} (${currency}) *`}
              placeholder="0"
              prefix={currency === 'IDR' ? 'Rp' : currency}
              error={errors.amount?.message}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      )}

      {/* Notes */}
      <div>
        <label style={labelStyle}>{t('entry.notes')}</label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder={t('entry.notesPlaceholder')}
          className="w-full rounded-md text-sm resize-none outline-none transition-[border-color] duration-150"
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
            padding: '10px 14px',
            fontFamily: 'var(--font-sans)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--blue-400)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
        />
      </div>

      <Button type="submit" loading={isPending} fullWidth size="lg">
        {t('entry.save')}
      </Button>
    </form>
  );
}
