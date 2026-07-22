/**
 * Klasifikasi sektor IDX-IC (IDX Industrial Classification) untuk saham IDX
 * yang paling likuid/umum dipegang investor retail. Dataset statis (bukan
 * API) karena endpoint sektor Yahoo Finance (quoteSummary/assetProfile)
 * membutuhkan session cookie + crumb yang tidak reliabel dipanggil dari
 * serverless function tanpa state — lihat catatan di CLAUDE.md.
 *
 * Ticker di luar daftar ini dianggap "unclassified", bukan error.
 */
export const IDX_SECTORS: Record<string, string> = {
  // Financials
  BBCA: 'Financials', BBRI: 'Financials', BMRI: 'Financials', BBNI: 'Financials',
  BRIS: 'Financials', BJBR: 'Financials', BJTM: 'Financials', BTPS: 'Financials',
  ARTO: 'Financials', AGRO: 'Financials', BNGA: 'Financials', PNBN: 'Financials',
  NISP: 'Financials', SRTG: 'Financials', PNLF: 'Financials', ADMF: 'Financials',

  // Energy
  ADRO: 'Energy', PTBA: 'Energy', ITMG: 'Energy', MEDC: 'Energy',
  PGAS: 'Energy', ELSA: 'Energy', HRUM: 'Energy', INDY: 'Energy',
  BUMI: 'Energy', DOID: 'Energy', GEMS: 'Energy', AKRA: 'Energy',

  // Basic Materials
  ANTM: 'Basic Materials', TINS: 'Basic Materials', INCO: 'Basic Materials',
  MDKA: 'Basic Materials', SMGR: 'Basic Materials', INTP: 'Basic Materials',
  KRAS: 'Basic Materials', TPIA: 'Basic Materials', BRPT: 'Basic Materials',
  NCKL: 'Basic Materials',

  // Industrials
  UNTR: 'Industrials', ASGR: 'Industrials', ASTI: 'Industrials',

  // Consumer Cyclicals
  ACES: 'Consumer Cyclicals', MAPI: 'Consumer Cyclicals', ERAA: 'Consumer Cyclicals',
  LPPF: 'Consumer Cyclicals', RALS: 'Consumer Cyclicals', MNCN: 'Consumer Cyclicals',
  SCMA: 'Consumer Cyclicals',

  // Consumer Non-Cyclicals
  UNVR: 'Consumer Non-Cyclicals', ICBP: 'Consumer Non-Cyclicals', INDF: 'Consumer Non-Cyclicals',
  MYOR: 'Consumer Non-Cyclicals', GGRM: 'Consumer Non-Cyclicals', HMSP: 'Consumer Non-Cyclicals',
  CPIN: 'Consumer Non-Cyclicals', JPFA: 'Consumer Non-Cyclicals', AALI: 'Consumer Non-Cyclicals',
  LSIP: 'Consumer Non-Cyclicals', SIMP: 'Consumer Non-Cyclicals', ULTJ: 'Consumer Non-Cyclicals',
  ROTI: 'Consumer Non-Cyclicals',

  // Healthcare
  KLBF: 'Healthcare', SIDO: 'Healthcare', SILO: 'Healthcare', MIKA: 'Healthcare',
  HEAL: 'Healthcare', PRDA: 'Healthcare', TSPC: 'Healthcare',

  // Properties & Real Estate
  BSDE: 'Properties & Real Estate', SMRA: 'Properties & Real Estate', PWON: 'Properties & Real Estate',
  ASRI: 'Properties & Real Estate', CTRA: 'Properties & Real Estate', DMAS: 'Properties & Real Estate',
  APLN: 'Properties & Real Estate',

  // Technology
  GOTO: 'Technology', BUKA: 'Technology', EMTK: 'Technology', DCII: 'Technology',
  MTDL: 'Technology',

  // Infrastructures
  TLKM: 'Infrastructures', EXCL: 'Infrastructures', ISAT: 'Infrastructures',
  TOWR: 'Infrastructures', TBIG: 'Infrastructures', JSMR: 'Infrastructures',
  PGEO: 'Infrastructures',

  // Transportation & Logistic
  ASII: 'Transportation & Logistic', BIRD: 'Transportation & Logistic', ASSA: 'Transportation & Logistic',
  SMDR: 'Transportation & Logistic',
};

export function getIdxSector(ticker: string | undefined): string | null {
  if (!ticker) return null;
  return IDX_SECTORS[ticker.toUpperCase().replace('.JK', '')] ?? null;
}

export const ALL_IDX_SECTOR_NAMES = Array.from(new Set(Object.values(IDX_SECTORS))).sort();
