import { useTranslation } from 'react-i18next';
import { Bell, Trash2, CheckCircle2 } from 'lucide-react';
import { useCoinPriceAlerts, useDeletePriceAlert } from '../hooks/usePriceAlerts';

interface Props {
  coinId: string;
}

export function AlertsList({ coinId }: Props) {
  const { t } = useTranslation();
  const alerts = useCoinPriceAlerts(coinId);
  const deleteAlert = useDeletePriceAlert();

  if (alerts.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {alerts.map((alert) => (
        <div
          key={alert.id}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
            background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-subtle)',
            opacity: alert.active ? 1 : 0.6,
          }}
        >
          {alert.active ? (
            <Bell size={12} style={{ color: 'var(--blue-400)', flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={12} style={{ color: 'var(--gain-400)', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', flex: 1 }}>
            {t('trading.alerts.summary', {
              metric: t(`trading.alerts.metric.${alert.metric}`),
              condition: t(`trading.alerts.condition.${alert.condition}`),
              threshold: alert.metric === 'price' ? `$${alert.threshold.toLocaleString('en-US')}` : alert.threshold,
            })}
          </span>
          {!alert.active && (
            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--gain-400)' }}>{t('trading.alerts.triggered')}</span>
          )}
          <button
            onClick={() => deleteAlert.mutate(alert.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, flexShrink: 0 }}
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
