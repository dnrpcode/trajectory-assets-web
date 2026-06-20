# Trajectory

**Personal portfolio intelligence platform untuk investor retail Indonesia.**

Analisis portofolio, rebalancing otomatis, sinyal trading crypto, kalender dividen IDX, dan konsultasi AI — semuanya berbasis data investasi Anda secara real-time.

**Live:** [trajectory-assets.vercel.app](https://trajectory-assets.vercel.app)

---

## Fitur

| Halaman | Deskripsi |
|---|---|
| **Dashboard** | Nilai total portofolio, unrealized gain/loss, grafik historis, skor rebalancing |
| **Portfolio** | Daftar aset aktif dengan harga terkini, notifikasi stale, dan detail per-aset |
| **Asset Detail** | Riwayat harga, jurnal transaksi, dan analisis per-aset |
| **Trading** | Watchlist crypto dengan sinyal RSI + MA, setup entry/SL/TP, paper trading |
| **Dividen & Kupon** | Kalender dividen emiten IDX — yield, konsistensi, riwayat historis (data Yahoo Finance) |
| **Rebalancing** | Analisis deviasi alokasi aktual vs target berdasarkan profil risiko |
| **Simulasi CAGR** | Proyeksi nilai portofolio dengan asumsi return dan kontribusi bulanan |
| **Robo Advisor** | Chat AI berbasis data portofolio real-time, bisa update profil & target alokasi |
| **Jurnal** | Log semua transaksi (beli, jual, top up, income, fee, koreksi) |
| **Pengaturan** | Profil risiko, horizon investasi, bahasa (ID/EN), tema gelap/terang |
| **Panduan** | Guided tour interaktif seluruh fitur |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + TypeScript (strict) + Vite |
| Styling | Tailwind CSS v3 + CSS Custom Properties |
| State | TanStack Query v5 (server state) + Zustand (auth) |
| Forms | React Hook Form + Zod |
| Backend | Firebase Auth + Firestore |
| AI | OpenAI-compatible API (OpenRouter, Groq, dll) |
| Market Data | CoinGecko API (crypto) · Yahoo Finance via Vercel proxy (dividen IDX) |
| i18n | i18next — Bahasa Indonesia + English |
| Routing | React Router v6 |
| Charts | Recharts |
| Deployment | Vercel (Edge Functions untuk proxy Yahoo Finance) |

---

## Arsitektur

Project menggunakan **Clean Architecture** dengan struktur modular per-fitur (vertical slice):

```
src/
├── modules/
│   ├── auth/          Login, Register, Firebase auth listener
│   ├── user/          Onboarding wizard, Settings, user profile
│   ├── portfolio/     Portfolio, AssetDetail, entry ledger, projection engine
│   ├── dashboard/     Dashboard, Journal, Advisory, Simulasi CAGR
│   ├── trading/       Crypto watchlist, sinyal RSI+MA, paper trading
│   ├── advisor/       Robo Advisor (AI chat dengan konteks portofolio)
│   ├── income/        Kalender dividen IDX (Yahoo Finance)
│   ├── goals/         Financial goals
│   └── help/          HelpPage + guided tour
├── shared/
│   ├── ui/            Layout, Navbar, Button, Input, Modal, Spinner, dll
│   ├── utils/         cn, formatCurrency, calculations, formatDate, dll
│   ├── constants/     categories, platforms, allocationTargets
│   └── types/         AssetCategory, EntryType, RiskProfile, dll
├── data/
│   └── firebase/      Firebase config (db, auth)
├── i18n/              i18next config + locales (id.json, en.json)
├── infrastructure/
│   └── di/container.ts  Semua singleton + dependency injection
└── api/               Vercel Edge Functions (proxy Yahoo Finance)
    └── dividend/      /api/dividend/search · /api/dividend/chart
```

Setiap module mengikuti struktur yang sama:

```
modules/[name]/
├── domain/
│   ├── entities/      TypeScript interfaces (pure, no framework)
│   ├── repositories/  Interface contracts (I*Repository)
│   └── use-cases/     Business logic classes
├── data/              Firebase / API implementations
└── presentation/
    ├── hooks/         React Query + Zustand wrappers
    ├── pages/         Route components
    └── components/    Komponen khusus module ini
```

**Prinsip utama:**
- Domain layer tidak tahu tentang Firebase, React, atau provider apapun
- Semua entry Firestore **immutable** — Asset adalah *projection* yang di-recompute dari seluruh entry
- Ganti AI provider atau data source cukup swap implementasi di `container.ts`

---

## Setup

### 1. Clone & install

```bash
git clone https://github.com/dnrpcode/trajectory-assets.git
cd trajectory-assets
npm install
```

### 2. Konfigurasi environment

```bash
cp .env.example .env
```

Isi `.env`:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# AI Provider (format OpenAI-compatible: OpenRouter, Groq, OpenAI, dll)
VITE_AI_API_KEY=
VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### 3. Firebase setup

1. Buat project di [Firebase Console](https://console.firebase.google.com)
2. Aktifkan **Authentication** — Email/Password + Google
3. Aktifkan **Firestore Database**
4. Copy credentials ke `.env`

### 4. AI setup (opsional — untuk Robo Advisor)

**OpenRouter** (gratis, banyak model):
```env
VITE_AI_API_KEY=sk-or-v1-...
VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

**Groq** (lebih stabil & cepat):
```env
VITE_AI_API_KEY=gsk_...
VITE_AI_API_URL=https://api.groq.com/openai/v1/chat/completions
VITE_AI_MODEL=mixtral-8x7b-32768
```

### 5. Jalankan

```bash
npm run dev      # development (localhost:5173)
npm run build    # production build
```

### 6. Deploy ke Vercel

```bash
vercel --prod
```

Pastikan semua env vars sudah di-set di Vercel dashboard. Vercel Edge Functions di `api/` otomatis ter-deploy dan berfungsi sebagai proxy Yahoo Finance (bypass CORS).

---

## Deployment Notes

- **Vercel proxy** (`api/dividend/`) diperlukan agar request ke Yahoo Finance tidak diblokir CORS dari browser
- Proxy di-cache 5 menit di edge Vercel
- CoinGecko API diakses langsung dari browser (gratis, tanpa API key) — ada rate limit 429 yang sudah di-handle dengan retry logic

---

## Entry Types

| Type | Deskripsi |
|---|---|
| `new_position` | Buka posisi baru |
| `price_update` | Update harga terkini |
| `top_up` | Tambah unit ke posisi yang sudah ada |
| `partial_sell` | Jual sebagian |
| `full_sell` | Jual semua (menutup posisi) |
| `income` | Dividen, kupon, bunga |
| `fee` | Biaya platform, pajak |
| `correction` | Koreksi entry sebelumnya |

---

## Asset Categories

`saham` · `reksa_dana` · `obligasi_sbn` · `emas` · `kripto` · `cash` · `lainnya`

---

## Lisensi

MIT
