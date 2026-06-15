# Trajectory — Project Intelligence

## Overview
Personal portfolio intelligence platform for Indonesian retail investors.
Stack: React 18 + Vite + TypeScript (strict) + Tailwind CSS v3 + Firebase Auth + Firestore.

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

## Architecture: Clean Architecture (event-sourced lite)

```
src/
├── domain/            Pure business logic — no framework dependencies
│   ├── entities/      TypeScript interfaces
│   ├── repositories/  Interface contracts (I*Repository)
│   └── use-cases/     Business operations
├── data/
│   └── firebase/      Firebase repository implementations + config
├── presentation/
│   ├── pages/         Route pages
│   ├── components/    ui/, charts/, forms/, portfolio/
│   ├── hooks/         React Query + Zustand wrappers
│   └── contexts/      ThemeContext
├── infrastructure/
│   └── di/container.ts  Singleton instances + DI wiring
├── i18n/
│   ├── config.ts      i18next init
│   └── locales/       id.json, en.json
└── shared/
    ├── utils/         calculations, formatCurrency, formatDate, cn, firestore
    ├── constants/     categories, platforms, allocationTargets
    └── types/         index.ts — AssetCategory, EntryType, etc.
```

---

## Domain Types (src/shared/types/index.ts)

```ts
type AssetCategory = 'saham' | 'reksa_dana' | 'obligasi_sbn' | 'emas' | 'kripto' | 'cash' | 'lainnya'
type EntryType     = 'new_position' | 'price_update' | 'top_up' | 'partial_sell' | 'full_sell' | 'income' | 'fee' | 'correction'
type RiskProfile   = 'conservative' | 'moderate' | 'aggressive'
type InvestmentHorizon = 'short' | 'medium' | 'long'

interface AllocationTarget {
  saham: number; reksa_dana: number; obligasi_sbn: number;
  emas: number; kripto: number; cash: number; lainnya: number;
}
```

---

## Entity Shapes

### Asset (src/domain/entities/Asset.ts)
Computed projection — never edited directly, always recomputed by replaying entries.
```ts
interface Asset {
  id: string; userId: string; assetName: string; ticker?: string;
  category: AssetCategory; status: 'active' | 'closed'; currency: string; platform: string;
  totalUnits: number; avgCostPerUnit: number; totalCostBasisIDR: number;
  currentPricePerUnit: number; currentValueIDR: number;
  isStale: boolean;           // stored in Firestore but DON'T READ IT — use computeIsStale() instead
  unrealizedGainIDR: number; unrealizedGainPct: number;
  realizedGainIDR: number; totalIncomeIDR: number; totalFeesIDR: number;
  firstEntryDate: Date; lastUpdatedDate: Date;
  projectionVersion: number; updatedAt: Date;
}
```

