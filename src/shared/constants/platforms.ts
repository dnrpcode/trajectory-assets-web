export const STOCK_PLATFORMS = [
  'Ajaib', 'Stockbit', 'BNI Sekuritas', 'Mandiri Sekuritas',
  'Mirae Asset', 'Phillip Sekuritas', 'Indo Premier', 'Lainnya',
];

export const REKSA_DANA_PLATFORMS = [
  'Bibit', 'Bareksa', 'Tokopedia Investasi', 'IPOT Fund',
  'Pluang', 'Lainnya',
];

export const CRYPTO_PLATFORMS = [
  'Indodax', 'Tokocrypto', 'Pintu', 'Binance', 'Lainnya',
];

export const GOLD_PLATFORMS = [
  'Pegadaian', 'ANTAMLogam', 'Tokopedia Emas', 'Pluang', 'Lainnya',
];

export const BANK_PLATFORMS = [
  'BCA Blu', 'Mandiri', 'BCA', 'BRI', 'BNI', 'CIMB Niaga', 'Permata',
];

export const DEFAULT_PLATFORMS = ['Lainnya'];

export const ALL_PLATFORMS = [
  ...new Set([
    ...STOCK_PLATFORMS,
    ...REKSA_DANA_PLATFORMS,
    ...CRYPTO_PLATFORMS,
    ...GOLD_PLATFORMS,
    ...BANK_PLATFORMS,
  ]),
];
