# Trajectory

**Personal portfolio intelligence platform untuk investor retail Indonesia.**

Analisis portofolio, rebalancing otomatis, dan konsultasi AI — semuanya berbasis data investasi Anda secara real-time.

---

## Fitur

- **Dashboard** — ringkasan nilai portofolio, unrealized gain/loss, skor rebalancing
- **Portfolio** — daftar aset aktif dengan tracking harga & notifikasi stale
- **Asset Detail** — riwayat harga, jurnal entry, dan analisis per-aset
- **Robo Advisor** — chat AI berbasis data portofolio real-time, bisa rekomendasikan dan langsung update profil risiko & target alokasi
- **Journal** — log semua transaksi investasi (beli, jual, top up, income, fee, koreksi)
- **Settings** — profil risiko, horizon investasi, tema, dan bahasa (ID/EN)

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React 18 + TypeScript (strict) + Vite |
| Styling | Tailwind CSS v3 + CSS Custom Properties |
| State | TanStack Query v5 (server) + Zustand (auth) |
| Forms | React Hook Form + Zod |
| Backend | Firebase Auth + Firestore |
| AI | OpenAI-compatible API (OpenRouter, Groq, dll) |
| i18n | i18next (Bahasa Indonesia + English) |
| Routing | React Router v6 |
| Charts | Recharts |

---

## Arsitektur

Project menggunakan **Clean Architecture** dengan event-sourced lite pattern:

```
src/
├── domain/            Pure business logic — tidak ada framework dependency
│   ├── entities/      TypeScript interfaces (Asset, User, dll)
│   ├── repositories/  Interface contracts (IUserRepository, IAIAdvisorRepository, dll)
│   └── use-cases/     Business operations (CreateEntry, SendAdvisorMessage, dll)
├── data/
│   ├── firebase/      Firebase repository implementations
│   └── ai/            AI advisor repository (OpenAI-compatible)
├── presentation/
│   ├── pages/         Route pages
│   ├── components/    UI, charts, forms, chat
│   └── hooks/         React Query + Zustand wrappers
├── infrastructure/
│   └── di/container.ts  Singleton instances + dependency injection
├── i18n/              i18next config + locale files (id.json, en.json)
└── shared/
    ├── utils/         formatCurrency, calculations, cn, dll
    ├── constants/     categories, platforms, allocationTargets
    └── types/         shared TypeScript types
```

**Prinsip utama:**
- Domain layer tidak tahu tentang Firebase, React, atau provider AI apapun
- Ganti AI provider cukup dengan swap implementasi di `container.ts` — tidak ada file lain yang berubah
- Semua entry Firestore immutable; Asset adalah projection yang di-compute ulang dari entry

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

Isi file `.env`:

```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# AI Provider (OpenRouter, Groq, OpenAI, dll — format OpenAI-compatible)
VITE_AI_API_KEY=
VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### 3. Firebase setup

1. Buat project di [Firebase Console](https://console.firebase.google.com)
2. Aktifkan **Authentication** (Email/Password + Google)
3. Aktifkan **Firestore Database**
4. Copy credentials ke `.env`

### 4. AI setup (opsional — untuk Robo Advisor)

Pilih salah satu provider gratis:

**OpenRouter** (openrouter.ai):
```env
VITE_AI_API_KEY=sk-or-v1-...
VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions
VITE_AI_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

**Groq** (console.groq.com) — lebih stabil & cepat:
```env
VITE_AI_API_KEY=gsk_...
VITE_AI_API_URL=https://api.groq.com/openai/v1/chat/completions
VITE_AI_MODEL=mixtral-8x7b-32768
```

### 5. Jalankan

```bash
npm run dev      # development
npm run build    # production build
```

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

## Ganti AI Provider

Karena menggunakan Clean Architecture, ganti provider AI tidak perlu ubah kode — cukup update `.env`:

```env
# Contoh: ganti ke Groq
VITE_AI_API_KEY=gsk_xxxxx
VITE_AI_API_URL=https://api.groq.com/openai/v1/chat/completions
VITE_AI_MODEL=mixtral-8x7b-32768
```

Implementasi ada di `src/data/ai/AIAdvisorRepository.ts` — menggunakan format OpenAI chat completions yang kompatibel dengan mayoritas provider modern.

---

## Lisensi

MIT