### AssetEntry (src/domain/entities/AssetEntry.ts)
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
users/{userId}                        User profile
users/{userId}/entries/{entryId}      AssetEntry documents (immutable)
users/{userId}/assets/{assetId}       Asset projection documents (recomputed)
users/{userId}/goals/{goalId}         Financial goals
users/{userId}/portfolioHistory/{month}  Monthly portfolio snapshots ("YYYY-MM")
```

**Critical Firestore rules:**
- Never write `undefined` — Firestore throws. Always call `stripUndefined()` before writes.
- `getByAssetId` uses only `where('assetId', '==', assetId)` — NO `orderBy` in the query. Sort in-memory after fetching. Reason: `where + orderBy` on different fields requires a composite Firestore index that doesn't exist → query fails silently → projection gets 0 entries → asset shows all zeros.
- `getByUserId` uses `orderBy('date', 'asc')` — fine, single-field index.

---

## Projection Engine (RecomputeAssetProjection.ts)

Located at: `src/domain/use-cases/asset-entries/RecomputeAssetProjection.ts`

Replays all entries for an asset to compute current state:
1. Fetch all entries via `entryRepo.getByAssetId()` (sorts in-memory)
2. Filter out `isCorrected === true` entries AND entries targeted by correction entries
3. Replay each entry type:
   - `new_position`: add units, update avgCost via `computeNewAvgCost()`, set `currentPricePerUnit`, accumulate `totalCostBasisIDR`, sets `hasRecentUpdate` if current month
   - `price_update`: update `currentPricePerUnit` only, sets `hasRecentUpdate` if current month
   - `top_up`: same as `new_position` (adds units + updates avg cost)
   - `partial_sell`: **use `cbPerUnitIDR = totalCostBasisIDR / totalUnits`** (NOT `avgCostPerUnit * rate`) to avoid FX rate double-application. Deducts from `totalCostBasisIDR` and `totalUnits`.
   - `full_sell`: realized gain = `price * rate * totalUnits - totalCostBasisIDR`. Zeros out units/cost. Sets `status = 'closed'`.
   - `income`: accumulates `totalIncomeIDR += amount * rate`
   - `fee`: accumulates `totalFeesIDR += amount * rate`
   - `correction`: skipped (handled by filter step)
4. `isStale = status === 'active' && !hasRecentUpdate`
5. Saves computed `Asset` to Firestore via `projectionRepo.save()`

**Always call `recomputeAssetProjection.execute(userId, assetId)` after any entry mutation.**

---

## Stale Detection

**NEVER read `asset.isStale` from Firestore.** Stored field is unreliable (stale from past writes).

Always use:
```ts
import { computeIsStale } from '@/shared/utils/calculations';
computeIsStale(asset) // true if lastUpdatedDate is not in the current calendar month
```

Used in: `AssetCard`, `AssetDetailPage`, `GetPortfolioSummary`.

---

## DI Container (src/infrastructure/di/container.ts)

Singleton instances — import from here, never `new` directly in components/hooks:
```ts
export const userRepository          // FirebaseUserRepository
export const entryRepository         // FirebaseAssetEntryRepository
export const projectionRepository    // FirebaseAssetProjectionRepository
export const portfolioRepository     // FirebasePortfolioRepository

export const createEntry             // CreateEntry use case
export const recomputeAssetProjection // RecomputeAssetProjection use case
export const getActiveAssets         // GetActiveAssets use case
export const getAssetHistory         // GetAssetHistory use case
export const deleteAsset             // DeleteAsset use case
export const getPortfolioSummary     // GetPortfolioSummary use case
export const getPortfolioHistory     // GetPortfolioHistory use case
```

---

## React Query Keys

```ts
['activeAssets', userId]       // useActiveAssets()
['allAssets', userId]          // useAllAssets()
['entries', userId]            // useEntries() — all entries for user
['entries', userId, assetId]   // useAssetEntries(assetId)
['portfolioSummary', userId]   // usePortfolioSummary()
['portfolioHistory', userId]   // usePortfolioHistory()
```

After any mutation, invalidate: `activeAssets`, `allAssets`, `portfolioSummary`, `entries`.

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
/settings           SettingsPage        (OnboardingGuard)
*                   → /login
```

`ThemeProvider` wraps the entire app (outermost wrapper, outside `QueryClientProvider`).

---

## Auth State

Zustand store at `src/presentation/hooks/useAuth.ts`:
```ts
useAuthStore((s) => s.user)          // domain User object | null
useAuthStore((s) => s.firebaseUser)  // Firebase User | null
useAuthStore((s) => s.loading)       // boolean
useAuthStore((s) => s.setUser)       // setter
```

Firebase Auth listener lives in `useAuth()` hook — call once at app root level to initialize.

---

## Theme System

- `ThemeProvider` at `src/presentation/contexts/ThemeContext.tsx`
- Persisted to `localStorage` key `'theme'`. Defaults to `'dark'`.
- Applies `data-theme` attribute to `<html>`. CSS vars switch on `[data-theme="light"]`.
- In components: `const { theme, toggleTheme } = useThemeContext()`
- Dark-first CSS vars in `:root`. Light mode overrides in `[data-theme="light"]` block in `index.css`.

---

## i18n

- Configured at `src/i18n/config.ts`, imported at top of `src/main.tsx`
- Locale files: `src/i18n/locales/id.json` and `en.json`
- Persisted to `localStorage` key `'lang'`. Defaults to `'id'`.
- In components: `const { t, i18n } = useTranslation()`
- Language switch: `i18n.changeLanguage('en')` + `localStorage.setItem('lang', 'en')`
- Translation key namespaces: `nav.*`, `common.*`, `auth.*`, `onboarding.*`, `dashboard.*`, `portfolio.*`, `assetDetail.*`, `journal.*`, `entry.*`, `category.*`, `settings.*`

