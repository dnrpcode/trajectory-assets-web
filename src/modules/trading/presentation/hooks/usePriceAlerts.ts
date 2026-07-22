import { useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  getPriceAlerts, createPriceAlert, deletePriceAlert, markPriceAlertTriggered, evaluatePriceAlerts,
} from '@/infrastructure/di/container';
import { useAuthStore } from '@/shared/hooks/useAuthStore';
import { useToast } from '@/shared/ui/Toast';
import { CoinGeckoService } from '../../data/CoinGeckoRepository';
import { computeRSI } from '@/shared/utils/indicators';
import type { CreatePriceAlertInput } from '../../domain/entities/PriceAlert';

const PRICE_POLL_MS = 60_000;
const RSI_POLL_MS = 5 * 60_000;

export function usePriceAlerts() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ['priceAlerts', user?.id],
    queryFn: () => getPriceAlerts.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCoinPriceAlerts(coinId: string) {
  const { data: alerts = [] } = usePriceAlerts();
  return alerts.filter((a) => a.coinId === coinId);
}

export function useCreatePriceAlert() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<CreatePriceAlertInput, 'userId'>) =>
      createPriceAlert.execute({ ...input, userId: user!.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['priceAlerts', user?.id] }),
  });
}

export function useDeletePriceAlert() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) => deletePriceAlert.execute(user!.id, alertId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['priceAlerts', user?.id] }),
  });
}

function notify(title: string, body: string) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.png' });
  }
}

/**
 * Watcher latar belakang — dipasang sekali di Layout supaya jalan di semua
 * halaman terautentikasi. Poll harga (60d) & RSI (5mnt, lebih jarang karena
 * butuh fetch candle per coin) untuk alert yang aktif, lalu tandai triggered
 * + kirim notifikasi saat kondisi terpenuhi. Hanya bekerja selagi tab
 * terbuka (foreground) — bukan push notification saat app tertutup.
 */
export function useAlertWatcher() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { toast } = useToast();
  const qc = useQueryClient();
  const notifiedRef = useRef<Set<string>>(new Set());

  const { data: alerts = [] } = useQuery({
    queryKey: ['priceAlerts', user?.id],
    queryFn: () => getPriceAlerts.execute(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });

  const activeAlerts = useMemo(() => alerts.filter((a) => a.active), [alerts]);
  const priceCoinIds = useMemo(
    () => Array.from(new Set(activeAlerts.filter((a) => a.metric === 'price').map((a) => a.coinId))),
    [activeAlerts],
  );
  const rsiCoinIds = useMemo(
    () => Array.from(new Set(activeAlerts.filter((a) => a.metric === 'rsi').map((a) => a.coinId))),
    [activeAlerts],
  );

  const { data: markets } = useQuery({
    queryKey: ['alertWatcherPrices', priceCoinIds],
    queryFn: () => CoinGeckoService.getMarkets(priceCoinIds),
    enabled: priceCoinIds.length > 0,
    refetchInterval: PRICE_POLL_MS,
    staleTime: PRICE_POLL_MS,
    retry: false,
  });

  const { data: rsiMap } = useQuery({
    queryKey: ['alertWatcherRsi', rsiCoinIds],
    queryFn: async () => {
      const entries: [string, number][] = [];
      for (const coinId of rsiCoinIds) {
        try {
          const closes = await CoinGeckoService.getMarketChart(coinId, 30);
          const rsiArr = computeRSI(closes, 14);
          entries.push([coinId, rsiArr[rsiArr.length - 1]]);
        } catch {
          // skip coin on error, keep watching others
        }
      }
      return Object.fromEntries(entries) as Record<string, number>;
    },
    enabled: rsiCoinIds.length > 0,
    refetchInterval: RSI_POLL_MS,
    staleTime: RSI_POLL_MS,
    retry: false,
  });

  useEffect(() => {
    if (!user || activeAlerts.length === 0) return;
    const prices = Object.fromEntries((markets ?? []).map((m) => [m.id, m.current_price]));
    const triggered = evaluatePriceAlerts.execute(activeAlerts, { prices, rsi: rsiMap ?? {} });

    for (const { alert, value } of triggered) {
      if (notifiedRef.current.has(alert.id)) continue;
      notifiedRef.current.add(alert.id);

      const metricLabel = alert.metric === 'price' ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}` : value.toFixed(1);
      const message = t('trading.alerts.triggeredMessage', {
        symbol: alert.coinSymbol,
        metric: t(`trading.alerts.metric.${alert.metric}`),
        condition: t(`trading.alerts.condition.${alert.condition}`),
        threshold: alert.metric === 'price' ? alert.threshold.toLocaleString('en-US') : alert.threshold,
        value: metricLabel,
      });

      toast(message, 'info');
      notify(t('trading.alerts.notificationTitle', { symbol: alert.coinSymbol }), message);

      markPriceAlertTriggered.execute(user.id, alert.id, value).then(() => {
        qc.invalidateQueries({ queryKey: ['priceAlerts', user.id] });
      });
    }
  }, [activeAlerts, markets, rsiMap, user, toast, qc, t]);
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === 'undefined') return Promise.resolve('denied');
  return Notification.requestPermission();
}
