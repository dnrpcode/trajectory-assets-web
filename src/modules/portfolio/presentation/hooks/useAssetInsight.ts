import { useQuery, useQueryClient } from '@tanstack/react-query';
import { aiAdvisorRepository } from '@/infrastructure/di/container';
import { formatCurrency, formatCurrencyCompact } from '@/shared/utils/formatCurrency';
import type { Asset } from '@/shared/types/asset';
import type { AssetEntry } from '@/shared/types/assetEntry';

const STALE_MS = 15 * 60_000; // 15 menit

function sanitize(s: string, max = 80): string {
  return s.replace(/[`\n\r]/g, ' ').slice(0, max);
}

function buildSystemPrompt(asset: Asset, entries: AssetEntry[]): string {
  const activeEntries = entries.filter((e) => !e.isCorrected);
  const holdingDays = asset.firstEntryDate
    ? Math.round((Date.now() - asset.firstEntryDate.getTime()) / 86_400_000)
    : null;
  const avgCostStr     = formatCurrency(asset.avgCostPerUnit);
  const currentPrStr   = formatCurrency(asset.currentPricePerUnit);
  const unrealizedStr  = `${asset.unrealizedGainPct >= 0 ? '+' : ''}${asset.unrealizedGainPct.toFixed(1)}%`;
  const unrealizedIdrStr = formatCurrencyCompact(Math.abs(asset.unrealizedGainIDR));
  const incomeStr      = asset.totalIncomeIDR > 0 ? formatCurrencyCompact(asset.totalIncomeIDR) : null;
  const realizedStr    = asset.realizedGainIDR !== 0 ? formatCurrencyCompact(asset.realizedGainIDR) : null;

  const entryStats = (() => {
    const buys  = activeEntries.filter((e) => ['new_position', 'top_up'].includes(e.entryType)).length;
    const sells = activeEntries.filter((e) => ['partial_sell', 'full_sell'].includes(e.entryType)).length;
    return `${buys} pembelian${sells > 0 ? `, ${sells} penjualan` : ''}`;
  })();

  const isStale = asset.lastUpdatedDate
    ? new Date(asset.lastUpdatedDate).getMonth() !== new Date().getMonth() ||
      new Date(asset.lastUpdatedDate).getFullYear() !== new Date().getFullYear()
    : false;

  return `Kamu adalah analis portofolio Trajectory. Berikan analisis singkat, jujur, dan actionable tentang posisi investasi berikut dalam Bahasa Indonesia.

## Data Posisi: ${sanitize(asset.assetName)} (${sanitize(asset.ticker ?? asset.category, 20)})

- Kategori: ${asset.category}
- Platform: ${sanitize(asset.platform, 50)}
- Status harga: ${isStale ? 'BELUM DIPERBARUI bulan ini — data mungkin tidak akurat' : 'diperbarui'}
- Rata-rata biaya: ${avgCostStr}
- Harga saat ini: ${currentPrStr}
- Unrealized PnL: ${unrealizedStr} (${unrealizedIdrStr} ${asset.unrealizedGainIDR >= 0 ? 'profit' : 'rugi'})
- Jumlah unit dimiliki: ${asset.totalUnits > 0 ? asset.totalUnits.toLocaleString('id-ID') : 'closed'}
- Total nilai: ${formatCurrencyCompact(asset.currentValueIDR)}
- Riwayat transaksi: ${entryStats}${holdingDays !== null ? `, holding ${holdingDays} hari` : ''}
${incomeStr ? `- Total income (dividen/kupon): ${incomeStr}` : ''}
${realizedStr ? `- Realized gain: ${realizedStr}` : ''}

## Instruksi

Tulis 3 poin insight (gunakan bullet •), masing-masing 1–2 kalimat:
1. Evaluasi posisi saat ini (apakah menguntungkan, berisiko, atau stabil?)
2. Faktor yang perlu diperhatikan (termasuk apakah harga perlu segera diperbarui jika stale)
3. Saran tindakan konkret (hold / tambah / kurangi — sertakan alasan singkat)

Gaya: langsung, tidak bertele-tele, seperti analis profesional berbicara ke investor ritel. Jangan tambahkan disclaimer panjang.`;
}

export function useAssetInsight(asset: Asset, entries: AssetEntry[]) {
  return useQuery({
    queryKey: ['assetInsight', asset.id, asset.currentPricePerUnit, entries.length],
    queryFn: () =>
      aiAdvisorRepository.sendMessage(
        buildSystemPrompt(asset, entries),
        [],
        'Berikan analisis posisi ini.',
      ),
    staleTime: STALE_MS,
    gcTime:    30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useRefreshAssetInsight(asset: Asset) {
  const qc = useQueryClient();
  return () =>
    qc.invalidateQueries({ queryKey: ['assetInsight', asset.id] });
}