---

## CSS / Design System

**Fonts:** Plus Jakarta Sans (UI text), JetBrains Mono (numbers/monospace). Both from Google Fonts in `index.css`.

**Approach:** CSS custom properties for all design tokens + Tailwind for layout/spacing. Inline `style={{}}` still widely used for token-based styling — intentional, not a bug.

**Surface tokens:**
```
--bg-base, --bg-surface, --bg-raised, --bg-hover, --bg-overlay, --bg-invert
--border-dim, --border-subtle, --border-default, --border-strong
--text-primary, --text-secondary, --text-muted, --text-on-accent
```

**Color tokens:**
```
--blue-400/500/glow/tint    -- accent/brand
--gain-400/500/glow/tint    -- profit (emerald)
--loss-400/500/glow/tint    -- loss (rose)
--warn-400/500/tint         -- warning (amber)
--ai-accent / --ai-glow     -- AI features (purple)
```

**Utility functions:**
- `cn(...classes)` — clsx + tailwind-merge, at `src/shared/utils/cn.ts`
- `formatCurrency(amount, currency?)` — IDR with Intl.NumberFormat id-ID
- `formatCurrencyCompact(amount)` — "Rp 1,23M" / "1,23jt" / "1,2rb"
- `formatPercent(value, decimals?)` — "+12.34%"
- `formatDate(date)` — Indonesian locale, e.g. "15 Juni 2026"
- `formatMonth("YYYY-MM")` → "Juni 2026"
- `getCurrentMonth()` → "YYYY-MM"
- `getMonthFromDate(date)` → "YYYY-MM"

---

## Forms Pattern

All forms: React Hook Form + Zod. **Typing workaround required:**

```ts
import type { Resolver } from 'react-hook-form';

useForm<FormValues>({
  resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
  // NOT `as any` — use `as unknown as Resolver<FormValues>`
})
```

Required because `@hookform/resolvers@5.x` has a type mismatch with `react-hook-form@7.x`.

**Numeric inputs:** Use `NumericInput` + RHF `Controller` (not `register`). `value: number|undefined`, `onChange: (v: number|undefined) => void`. Formats with Indonesian thousand separator (`.`) and decimal comma (`,`).

**Regular `Input`:** Uses `forwardRef` — RHF ref reaches DOM input correctly.

---

## Components Reference

### UI Primitives (`src/presentation/components/ui/`)
- `Button` — variants: `primary` (default), `secondary`, `danger`, `ghost`. Props: `loading`, `fullWidth`, `size`
- `Input` — uses `forwardRef`. Props: `label`, `error`, `hint`, `prefix`, `suffix`
- `NumericInput` — wraps Input, formats thousands. Props: `allowDecimal`, `value`, `onChange`, `onBlur`
- `Modal` — controlled by `isOpen`/`onClose`
- `Layout` — page wrapper with `Navbar` sidebar
- `Navbar` — nav items use `t('nav.*')` for labels
- `Badge`, `Card`, `StatCard`, `Spinner` / `FullPageSpinner`

### Portfolio (`src/presentation/components/portfolio/`)
- `AssetCard` — entire card navigates to `/portfolio/:id`. Action buttons use `stopPropagation`. Shows amber stale banner when `computeIsStale(asset)` is true.
- `StaleAssetBanner`

### Charts (`src/presentation/components/charts/`)
- `AllocationPieChart` — actual vs target allocation
- `PerformanceLineChart` — portfolio value history

### Forms (`src/presentation/components/forms/`)
- `EntryForm` — handles 7 creatable entry types (not `correction`). Props: `onSuccess`, `defaultEntryType`, `defaultAssetId`, `defaultAssetName`, `defaultCategory`, `defaultPlatform`, `isExistingAsset`

---

## Pages Reference

| Page | Path | Key hooks |
|---|---|---|
| LoginPage | /login | auth use cases |
| RegisterPage | /register | auth use cases |
| OnboardingPage | /onboarding | 4-step wizard |
| DashboardPage | /dashboard | `usePortfolioSummary`, `useActiveAssets`, `usePortfolioHistory` |
| PortfolioPage | /portfolio | `useActiveAssets` |
| AssetDetailPage | /portfolio/:assetId | `useActiveAssets`, `useAssetEntries`, `useDeleteEntry`, `useDeleteAsset` |
| JournalPage | /journal | `useEntries` |
| SettingsPage | /settings | `useAuthStore`, `userRepository`, `useThemeContext`, `useTranslation` |

