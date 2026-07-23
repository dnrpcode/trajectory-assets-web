# Trajectory — Project Intelligence

## ⚠️ Development Checklist — WAJIB di setiap task

Sebelum menganggap task selesai (fitur baru, perubahan UI, atau perubahan behavior), pastikan **keempat poin ini** terpenuhi. Ini bukan saran, ini syarat commit.

1. **Multi-language (i18n)**
   - Semua teks yang user-facing HARUS pakai `t('namespace.key')` dari `useTranslation()` — jangan hardcode string Indonesia atau Inggris langsung di JSX.
   - Tambahkan key baru ke **kedua** file: `src/i18n/locales/id.json` dan `src/i18n/locales/en.json`. Jangan pernah menambah ke salah satu saja.
   - Ikuti namespace yang sudah ada (`nav.*`, `common.*`, `dashboard.*`, `portfolio.*`, dst). Kalau perlu namespace baru, buat sesuai nama module.
   - Pengecualian yang boleh hardcode: konten demo/contoh di simulasi Halaman Panduan (misal nama saham dummy "BBCA", angka contoh) — itu memang disengaja berbahasa Indonesia sebagai ilustrasi, bukan UI chrome.

2. **Theme dark/light**
   - Jangan pernah hardcode warna hex/rgb langsung di style. Selalu pakai CSS custom properties dari `src/index.css` (`--bg-surface`, `--text-primary`, `--border-subtle`, `--blue-400`, `--gain-400`, dll — daftar lengkap ada di bagian "CSS / Design System" di bawah).
   - Kalau butuh token baru, tambahkan ke `:root` DAN ke `[data-theme="light"]` di `src/index.css` supaya kedua tema tetap konsisten.
   - Untuk komponen native (date input, dll), pakai `colorScheme` dari `useThemeContext()` — jangan hardcode `'dark'`.
   - Sebelum submit: bayangkan atau cek toggle ke light mode — teks harus tetap terbaca, bukan cuma "terlihat oke di dark".

3. **Clean Architecture & Modular**
   - Struktur wajib per module: `domain/{entities,repositories,use-cases}` → `data/` (implementasi Firebase/API) → `presentation/{pages,components,hooks}`.
   - Business logic masuk ke `domain/use-cases/`, BUKAN ditulis inline di komponen React atau di hook.
   - Import antar module HANYA lewat `@/modules/[name]` (barrel export via `index.ts`) — jangan cross-import file domain/data secara langsung dari module lain.
   - Singleton/service baru didaftarkan di `src/infrastructure/di/container.ts`, jangan `new` langsung di komponen.
   - Kalau menambah entity/tipe baru, taruh di `domain/entities/`, bukan didefinisikan ulang inline di beberapa file.

4. **Sinkronisasi Halaman Panduan (`/help`)**
   - Setiap kali menambah fitur baru, mengubah alur kerja fitur yang ada, atau mengubah UI signifikan (form baru, tombol baru, flow baru): **update juga `src/modules/help/presentation/pages/HelpPage.tsx`**.
   - Yang perlu disinkronkan:
     - `QUICK_START` — kalau ada langkah onboarding baru
     - `DEMOS` — kalau ada fitur besar baru yang butuh simulasi visual, atau simulasi lama sudah tidak cocok dengan UI aktual
     - `ENTRY_TYPES` — kalau ada tipe entri transaksi baru
     - `PRO_TIPS` / `GLOSSARY` — kalau ada istilah atau tips baru yang relevan
     - `FAQS` — kalau perilaku fitur berubah sehingga jawaban FAQ lama jadi salah/usang
   - Prinsipnya: Halaman Panduan harus selalu jadi cerminan akurat dari aplikasi yang live. Panduan yang menyimpang dari fitur asli lebih buruk daripada tidak ada panduan sama sekali.

---

