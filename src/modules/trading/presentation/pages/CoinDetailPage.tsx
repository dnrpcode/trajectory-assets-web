import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw, WifiOff, Clock, ServerCrash, Bell } from 'lucide-react';
import { CoinGeckoError, getCoinGeckoErrorMessage } from '../../data/CoinGeckoRepository';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Line } from 'recharts';
import { Layout } from '@/shared/ui/Layout';
import { Card } from '@/shared/ui/Card';
import { Skeleton } from '@/shared/ui/Skeleton';
import { SignalBadge } from '../components/SignalBadge';
import { SignalAnalysisCard } from '../components/SignalAnalysisCard';
import { TradeSetupCard } from '../components/TradeSetupCard';
import { BacktestPanel } from '../components/BacktestPanel';
import { PriceAlertModal } from '../components/PriceAlertModal';
import { AlertsList } from '../components/AlertsList';
import { PaperTradeForm } from '../components/PaperTradeForm';
import { useCoinDetail, useCoinMarkets, useWatchlist } from '../hooks/useTrading';
import { usePortfolioSummary } from '../hooks/useTradingPortfolio';
import { computeMA, computeRSI } from '@/shared/utils/indicators';

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}


export function CoinDetailPage() {
  const { t } = useTranslation();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [paperTradeSuggestion, setPaperTradeSuggestion] = useState<{ amountIDR: number; leverage: number; stopLossUSD: number; takeProfitUSD: number } | null>(null);
  const { coinId } = useParams<{ coinId: string }>();
  const navigate = useNavigate();
  const { data: watchlist = [] } = useWatchlist();
  const coin = watchlist.find((w) => w.coinId === coinId);

  const { data: detail, isLoading, error, refetch, isFetching } = useCoinDetail(coinId!);
  const { data: markets = [] } = useCoinMarkets(coinId ? [coinId] : []);
  const { data: portfolioSummary } = usePortfolioSummary();
  const market = markets[0];

  if (isLoading) return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Skeleton width={32} height={32} borderRadius={8} />
          <Skeleton width={48} height={48} borderRadius="50%" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton width={140} height={18} />
            <Skeleton width={80} height={12} />
          </div>
        </div>
        <Skeleton height={60} borderRadius={12} />
        <Skeleton height={240} borderRadius={14} />
        <Skeleton height={100} borderRadius={14} />
        <Skeleton height={140} borderRadius={14} />
      </div>
    </Layout>
  );

  if (error || !detail) {
    const isRateLimit = error instanceof CoinGeckoError && error.isRateLimit;
    const isOffline = error instanceof TypeError;
    const Icon = isRateLimit ? Clock : isOffline ? WifiOff : ServerCrash;
    const title = isRateLimit
      ? t('trading.error.rateLimit')
      : isOffline
      ? t('trading.error.offline')
      : t('trading.error.generic');

    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-4">
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={22} style={{ color: isRateLimit ? 'var(--warn-400)' : 'var(--loss-400)' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', margin: '0 0 6px' }}>{title}</p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 320, margin: 0 }}>
              {getCoinGeckoErrorMessage(error)}
            </p>
          </div>
          <button
            onClick={() => refetch()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} />
            {t('trading.error.retry')}
          </button>
        </div>
      </Layout>
    );
  }

  const { ohlc, closes, signal, usdToIdr } = detail;

  const ma7 = computeMA(closes, 7);
  const ma25 = computeMA(closes, 25);
  const chartData = ohlc.map((p, i) => ({
    time: p.time,
    price: p.close,
    ma7: isNaN(ma7[i]) ? null : parseFloat(ma7[i].toFixed(4)),
    ma25: isNaN(ma25[i]) ? null : parseFloat(ma25[i].toFixed(4)),
  }));

  const rsiArr = computeRSI(closes, 14);
  const rsiData = ohlc.map((p, i) => ({
    time: p.time,
    rsi: isNaN(rsiArr[i]) ? null : parseFloat(rsiArr[i].toFixed(1)),
  }));

  const priceChange = market?.price_change_percentage_24h ?? 0;
  const currentPrice = market?.current_price ?? closes[closes.length - 1];

  return (
    <Layout>
      {/* Back */}
      <button
        onClick={() => navigate('/trading')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', marginBottom: 20, padding: 0, fontFamily: 'var(--font-sans)' }}
      >
        <ArrowLeft size={14} /> {t('trading.backToTrading')}
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {market?.image && <img src={market.image} alt={coin?.name} style={{ width: 44, height: 44, borderRadius: '50%' }} />}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{coin?.name ?? coinId}</h1>
              <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 600 }}>{coin?.symbol}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 2 }}>
              <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                ${currentPrice.toLocaleString('en-US', { maximumFractionDigits: 4 })}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: priceChange >= 0 ? 'var(--gain-500)' : 'var(--loss-500)' }}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% {t('trading.change24h')}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setAlertModalOpen(true)}
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', fontWeight: 600 }}
          >
            <Bell size={14} /> {t('trading.alerts.create')}
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--text-secondary)' }}
          >
            <RefreshCw size={14} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-5 items-start">

        {/* Left: charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Price + MA chart */}
          <Card variant="default" padding="none">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{t('trading.price30d')}</h3>
                <div style={{ display: 'flex', gap: 12, fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 16, height: 2, background: 'var(--blue-400)', display: 'inline-block', borderRadius: 1 }} />MA7
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 16, height: 2, background: 'var(--warn-400)', display: 'inline-block', borderRadius: 1 }} />MA25
                  </span>
                </div>
              </div>
            </div>
            <div style={{ padding: '12px 4px 8px' }}>
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                  <XAxis dataKey="time" tickFormatter={formatDate} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tickFormatter={(v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} width={60} />
                  <Tooltip
                    labelFormatter={(v) => formatDate(Number(v))}
                    formatter={(value, name) => [
                      `$${Number(value).toLocaleString('en-US', { maximumFractionDigits: 4 })}`,
                      name === 'price' ? t('trading.price') : name === 'ma7' ? 'MA7' : 'MA25',
                    ]}
                    contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                  />
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--blue-400)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--blue-400)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="price" stroke="var(--blue-400)" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
                  <Line type="monotone" dataKey="ma7" stroke="var(--blue-400)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                  <Line type="monotone" dataKey="ma25" stroke="var(--warn-400)" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* RSI chart */}
          <Card variant="default" padding="none">
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>RSI (14)</h3>
              <div style={{ display: 'flex', gap: 6 }}>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 4, background: 'var(--loss-tint)', color: 'var(--loss-400)', fontWeight: 600 }}>OB &gt;70</span>
                <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: 4, background: 'var(--gain-tint)', color: 'var(--gain-400)', fontWeight: 600 }}>OS &lt;30</span>
              </div>
            </div>
            <div style={{ padding: '12px 4px 8px' }}>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={rsiData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-dim)" />
                  <XAxis dataKey="time" tickFormatter={formatDate} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} ticks={[0, 30, 50, 70, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} width={30} />
                  <Tooltip
                    labelFormatter={(v) => formatDate(Number(v))}
                    formatter={(v) => [Number(v).toFixed(1), 'RSI']}
                    contentStyle={{ background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 8, fontSize: 12 }}
                  />
                  <ReferenceLine y={70} stroke="var(--loss-500)" strokeDasharray="4 2" strokeWidth={1} />
                  <ReferenceLine y={30} stroke="var(--gain-500)" strokeDasharray="4 2" strokeWidth={1} />
                  <defs>
                    <linearGradient id="rsiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ai-accent)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--ai-accent)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="rsi" stroke="var(--ai-accent)" strokeWidth={2} fill="url(#rsiGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Setup Trade + Paper Trading — 1 section gabungan */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
            <TradeSetupCard
              signal={signal}
              currentPriceUSD={currentPrice}
              usdToIdr={usdToIdr}
              closes={closes}
              portfolioValueIDR={portfolioSummary?.totalValueIDR}
              onUseSuggestedSize={(amountIDR, leverage, stopLossUSD, takeProfitUSD) =>
                setPaperTradeSuggestion({ amountIDR, leverage, stopLossUSD, takeProfitUSD })
              }
            />
            <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                {t('trading.paperTrade.title')}
              </p>
              <PaperTradeForm
                coinId={coinId!}
                coinSymbol={coin?.symbol ?? coinId ?? ''}
                coinName={coin?.name ?? coinId ?? ''}
                currentPriceUSD={currentPrice}
                usdToIdr={usdToIdr}
                signal={signal.signal}
                stopLossUSD={paperTradeSuggestion?.stopLossUSD}
                takeProfitUSD={paperTradeSuggestion?.takeProfitUSD}
                prefillAmountIDR={paperTradeSuggestion?.amountIDR}
                prefillLeverage={paperTradeSuggestion?.leverage}
              />
            </div>
          </div>

          {/* Signal backtest */}
          <BacktestPanel coinId={coinId!} />
        </div>

        {/* Right: signal + analysis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Signal card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '18px' }}>
            <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{t('trading.currentSignal')}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <SignalBadge signal={signal.signal} size="lg" />
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{signal.reason}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'RSI', value: isNaN(signal.rsi) ? '—' : signal.rsi.toFixed(1), color: signal.rsi > 70 ? 'var(--loss-500)' : signal.rsi < 30 ? 'var(--gain-500)' : 'var(--text-primary)' },
                { label: 'MA7', value: isNaN(signal.ma7) ? '—' : `$${signal.ma7.toFixed(2)}`, color: 'var(--blue-400)' },
                { label: 'MA25', value: isNaN(signal.ma25) ? '—' : `$${signal.ma25.toFixed(2)}`, color: 'var(--warn-400)' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'var(--bg-raised)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed analysis */}
          <SignalAnalysisCard signal={signal} />

          {/* Active alerts */}
          <AlertsList coinId={coinId!} />
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <PriceAlertModal
        open={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        coinId={coinId!}
        coinSymbol={coin?.symbol ?? coinId ?? ''}
        coinName={coin?.name ?? coinId ?? ''}
        currentPriceUSD={currentPrice}
        currentRsi={isNaN(signal.rsi) ? undefined : signal.rsi}
      />
    </Layout>
  );
}
