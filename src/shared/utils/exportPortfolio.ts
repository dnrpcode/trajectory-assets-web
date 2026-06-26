import type { Asset } from '@/shared/types/asset';
import type { AssetEntry } from '@/shared/types/assetEntry';
import { CATEGORY_LABELS } from '@/shared/constants/categories';

const ENTRY_TYPE_LABELS: Record<string, string> = {
  new_position: 'Posisi Baru',
  price_update: 'Update Harga',
  top_up:       'Tambah Unit',
  partial_sell: 'Jual Sebagian',
  full_sell:    'Jual Semua',
  income:       'Pendapatan',
  fee:          'Biaya',
  correction:   'Koreksi',
};

function escapeCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  // Wrap in quotes if contains comma, newline, or quote
  if (s.includes(',') || s.includes('\n') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCell).join(',');
}

function downloadCSV(filename: string, rows: string[]) {
  const bom = '﻿'; // UTF-8 BOM so Excel opens with correct encoding
  const blob = new Blob([bom + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

// ── Ringkasan Aset ────────────────────────────────────────────────────────────

export function exportAssetSummaryCSV(assets: Asset[]) {
  const header = buildRow([
    'Nama Aset', 'Ticker', 'Kategori', 'Platform', 'Status',
    'Unit Dimiliki', 'Rata-rata Biaya/Unit (IDR)', 'Harga Saat Ini (IDR)',
    'Total Biaya (IDR)', 'Nilai Saat Ini (IDR)',
    'Unrealized Gain/Loss (IDR)', 'Unrealized Gain/Loss (%)',
    'Realized Gain/Loss (IDR)', 'Total Income (IDR)',
    'Tanggal Pertama Beli', 'Terakhir Update',
  ]);

  const rows = assets.map((a) =>
    buildRow([
      a.assetName,
      a.ticker ?? '',
      CATEGORY_LABELS[a.category] ?? a.category,
      a.platform,
      a.status === 'active' ? 'Aktif' : 'Closed',
      a.totalUnits,
      a.avgCostPerUnit,
      a.currentPricePerUnit,
      a.totalCostBasisIDR,
      a.currentValueIDR,
      a.unrealizedGainIDR,
      parseFloat(a.unrealizedGainPct.toFixed(2)),
      a.realizedGainIDR,
      a.totalIncomeIDR,
      formatDate(a.firstEntryDate),
      formatDate(a.lastUpdatedDate),
    ]),
  );

  const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date())
    .replace(/\//g, '-');

  downloadCSV(`trajectory_ringkasan_aset_${dateStr}.csv`, [header, ...rows]);
}

// ── Riwayat Transaksi ─────────────────────────────────────────────────────────

export function exportTransactionHistoryCSV(entries: AssetEntry[]) {
  const header = buildRow([
    'Tanggal', 'Nama Aset', 'Ticker', 'Kategori', 'Platform',
    'Tipe Transaksi', 'Harga/Unit', 'Unit', 'Nilai (IDR)',
    'Mata Uang', 'Kurs IDR', 'Catatan',
  ]);

  const active = entries
    .filter((e) => !e.isCorrected)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const rows = active.map((e) =>
    buildRow([
      formatDate(e.date),
      e.assetName ?? '',
      e.ticker ?? '',
      e.category ? (CATEGORY_LABELS[e.category] ?? e.category) : '',
      e.platform ?? '',
      ENTRY_TYPE_LABELS[e.entryType] ?? e.entryType,
      e.pricePerUnit ?? '',
      e.units ?? '',
      e.amount ?? '',
      e.currency,
      e.exchangeRateToIDR ?? 1,
      e.notes ?? '',
    ]),
  );

  const dateStr = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date())
    .replace(/\//g, '-');

  downloadCSV(`trajectory_transaksi_${dateStr}.csv`, [header, ...rows]);
}