---

## AssetDetailPage Sections

Located at `src/presentation/pages/Portfolio/AssetDetailPage.tsx` (~720 lines).

1. **Header card** — asset name/ticker/badges, current value, unrealized gain/loss, 6-metric stats grid
2. **Action buttons** — Update Harga, Top Up, Jual Sebagian, Jual Semua, Hapus Aset (each opens Modal with EntryForm or delete confirm)
3. **Price history chart** — LineChart from `price_update`/`new_position`/`top_up`/sell entries + dashed avg cost reference line
4. **AI recommendation card** — mock/static, not connected to real model
5. **Journal log** — per-entry `EntryRow` with type-colored badges, full details, delete button

---

## Onboarding Flow

4 steps in `OnboardingPage.tsx`:
1. Risk Profile (conservative / moderate / aggressive)
2. Investment Horizon (short / medium / long)
3. Financial Goal (name, target amount, target date)
4. Existing Portfolio? (yes → opens EntryForm modal, no → complete)

Completion: writes `User` doc to Firestore with `onboardingComplete: true`.

---

## Allocation Targets

Risk × Horizon matrix in `src/shared/constants/allocationTargets.ts`.
All 9 objects (3 risk × 3 horizon) have 7 keys: `saham, reksa_dana, obligasi_sbn, emas, kripto, cash, lainnya`.
Long horizon uses same allocations as medium (MVP simplification).

---

## Category Constants

```ts
// src/shared/constants/categories.ts
CATEGORY_LABELS: Record<AssetCategory, string>   // display names in Indonesian
CATEGORY_COLORS: Record<AssetCategory, string>   // hex colors for charts
ALL_CATEGORIES: AssetCategory[]                  // ordered array; cash is between kripto and lainnya
```

---

## Known Patterns & Pitfalls

1. **`asset.isStale` from Firestore is unreliable** — always use `computeIsStale(asset)`.

2. **`getByAssetId` must NOT use `orderBy`** — causes Firestore to require a composite index that doesn't exist. Symptom: all asset values show 0 after adding entry. Fix: sort in-memory.

3. **`stripUndefined()`** — must be called before every Firestore write. Firestore throws on `undefined`.

4. **`zodResolver` cast** — use `as unknown as Resolver<FormValues>`, never `as any`.

5. **`NumericInput` with RHF** — must use `Controller`. `value` is `number | undefined`, `onChange` receives `number | undefined`.

6. **Date input `colorScheme`** — pass `colorScheme: theme` (from `useThemeContext()`) so the calendar icon matches theme. Not hardcoded `'dark'`.

7. **Entry mutations** — always call `recomputeAssetProjection.execute(userId, assetId)` after create/delete, then invalidate TanStack Query keys.

8. **Date string → Date object** — use `new Date(data.date + 'T12:00:00')`. Appending time prevents timezone off-by-one when converting "YYYY-MM-DD" from date inputs.

9. **`assetId` for new assets**: `${userId}_${assetName.replace(/\s+/g, '_').toLowerCase()}_${category}`

10. **`partial_sell` cost basis**: use `cbPerUnitIDR = totalCostBasisIDR / totalUnits`, NOT `avgCostPerUnit * rate`. The stored `avgCostPerUnit` is in the asset's original currency; multiplying by the sell entry's rate double-applies FX.

---

## Setup

```bash
cp .env.example .env   # fill in Firebase credentials
npm install
npm run dev            # development
npm run build          # tsc + vite build (what CI runs)
```

---

## What Is NOT Done Yet

- Translations (`t()`) only applied to: Dashboard, Portfolio, Settings, EntryForm, Navbar. Still hardcoded Indonesian in: `AssetDetailPage`, `JournalPage`, `OnboardingPage`, auth pages, `AssetCard`, modals.
- ~200+ inline `style={{}}` blocks not yet migrated to Tailwind classes.
- AI recommendation in `AssetDetailPage` is mock/static — not connected to a real model.
- No tests.
- Firestore Security Rules not documented here — check Firebase console.
