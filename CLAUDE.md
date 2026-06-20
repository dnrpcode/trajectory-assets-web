# Trajectory — Project Intelligence

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
│   ├── goals/         Financial goals
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

// Dashboard
portfolioRepository
getPortfolioSummary, getPortfolioHistory, backfillPortfolioHistory

// Advisor
aiAdvisorRepository, sendAdvisorMessage

// Trading (crypto — CoinGecko)
watchlistRepository, paperTradeRepository
getWatchlist, addToWatchlist, removeFromWatchlist
executePaperTrade, getPaperTrades

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
/settings           SettingsPage        (OnboardingGuard)
/help               HelpPage            (OnboardingGuard)
*                   NotFoundPage
```

`ThemeProvider` wraps the entire app (outermost, outside `QueryClientProvider`).

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
- Key namespaces: `nav.*`, `common.*`, `auth.*`, `onboarding.*`, `dashboard.*`, `portfolio.*`, `assetDetail.*`, `journal.*`, `entry.*`, `category.*`, `settings.*`
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

- Translations (`t()`) baru ada di: Dashboard, Portfolio, Settings, EntryForm, Navbar. Masih hardcode Indonesia di: AssetDetailPage, JournalPage, OnboardingPage, auth pages, AssetCard, modal-modal.
- AI recommendation di AssetDetailPage masih mock/static.
- Proyeksi jadwal dividen mendatang — kalender income hanya tampilkan data historis Yahoo Finance, belum ada estimasi next payment.
- No tests.
- Firestore Security Rules — cek di Firebase console.

---

## Setup Lokal

```bash
cp .env.example .env   # isi Firebase credentials + AI API key
npm install
npm run dev            # development (localhost:5173)
npm run build          # production build
```
