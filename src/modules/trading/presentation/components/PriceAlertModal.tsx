import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { NumericInput } from '@/shared/ui/NumericInput';
import { useCreatePriceAlert, requestNotificationPermission } from '../hooks/usePriceAlerts';
import type { AlertMetric, AlertCondition } from '../../domain/entities/PriceAlert';

interface Props {
  open: boolean;
  onClose: () => void;
  coinId: string;
  coinSymbol: string;
  coinName: string;
  currentPriceUSD: number;
  currentRsi?: number;
}

export function PriceAlertModal({ open, onClose, coinId, coinSymbol, coinName, currentPriceUSD, currentRsi }: Props) {
  const { t } = useTranslation();
  const createAlert = useCreatePriceAlert();
  const [metric, setMetric] = useState<AlertMetric>('price');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [threshold, setThreshold] = useState<number | undefined>(currentPriceUSD);

  useEffect(() => {
    if (!open) return;
    setMetric('price');
    setCondition('above');
    setThreshold(currentPriceUSD);
  }, [open, currentPriceUSD]);

  const switchMetric = (m: AlertMetric) => {
    setMetric(m);
    setThreshold(m === 'price' ? currentPriceUSD : (currentRsi ?? 50));
  };

  const handleSubmit = async () => {
    if (threshold === undefined) return;
    await requestNotificationPermission();
    await createAlert.mutateAsync({ coinId, coinSymbol, coinName, metric, condition, threshold });
    onClose();
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-sans)',
    background: active ? 'var(--blue-500)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)', transition: 'all 120ms',
  });

  return (
    <Modal open={open} onClose={onClose} title={t('trading.alerts.createTitle', { symbol: coinSymbol })} size="sm">
      <div className="px-6 py-5 space-y-4">
        {/* Metric */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>
            {t('trading.alerts.metricLabel')}
          </label>
          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 10, padding: 3, gap: 3, border: '1px solid var(--border-default)' }}>
            <button type="button" onClick={() => switchMetric('price')} style={tabStyle(metric === 'price')}>
              {t('trading.alerts.metric.price')}
            </button>
            <button type="button" onClick={() => switchMetric('rsi')} style={tabStyle(metric === 'rsi')}>
              {t('trading.alerts.metric.rsi')}
            </button>
          </div>
        </div>

        {/* Condition */}
        <div>
          <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>
            {t('trading.alerts.conditionLabel')}
          </label>
          <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 10, padding: 3, gap: 3, border: '1px solid var(--border-default)' }}>
            <button type="button" onClick={() => setCondition('above')} style={tabStyle(condition === 'above')}>
              {t('trading.alerts.condition.above')}
            </button>
            <button type="button" onClick={() => setCondition('below')} style={tabStyle(condition === 'below')}>
              {t('trading.alerts.condition.below')}
            </button>
          </div>
        </div>

        {/* Threshold */}
        <NumericInput
          label={metric === 'price' ? t('trading.alerts.priceThreshold') : t('trading.alerts.rsiThreshold')}
          prefix={metric === 'price' ? '$' : undefined}
          allowDecimal
          value={threshold}
          onChange={setThreshold}
        />

        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {t('trading.alerts.foregroundNote')}
        </p>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" variant="primary" loading={createAlert.isPending} disabled={threshold === undefined} onClick={handleSubmit}>
            {t('trading.alerts.create')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
