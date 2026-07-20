import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TradingSignal } from '@/shared/utils/indicators';
import { useExecutePaperTrade } from '../hooks/useTrading';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { usePortfolioSummary } from '../hooks/useTradingPortfolio';
import { Button } from '@/shared/ui/Button';
import { formatCurrency } from '@/shared/utils/formatCurrency';

interface Props {
  coinId: string;
  coinSymbol: string;
  coinName: string;
  currentPriceUSD: number;
  usdToIdr: number;
  signal: TradingSignal;
  onSuccess?: () => void;
}

export function PaperTradeForm({ coinId, coinSymbol, coinName, currentPriceUSD, usdToIdr, signal, onSuccess }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data: summary } = usePortfolioSummary();
  const executeMutation = useExecutePaperTrade();

  const [side, setSide] = useState<'buy' | 'sell'>(signal === 'SELL' ? 'sell' : 'buy');
  const [amountIDR, setAmountIDR] = useState('');
  const [notes, setNotes] = useState('');

  const priceIDR = currentPriceUSD * usdToIdr;
  const amount = parseFloat(amountIDR.replace(/\./g, '').replace(',', '.')) || 0;
  const units = amount > 0 && priceIDR > 0 ? amount / priceIDR : 0;

  // 5% allocation budget
  const budget5pct = summary ? summary.totalValueIDR * 0.05 : 0;

  const handleSubmit = async () => {
    if (!user || amount <= 0) return;
    await executeMutation.mutateAsync({
      userId: user.id,
      coinId,
      coinSymbol,
      coinName,
      side,
      priceUSD: currentPriceUSD,
      entryPriceUSD: currentPriceUSD,
      stopLossUSD: undefined,
      takeProfitUSD: undefined,
      leverage: 1,
      exchangeRateToIDR: usdToIdr,
      amountIDR: amount,
      effectiveAmountIDR: amount,
      units,
      signal: signal as 'BUY' | 'SELL' | 'HOLD',
      notes: notes || undefined,
      date: new Date(),
    });
    setAmountIDR('');
    setNotes('');
    onSuccess?.();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Side toggle */}
      <div style={{ display: 'flex', background: 'var(--bg-raised)', borderRadius: 10, padding: 3, gap: 3, border: '1px solid var(--border-default)' }}>
        {(['buy', 'sell'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: '13px', transition: 'all 150ms', fontFamily: 'var(--font-sans)',
              background: side === s ? (s === 'buy' ? 'var(--gain-500)' : 'var(--loss-500)') : 'transparent',
              color: side === s ? '#fff' : 'var(--text-muted)',
            }}
          >
            {s === 'buy' ? `▲ ${t('trading.paperTrade.buy')}` : `▼ ${t('trading.paperTrade.sell')}`}
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('trading.paperTrade.price', { symbol: coinSymbol })}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
            {formatCurrency(priceIDR)}
          </p>
        </div>
        <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
          <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('trading.paperTrade.budget')}</p>
          <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--blue-400)' }}>
            {formatCurrency(budget5pct)}
          </p>
        </div>
      </div>

      {/* Amount input */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>
          {t('trading.paperTrade.amount')}
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={amountIDR}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9]/g, '');
            setAmountIDR(raw ? parseInt(raw).toLocaleString('id-ID') : '');
          }}
          placeholder="Rp 0"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
            borderRadius: 8, padding: '0 14px', height: 40,
            fontSize: '14px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        {units > 0 && (
          <p style={{ margin: '5px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            ≈ {units.toFixed(6)} {coinSymbol}
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 6 }}>
          {t('trading.paperTrade.notes')}
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('trading.paperTrade.notesPlaceholder')}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-raised)', border: '1px solid var(--border-default)',
            borderRadius: 8, padding: '0 14px', height: 36,
            fontSize: '13px', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      <Button
        onClick={handleSubmit}
        loading={executeMutation.isPending}
        disabled={amount <= 0}
        fullWidth
      >
        {side === 'buy' ? `▲ ${t('trading.paperTrade.executeBuy')}` : `▼ ${t('trading.paperTrade.executeSell')}`}
      </Button>
    </div>
  );
}