## Overview
Personal portfolio intelligence platform untuk investor retail Indonesia.
Stack: React 18 + Vite + TypeScript (strict) + Tailwind CSS v3 + Firebase Auth + Firestore.
Live: [trajectory-assets.vercel.app](https://trajectory-assets.vercel.app)

---

## Tech Stack & Versions

| Package | Version | Notes |
|---|---|---|
| react / react-dom | ^18.2.0 | |
| vite | ^4.4.5 | |
| typescript | ^5.0.2 | strict mode |
| tailwindcss | ^3.4.19 | |
| firebase | ^12.14.0 | Auth + Firestore |
| @tanstack/react-query | ^5.101.0 | server state |
| react-hook-form | ^7.79.0 | forms |
| @hookform/resolvers | ^5.4.0 | use `as unknown as Resolver<T>` not `as any` |
| zod | ^4.4.3 | validation |
| zustand | ^5.0.14 | auth store only |
| react-router-dom | ^6.30.4 | |
| recharts | ^3.8.1 | PieChart, LineChart |
| i18next | ^26.3.1 | |
| react-i18next | ^17.0.8 | |
| clsx + tailwind-merge | latest | combined in `cn()` |

Path alias: `@/*` → `src/*`

---

## Architecture: Modular Clean Architecture (vertical slice)

```
src/
├── modules/
│   ├── auth/          Login, Register, Firebase auth listener
│   ├── user/          Onboarding wizard, Settings, user profile
│   ├── portfolio/     Portfolio, AssetDetail, entry ledger, projection engine
│   ├── dashboard/     Dashboard, Journal, Advisory, Simulasi CAGR
│   ├── trading/       Crypto watchlist, sinyal RSI+MA, paper trading, CoinGecko
│   ├── advisor/       AI chat (Robo Advisor) — OpenAI-compatible API
│   ├── income/        Kalender dividen IDX — Yahoo Finance via Vercel proxy
│   ├── goals/         Target finansial — waterfall roadmap multi-goal + proyeksi CAGR
│   └── help/          HelpPage + guided tour
├── shared/
│   ├── ui/            Layout, Navbar, Button, Input, Modal, Spinner, Toast, dll
│   ├── utils/         cn, formatCurrency, calculations, formatDate, firestore
│   ├── constants/     categories, platforms, allocationTargets
│   └── types/         AssetCategory, EntryType, RiskProfile, dll
├── data/
│   └── firebase/      config.ts — exports `db` dan `auth`
├── i18n/              i18next config + locales (id.json, en.json)
└── infrastructure/
    └── di/container.ts  Semua singleton + DI wiring
```

Setiap module mengikuti struktur:
```
modules/[name]/
├── domain/
│   ├── entities/      TypeScript interfaces (pure, no framework deps)
│   ├── repositories/  Interface contracts (I*Repository)
│   └── use-cases/     Business logic classes
├── data/              Firebase / API implementations
└── presentation/
    ├── hooks/         React Query + Zustand wrappers
    ├── pages/         Route components
    └── components/    Komponen khusus module
```

**Rule:** Import antar module hanya via `@/modules/[name]` — jangan cross-import domain files langsung.

---

## Domain Types (src/shared/types/index.ts)

```ts
type AssetCategory = 'saham' | 'reksa_dana' | 'obligasi_sbn' | 'emas' | 'kripto' | 'cash' | 'lainnya'
type EntryType     = 'new_position' | 'price_update' | 'top_up' | 'partial_sell' | 'full_sell' | 'income' | 'fee' | 'correction'
type RiskProfile   = 'conservative' | 'moderate' | 'aggressive'
type InvestmentHorizon = 'short' | 'medium' | 'long'
```

---

## Entity Shapes

### Asset (src/modules/portfolio/domain/entities/Asset.ts)
Computed projection — never edited directly, always recomputed by replaying entries.
```ts
interface Asset {
  id: string; userId: string; assetName: string; ticker?: string;
  category: AssetCategory; status: 'active' | 'closed'; currency: string; platform: string;
  totalUnits: number; avgCostPerUnit: number; totalCostBasisIDR: number;
  currentPricePerUnit: number; currentValueIDR: number;
  isStale: boolean;           // DON'T READ FROM FIRESTORE — use computeIsStale() instead
  unrealizedGainIDR: number; unrealizedGainPct: number;
  realizedGainIDR: number; totalIncomeIDR: number; totalFeesIDR: number;
  firstEntryDate: Date; lastUpdatedDate: Date;
  projectionVersion: number; updatedAt: Date;
}
```

### AssetEntry (src/modules/portfolio/domain/entities/AssetEntry.ts)
Immutable ledger — never modified after creation.
```ts
interface AssetEntry {
  id: string; userId: string; assetId?: string; assetName?: string;
  ticker?: string; category?: AssetCategory; platform?: string;
  entryType: EntryType; month: string; // "YYYY-MM"
  pricePerUnit?: number; units?: number; currency: string;
  exchangeRateToIDR?: number; amount?: number;
  incomeFeeCategory?: 'dividend' | 'coupon' | 'interest' | 'platform_fee' | 'tax' | 'other';
  targetEntryId?: string; isCorrected: boolean;
  notes?: string; date: Date; createdAt: Date; updatedAt: Date;
}
```

---

## Firestore Structure

```
users/{userId}                            User profile
users/{userId}/entries/{entryId}          AssetEntry (immutable)
users/{userId}/assets/{assetId}           Asset projection (recomputed)
users/{userId}/goals/{goalId}             Financial goals
users/{userId}/portfolioHistory/{month}   Monthly snapshots ("YYYY-MM")
users/{userId}/watchlist/{coinId}         Crypto watchlist (trading module)
users/{userId}/paperTrades/{tradeId}      Paper trades (trading module)
users/{userId}/dividendWatchlist/{ticker} Dividend watchlist (income module)
```

**Critical Firestore rules:**
- Never write `undefined` — always call `stripUndefined()` before writes.
- `getByAssetId` uses only `where('assetId', '==', assetId)` — NO `orderBy`. Sort in-memory. Reason: composite index doesn't exist → fails silently → asset shows zeros.
- `getByUserId` uses `orderBy('date', 'asc')` — fine, single-field index.

---

## Projection Engine (src/modules/portfolio/domain/use-cases/RecomputeAssetProjection.ts)

Replays all entries for an asset to compute current state:
1. Fetch via `entryRepo.getByAssetId()` (sort in-memory)
2. Filter out `isCorrected === true` AND entries targeted by correction entries
3. Replay each entry type in date order
4. Save computed Asset to Firestore via `projectionRepo.save()`

**Always call `recomputeAssetProjection.execute(userId, assetId)` after any entry mutation.**

`partial_sell` cost basis: use `cbPerUnitIDR = totalCostBasisIDR / totalUnits`, NOT `avgCostPerUnit * rate` — avoids FX double-application.

---

## Stale Detection

**NEVER read `asset.isStale` from Firestore** — stored field is unreliable.

Always use:
```ts
import { computeIsStale } from '@/shared/utils/calculations';
computeIsStale(asset) // true if lastUpdatedDate is not in current calendar month
```

---

## DI Container (src/infrastructure/di/container.ts)

Import singletons dari sini — jangan `new` langsung di komponen/hooks.

```ts
// Auth
authService, loginWithEmail, loginWithGoogle, registerWithEmail, logout

// User
userRepository, getUserById, completeOnboarding, updateUserProfile

// Portfolio
entryRepository, projectionRepository, goalRepository
createEntry, recomputeAssetProjection, getAssetEntries, deleteEntry
getActiveAssets, getAllAssets, deleteAsset

// Goals
getGoals, createGoal, updateGoal, deleteGoal
buildGoalRoadmap.execute(goals, currentValueIDR, cagrRatePct, totalMonthlyContributionIDR)
  // pure — waterfall berprioritas tenggat: alokasi, proyeksi kumulatif, saran
  // kontribusi bulanan = argumen ke-4, dari user.monthlyInvestmentIDR (bukan per-goal)

// Dashboard
portfolioRepository
getPortfolioSummary, getPortfolioHistory, backfillPortfolioHistory

// Advisor
aiAdvisorRepository, sendAdvisorMessage

// Trading (crypto — CoinGecko)
watchlistRepository, paperTradeRepository
getWatchlist, addToWatchlist, removeFromWatchlist
executePaperTrade, getPaperTrades
backtestSignalStrategy   // pure — replay computeSignal day-by-day, no look-ahead
priceAlertRepository
getPriceAlerts, createPriceAlert, markPriceAlertTriggered, deletePriceAlert
evaluatePriceAlerts     // pure — cek kondisi alert terhadap snapshot market

// Income (dividend calendar — Yahoo Finance)
dividendWatchlistRepository
getDividendInfo, searchDividendTicker
getDividendWatchlist, addToDividendWatchlist, removeFromDividendWatchlist
```

---

## React Query Keys

```ts
['activeAssets', userId]         // useActiveAssets()
['allAssets', userId]            // useAllAssets()
['entries', userId]              // useEntries() — all entries for user
['entries', userId, assetId]     // useAssetEntries(assetId)
['portfolioSummary', userId]     // usePortfolioSummary()
['portfolioHistory', userId]     // usePortfolioHistory()
['watchlist', userId]            // useWatchlist() — crypto
['paperTrades', userId]          // usePaperTrades()
['coinMarkets', ...ids]          // useCoinMarkets()
['coinDetail', coinId]           // useCoinDetail()
['signalBacktest', coinId, holdingDays]  // useSignalBacktest() — 200 hari data harian
['priceAlerts', userId]          // usePriceAlerts(), useAlertWatcher()
['alertWatcherPrices', coinIds]  // polling internal useAlertWatcher — jangan konsumsi langsung
['alertWatcherRsi', coinIds]     // polling internal useAlertWatcher — jangan konsumsi langsung
['goals', userId]                // useGoals()
['dividendWatchlist', userId]    // useDividendWatchlist()
['dividendInfo', ticker]         // useDividendInfo(ticker)
['dividendInfoBulk', tickers]    // useWatchlistDividends(tickers)
```

After any portfolio mutation: invalidate `activeAssets`, `allAssets`, `portfolioSummary`, `entries`.

---

## Routing (src/App.tsx)

```
/login              LoginPage           (public)
/register           RegisterPage        (public)
/onboarding         OnboardingPage      (AuthGuard)
/dashboard          DashboardPage       (OnboardingGuard)
/portfolio          PortfolioPage       (OnboardingGuard)
/portfolio/:assetId AssetDetailPage     (OnboardingGuard)
/journal            JournalPage         (OnboardingGuard)
/advisory           AdvisoryPage        (OnboardingGuard)
/projections        ProjectionsPage     (OnboardingGuard)
/chat               ChatPage            (OnboardingGuard)
/trading            TradingPage         (OnboardingGuard)
/trading/:coinId    CoinDetailPage      (OnboardingGuard)
/income             IncomePage          (OnboardingGuard)
/goals              GoalsPage           (OnboardingGuard)
/settings           SettingsPage        (OnboardingGuard)
/help               HelpPage            (OnboardingGuard)
*                   NotFoundPage
```

`ThemeProvider` wraps the entire app (outermost, outside `QueryClientProvider`).

Semua page component di atas di-`React.lazy()` + `Suspense` (fallback `FullPageSpinner`) supaya tiap route jadi chunk terpisah — jangan ubah jadi static import lagi, itu yang bikin bundle awal 1,8MB sebelum di-split.

---

## Auth State

Zustand store di `src/modules/auth/presentation/hooks/useAuth.ts`:
```ts
useAuthStore((s) => s.user)          // domain User | null
useAuthStore((s) => s.firebaseUser)  // Firebase User | null
useAuthStore((s) => s.loading)       // boolean
```

Import `useAuthStore` dari `@/modules/auth` (re-exported via index.ts).

---

## Trading Module (src/modules/trading/)

Data source: **CoinGecko API** — free, no key, browser-direct (CORS allowed).

```ts
// src/modules/trading/data/CoinGeckoRepository.ts
export class CoinGeckoError extends Error {
  status: number; retryAfter: number | null;
  get isRateLimit()    // 429
  get isServerError()  // 500+
  get isUnauthorized() // 401
}
export function getCoinGeckoErrorMessage(error: unknown): string
export const CoinGeckoService  // singleton (legacy alias)
export { sleep }
```

Smart retry di hooks: tidak retry 401, max 2x untuk 429 dengan delay dari `Retry-After` header.

Signal scanner menggunakan `fetchWithRateLimitRetry` — wait Retry-After lalu retry sekali sebelum skip coin.

**Signal backtest** (`BacktestSignalStrategy`, `CoinDetailPage` → `BacktestPanel`): replay `computeSignal()` day-by-day terhadap 200 hari data harian (`getOHLC(coinId, 200)` — CoinGecko otomatis kasih granularitas harian untuk `days` > 90, beda dari sinyal live yang pakai 30 hari/granularitas jam). Tanpa look-ahead bias (sinyal hari i pakai data 0..i, entry di closing hari i+1), tanpa overlapping trade. Output: win rate, avg return, max drawdown, breakdown BUY vs SELL.

**Price/RSI alerts** (`priceAlerts` collection, `useAlertWatcher` di-mount sekali di `App.tsx`/`AppRoutes` — BUKAN di `Layout.tsx`, supaya tidak ikut ke-bundle di setiap page chunk): poll harga tiap 60 detik dan RSI tiap 5 menit selagi tab terbuka, evaluasi via `EvaluatePriceAlerts` (pure), lalu `markPriceAlertTriggered` + browser `Notification` API + toast. **Foreground-only** — belum ada push notification saat app tertutup (butuh FCM, belum diimplementasikan).

**Position sizing berbasis risiko** (`TradeSetupCard`): pilih risiko 1-3% dari `portfolioValueIDR`, dibagi jarak stop-loss (%) untuk dapat ukuran posisi notional, dibagi leverage untuk margin yang dibutuhkan. Tombol "Pakai Ukuran Ini" mengisi `PaperTradeForm` via `prefillAmountIDR`/`prefillLeverage` (pattern: prefill props + `useEffect` sync, bukan fully controlled).

**Paper Trading** (`PaperTradeForm`) — sekarang di-render di `CoinDetailPage`; sebelumnya komponen ini sudah ada tapi tidak pernah dipasang di UI manapun. `leverage` dan `stopLossUSD`/`takeProfitUSD` sekarang benar-benar dikirim ke `ExecutePaperTrade` (dulu hardcode `leverage: 1` dan `undefined`).

---

## Income Module (src/modules/income/)

Data source: **Yahoo Finance** via **Vercel Edge proxy** (bypass CORS).

Proxy endpoints (`api/dividend/` — auto-deployed bersama Vercel):
- `GET /api/dividend/search?q=BBCA.JK` → Yahoo Finance search
- `GET /api/dividend/chart?ticker=BBCA.JK` → Yahoo Finance chart (5 tahun, events=dividends)

```ts
// src/modules/income/data/YahooDividendRepository.ts
export class DividendError extends Error {
  status: number; ticker: string;
  get isNotFound()   // 404
  get isRateLimit()  // 429
}
```

Search format: **`TICKER.JK`** (dot) — bukan `TICKER JK` (spasi). Spasi mengembalikan news saja.

Kalkulasi di client (tidak ada backend):
- **Yield trailing 12 bulan**: sum dividen 12 bulan terakhir ÷ harga saat ini × 100
- **Konsistensi**: jumlah tahun unik dari 5 tahun terakhir yang punya dividen
- **Yield per event**: nominal ÷ harga saat ini × 100

Watchlist disimpan Firestore `dividendWatchlist/{ticker}` — document ID = ticker uppercase.

**PENTING — endpoint sektor Yahoo tidak bisa dipakai:** sudah dicoba `quoteSummary/{ticker}?modules=assetProfile` (sumber data sektor/industri per saham) — endpoint ini butuh session cookie + crumb token, dan flow resmi 2-langkah (`fc.yahoo.com` → cookie → `/v1/test/getcrumb` → crumb) tetap gagal konsisten ("Invalid Crumb"/"Invalid Cookie") saat dites langsung dari server tanpa state persisten. Beda dari endpoint `/v8/finance/chart` dan `/v1/finance/search` yang dipakai di atas — keduanya TIDAK butuh crumb. Jangan coba re-implement live sector fetch dari Yahoo tanpa solusi auth yang lebih baik. Solusi yang dipakai sekarang: dataset statis di `src/shared/constants/idxSectors.ts` (lihat bagian Sector Concentration di bawah).

---

## Sector Concentration (Dashboard)

`computeSectorConcentration()` di `src/shared/utils/portfolioProjections.ts` — agregasi nilai saham aktif per sektor IDX-IC pakai lookup statis `IDX_SECTORS` (`src/shared/constants/idxSectors.ts`, ~90 ticker paling likuid, bukan API — lihat catatan di atas kenapa). Ticker di luar dataset masuk bucket `unclassified`, bukan error. `isConcentrated: true` kalau sektor terbesar > 40% dari total nilai saham. Ditampilkan via `SectorConcentrationChart` di `DashboardPage`.

Kalau perlu tambah ticker baru ke dataset, edit `IDX_SECTORS` langsung — jangan bikin call API baru ke Yahoo untuk ini.

---

## Goals Module (src/modules/goals/)

**Kontribusi bulanan adalah SATU angka global, bukan per-goal.** Disimpan di `User.monthlyInvestmentIDR` (bukan di `Goal` entity — field `Goal.monthlyContributionIDR` sudah dihapus). Diisi lewat `MonthlyContributionInput` di `GoalsPage`, ditulis via `updateUserProfile.execute(userId, { monthlyInvestmentIDR })` + `setUser()` (pola yang sama dipakai `ChatPage` untuk update `targetAllocation`).

```ts
buildGoalRoadmap.execute(goals, currentValueIDR, cagrRatePct, totalMonthlyContributionIDR)
```
4 argumen — jangan lupa argumen ke-4 (dulu dihitung dari `sum(goal.monthlyContributionIDR)`, sekarang harus di-pass eksplisit dari `user?.monthlyInvestmentIDR ?? 0`).

`GoalProgress.calculation` (tipe `GoalCalculationDetail`, null kalau goal tanpa `targetDate`) menyimpan pecahan angka mentah di balik "Proyeksi di tenggat" dan "Butuh per bulan" — `currentPortfolioValueIDR`, `growthFactor`, `portfolioFutureValueIDR`, `contributionFutureValueIDR`, `allocatedToEarlierGoalsIDR`, dll. Dipakai `GoalCard`'s expandable "Lihat cara hitungnya" untuk narasi langkah-demi-langkah dengan angka asli goal itu — supaya user (dan developer) benar-benar paham cara hitungnya, bukan cuma lihat hasil akhir. Kalau ubah formula di `BuildGoalRoadmap`, field `calculation` WAJIB ikut di-update supaya narasi UI tidak menyimpang dari hasil sebenarnya.

`calculation` juga punya field `noCagr*` (`noCagrTotalFutureValueIDR`, `noCagrProjectedValueIDR`, `noCagrRequiredMonthlyIDR`) — skenario pembanding kalau CAGR dianggap 0% (portofolio flat, setoran dijumlah linear bukan majemuk: `currentValueIDR + totalMonthly × monthsRemaining`). Baseline paling konservatif, ditampilkan di `GoalCard` sebagai kotak "Pembanding: murni setoran" supaya user lihat seberapa besar proyeksi normalnya bergantung pada asumsi return pasar yang tidak dijamin.

Onboarding (`CompleteOnboarding`, step 3 `OnboardingPage`) juga sudah dipindah — field "Kontribusi Bulanan" di form onboarding sekarang menulis ke `user.monthlyInvestmentIDR`, bukan ke goal yang dibuat.

---

## Theme System

- `ThemeProvider` di `src/shared/ui/ThemeContext.tsx`
- Persisted ke `localStorage` key `'theme'`. Default `'dark'`.
- `data-theme` attribute di `<html>`. Light override di `[data-theme="light"]` di `index.css`.
- Di komponen: `const { theme, toggleTheme } = useThemeContext()`

---

## i18n

- Config di `src/i18n/config.ts`, diimport di `src/main.tsx`
- Locale files: `src/i18n/locales/id.json` dan `en.json`
- Persisted ke `localStorage` key `'lang'`. Default `'id'`.
- Di komponen: `const { t, i18n } = useTranslation()`
- Key namespaces: `nav.*`, `common.*`, `auth.*`, `onboarding.*`, `dashboard.*`, `portfolio.*`, `assetDetail.*`, `journal.*`, `entry.*`, `category.*`, `settings.*`, `goals.*`
- `nav.income` = "Dividen & Kupon" (id) / "Dividends & Coupons" (en)

---

## CSS / Design System

**Fonts:** Plus Jakarta Sans (UI), JetBrains Mono (angka/mono). Google Fonts di `index.css`.

**Approach:** CSS custom properties untuk semua design token + Tailwind untuk layout/spacing. Inline `style={{}}` masih banyak dipakai untuk token-based styling — intentional.

**Surface tokens:**
```
--bg-base, --bg-surface, --bg-raised, --bg-hover, --bg-overlay, --bg-invert
--border-dim, --border-subtle, --border-default, --border-strong
--text-primary, --text-secondary, --text-muted, --text-on-accent
```

**Color tokens:**
```
--blue-400/500/glow/tint, --blue-300, --blue-tint-2   -- accent/brand/selected
--gain-400/500/glow/tint    -- profit (emerald)
--loss-400/500/glow/tint    -- loss (rose)
--warn-400/500/tint         -- warning (amber)
--ai-accent / --ai-glow     -- AI features (purple)
```

**Utility functions (`src/shared/utils/`):**
- `cn(...classes)` — clsx + tailwind-merge
- `formatCurrency(amount, currency?)` — IDR dengan Intl.NumberFormat id-ID
- `formatCurrencyCompact(amount)` — "Rp 1,23M"
- `formatPercent(value, decimals?)` — "+12.34%"
- `formatDate(date)` — locale Indonesia, e.g. "15 Juni 2026"
- `formatMonth("YYYY-MM")` → "Juni 2026"
- `getCurrentMonth()` → "YYYY-MM"
- `computeIsStale(asset)` — true jika `lastUpdatedDate` bukan bulan ini

---

## Forms Pattern

```ts
import type { Resolver } from 'react-hook-form';

useForm<FormValues>({
  resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
  // JANGAN `as any` — pakai `as unknown as Resolver<FormValues>`
})
```

**NumericInput dengan RHF:** wajib `Controller`, bukan `register`. `value: number | undefined`.

---

## Shared UI Components (src/shared/ui/)

- `Button` — variants: `primary`, `secondary`, `danger`, `ghost`. Props: `loading`, `fullWidth`, `size`, `icon`
- `Input` — `forwardRef`. Props: `label`, `error`, `hint`, `prefix`, `suffix`
- `NumericInput` — wraps Input, format ribuan Indonesia
- `Modal` — controlled via `open`/`onClose`. Props: `title`, `size`
- `Layout` — page wrapper dengan Navbar sidebar
- `Navbar` — nav items pakai `t('nav.*')`, mobile drawer, logout
- `Toast` / `ToastProvider` — `useToast()` untuk notifikasi
- `TourContext` / `TourOverlay` — guided tour system

---

## Known Patterns & Pitfalls

1. **`asset.isStale` dari Firestore tidak reliable** — selalu pakai `computeIsStale(asset)`.

2. **`getByAssetId` DILARANG pakai `orderBy`** — butuh composite index yang tidak ada. Symptom: nilai aset jadi 0 setelah tambah entry.

3. **`stripUndefined()`** — wajib sebelum setiap Firestore write.

4. **`zodResolver` cast** — `as unknown as Resolver<FormValues>`, bukan `as any`.

5. **NumericInput dengan RHF** — wajib `Controller`. Value `number | undefined`.

6. **Date input `colorScheme`** — pass `colorScheme: theme` dari `useThemeContext()`. Jangan hardcode `'dark'`.

7. **Entry mutations** — selalu `recomputeAssetProjection.execute(userId, assetId)` setelah create/delete, lalu invalidate Query keys.

8. **Date string → Date object** — `new Date(data.date + 'T12:00:00')`. Append waktu mencegah timezone off-by-one.

9. **`assetId` untuk aset baru**: `${userId}_${assetName.replace(/\s+/g, '_').toLowerCase()}_${category}`

10. **Yahoo Finance search query** — harus `TICKER.JK` (dot), bukan `TICKER JK` (spasi). Spasi return news saja, bukan quotes.

11. **`export type { ... }`** wajib saat re-export type dengan `isolatedModules` aktif.

12. **Edit/Delete entry UI** (`DeleteEntryModal`, `EditEntryModal` di `src/modules/portfolio/presentation/components/EntryActionModals.tsx`) — komponen bersama, diekspor lewat barrel `@/modules/portfolio` supaya bisa dipakai lintas module. Dipakai di `AssetDetailPage` (module portfolio) DAN `JournalPage` (module dashboard, import via barrel — bukan cross-import file langsung). Tombol edit/delete hanya muncul untuk entri dengan `isCorrected === false`. `useEditEntry`/`useDeleteEntry` (hook di `portfolio/presentation/hooks/useEntries.ts`) meng-invalidate query key `['entries', userId]` yang sama dipakai `JournalPage`, jadi daftar Jurnal ikut ter-refresh walau query read-nya beda hook (`useDashboardEntries.ts`) — React Query key itu global, bukan per-module.

13. **`EntryForm` (`src/shared/ui/EntryForm.tsx`) prop `requireConfirmation`** — kalau `true`, klik Simpan tidak langsung menulis ke Firestore: form di-swap jadi tampilan ringkasan (via state lokal `pendingSubmit`, bukan modal baru — supaya tidak nested-modal), user harus klik "Konfirmasi & Simpan" lagi baru `executeSubmit()` benar-benar jalan. Saat ini di-set di `AssetCard.tsx` (tombol Update Harga/Top Up/Jual di kartu Portfolio) — TIDAK di `AssetDetailPage`/`JournalPage`'s quick-action modal, jadi dua tempat itu masih submit langsung. Kalau mau perluas ke halaman lain, tinggal tambah prop `requireConfirmation` di pemanggilan `<EntryForm>`-nya, tidak perlu ubah `EntryForm` itu sendiri.

**PENTING — ada 2 implementasi `useCreateEntry` yang hampir identik** (duplikasi arsitektur lama, belum di-unifikasi): `src/shared/hooks/useCreateEntry.ts` (dipakai `EntryForm`) dan `src/modules/portfolio/presentation/hooks/useEntries.ts` (dipakai tombol create langsung di `AssetDetailPage`/`JournalPage`). Keduanya invalidate query key yang sama, jadi tidak bug secara fungsional — tapi kalau ubah logic create-entry (mis. tambah field baru), WAJIB ubah di KEDUA file, jangan cuma satu.

---

## Deployment

```bash
npm run build      # tsc + vite build
vercel --prod      # deploy ke Vercel production
```

Env vars wajib di Vercel dashboard: `VITE_FIREBASE_*`, `VITE_AI_API_KEY`, `VITE_AI_API_URL`, `VITE_AI_MODEL`.

Vercel Edge proxy (`api/dividend/`) di-deploy otomatis — tidak perlu config tambahan. Response di-cache 5 menit di edge.

---

## What Is NOT Done Yet

- Semua halaman (`presentation/pages/*.tsx`) sudah pakai `t()` — cek dengan `grep -rL "useTranslation" src/modules/*/presentation/pages/*.tsx`, hasilnya harus kosong. Dua pengecualian yang disengaja tetap hardcode Bahasa Indonesia:
  - Konten simulasi `DemoXXX` di `HelpPage.tsx` (nama saham dummy, angka contoh) — sesuai aturan pengecualian di checklist atas.
  - String `reason` di `src/shared/utils/indicators.ts` (dipakai CoinCard, SignalScannerModal, TradeSetupCard) — dihasilkan business logic pure function di domain layer, bukan JSX, jadi belum dialiri lewat `t()`.
- `firestore.rules` sudah ada dan cukup ketat (owner-only, validasi field wajib per collection), tapi ada bug: bagian `goals` memvalidasi field `notes` padahal entity `Goal` menulis `description` — validasi panjang string itu jadi tidak pernah berjalan. Belum diperbaiki.
- No tests.

---

## Setup Lokal

```bash
cp .env.example .env   # isi Firebase credentials + AI API key
npm install
npm run dev            # development (localhost:5173)
npm run build          # production build
```
