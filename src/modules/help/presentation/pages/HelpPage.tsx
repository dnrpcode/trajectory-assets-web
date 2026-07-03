import { useState } from 'react';
import {
  ChevronDown, LayoutGrid, Activity, ShieldCheck, TrendingUp,
  MessageSquare, FileText, Settings, Play, BarChart2,
  CalendarDays, LineChart, PlusCircle, RefreshCw, Download,
  Pencil, Trash2, Zap, Target, BookOpen, ArrowRight,
} from 'lucide-react';
import { Layout } from '@/shared/ui/Layout';
import { useTour } from '@/shared/ui/TourContext';
import { useNavigate } from 'react-router-dom';

// ── Quick Start ───────────────────────────────────────────────────────────────

const QUICK_START_STEPS = [
  {
    n: '1',
    title: 'Catat aset pertamamu',
    desc: 'Buka Portfolio → klik "Posisi Baru". Isi nama aset, kategori, harga beli, jumlah unit, dan tanggal. Semua kelas aset didukung: saham, reksa dana, obligasi, emas, kripto, hingga kas.',
    icon: <PlusCircle size={18} />,
    route: '/portfolio',
    cta: 'Buka Portfolio',
  },
  {
    n: '2',
    title: 'Update harga setiap bulan',
    desc: 'Untuk aset IDX: buka detail aset → tab Pasar → klik Sync. Untuk aset lain: tambah entri "Update Harga". Ini menjaga nilai portofolio selalu akurat dan menghilangkan tanda stale ⚠.',
    icon: <RefreshCw size={18} />,
    route: '/portfolio',
    cta: 'Lihat Portfolio',
  },
  {
    n: '3',
    title: 'Pantau di Dashboard',
    desc: 'Dashboard merangkum total nilai, unrealized gain/loss, estimasi CAGR, skor rebalancing, dan grafik pertumbuhan portofolio. Cukup dibuka sekali sebulan setelah update harga.',
    icon: <LayoutGrid size={18} />,
    route: '/dashboard',
    cta: 'Buka Dashboard',
  },
  {
    n: '4',
    title: 'Tanya Robo Advisor',
    desc: 'AI memiliki akses penuh ke data portofoliomu. Tanya rekomendasi, analisis alokasi, atau simulasi skenario kapan saja. Tidak perlu copas data manual.',
    icon: <MessageSquare size={18} />,
    route: '/chat',
    cta: 'Mulai Chat',
  },
];

// ── Feature Cards ─────────────────────────────────────────────────────────────

interface FeatureCard {
  icon: React.ReactNode;
  title: string;
  color: string;
  route: string;
  badge?: string;
  points: string[];
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: <LayoutGrid size={16} strokeWidth={1.75} />,
    title: 'Dashboard',
    color: 'var(--blue-400)',
    route: '/dashboard',
    points: [
      'Total nilai & unrealized gain/loss portofolio',
      'Estimasi CAGR dari data historis aktual',
      'Skor rebalancing 0–100 vs target alokasi',
      'Grafik pertumbuhan portofolio historis',
      'Alokasi aktual per kelas aset (pie chart)',
    ],
  },
  {
    icon: <Activity size={16} strokeWidth={1.75} />,
    title: 'Portfolio',
    color: 'var(--blue-400)',
    route: '/portfolio',
    points: [
      'Catat & pantau semua kelas aset dalam satu tempat',
      'Ledger immutable: setiap transaksi tersimpan permanen',
      'Edit log via koreksi (bukan overwrite) menjaga audit trail',
      'Ekspor ke CSV untuk laporan pajak',
      'Aset kas tidak perlu update harga bulanan',
    ],
  },
  {
    icon: <Activity size={16} strokeWidth={1.75} />,
    title: 'Detail Aset',
    color: 'var(--blue-300)',
    route: '/portfolio',
    points: [
      'Lihat semua entri transaksi per aset',
      'Sync harga pasar IDX real-time (1 klik)',
      'Estimasi harga & analisis teknikal (RSI, Bollinger, MA)',
      'Simulasi Monte Carlo (2.000 skenario) untuk next close',
      'AI Insight otomatis: ringkasan kondisi aset',
    ],
  },
  {
    icon: <LineChart size={16} strokeWidth={1.75} />,
    title: 'Estimasi & Teknikal',
    color: 'var(--blue-300)',
    route: '/portfolio',
    badge: 'Saham IDX',
    points: [
      'Estimasi harga 1D / 7D / 30D / 1Y (base & bear/bull case)',
      'RSI 14-period: sinyal oversold/overbought',
      'Bollinger Band: volatilitas & posisi harga',
      'Moving Average 20 & 50: tren jangka menengah',
      'Support & Resistance level historis',
    ],
  },
  {
    icon: <ShieldCheck size={16} strokeWidth={1.75} />,
    title: 'Audit Rebalancing',
    color: 'var(--blue-400)',
    route: '/dashboard',
    points: [
      'Bandingkan alokasi aktual vs target sesuai profil risiko',
      'Saran konkret: aset mana yang perlu ditambah/kurangi',
      'Target alokasi otomatis berubah saat ganti profil risiko',
      'Skor 100 = alokasi tepat, turun jika ada deviasi >5%',
    ],
  },
  {
    icon: <TrendingUp size={16} strokeWidth={1.75} />,
    title: 'Simulasi CAGR',
    color: 'var(--blue-400)',
    route: '/projections',
    points: [
      'Proyeksi nilai portofolio 5/10/20/30 tahun ke depan',
      'Skenario optimis, base, dan pesimis',
      'Rate CAGR dari data historis portofolio aktual',
      'Simulasi tambahan rutin bulanan (DCA)',
    ],
  },
  {
    icon: <CalendarDays size={16} strokeWidth={1.75} />,
    title: 'Dividen & Kupon',
    color: 'var(--gain-400)',
    route: '/income',
    badge: 'IDX',
    points: [
      'Lacak riwayat dividen saham IDX (Yahoo Finance)',
      'Yield trailing 12 bulan otomatis dihitung',
      'Konsistensi pembayaran: berapa tahun dari 5 tahun terakhir',
      'Watchlist dividen: pantau beberapa emiten sekaligus',
    ],
  },
  {
    icon: <BarChart2 size={16} strokeWidth={1.75} />,
    title: 'Trading & Kripto',
    color: 'var(--warn-400)',
    route: '/trading',
    badge: 'CoinGecko',
    points: [
      'Watchlist kripto real-time (harga, volume, market cap)',
      'Scanner sinyal RSI: oversold/overbought otomatis',
      'Paper trading: simulasi beli/jual dengan saldo virtual',
      'Detail coin: grafik harga historis & statistik pasar',
    ],
  },
  {
    icon: <MessageSquare size={16} strokeWidth={1.75} />,
    title: 'Robo Advisor',
    color: 'var(--ai-accent)',
    route: '/chat',
    badge: 'AI',
    points: [
      'Chat AI dengan konteks portofoliomu secara real-time',
      'Analisis alokasi, rekomendasi, dan saran rebalancing',
      'Bisa langsung ubah profil risiko & target alokasi via chat',
      'Histori percakapan opsional (aktifkan di Pengaturan)',
    ],
  },
  {
    icon: <FileText size={16} strokeWidth={1.75} />,
    title: 'Jurnal Transaksi',
    color: 'var(--blue-400)',
    route: '/journal',
    points: [
      'Semua entri transaksi dalam satu tampilan kronologis',
      'Filter per aset, kategori, atau tipe entri',
      'Entri koreksi: batalkan transaksi salah tanpa menghapus',
      'Audit trail lengkap: setiap perubahan tersimpan',
    ],
  },
  {
    icon: <Target size={16} strokeWidth={1.75} />,
    title: 'Goals Keuangan',
    color: 'var(--gain-400)',
    route: '/dashboard',
    points: [
      'Buat target finansial dengan nominal & tenggat waktu',
      'Pantau progres dari nilai portofolio saat ini',
      'Estimasi kapan target tercapai berdasarkan CAGR',
    ],
  },
  {
    icon: <Settings size={16} strokeWidth={1.75} />,
    title: 'Pengaturan',
    color: 'var(--text-muted)',
    route: '/settings',
    points: [
      'Profil risiko: konservatif / moderat / agresif',
      'Horizon investasi: pendek / menengah / panjang',
      'Bahasa: Bahasa Indonesia & English',
      'Tema: Dark & Light mode',
      'Aktifkan/nonaktifkan konteks portofolio untuk AI',
    ],
  },
];

// ── Entry Types ───────────────────────────────────────────────────────────────

const ENTRY_TYPES = [
  { type: 'Posisi Baru', desc: 'Pembelian aset yang belum ada di portofolio', color: 'var(--gain-400)' },
  { type: 'Top Up', desc: 'Pembelian tambahan aset yang sudah ada', color: 'var(--gain-400)' },
  { type: 'Jual Sebagian', desc: 'Penjualan sebagian unit aset', color: 'var(--loss-400)' },
  { type: 'Jual Semua', desc: 'Penjualan seluruh unit, menutup posisi', color: 'var(--loss-400)' },
  { type: 'Update Harga', desc: 'Catat harga pasar terkini (wajib tiap bulan)', color: 'var(--blue-400)' },
  { type: 'Pendapatan', desc: 'Dividen, kupon, bunga yang diterima', color: 'var(--gain-400)' },
  { type: 'Biaya / Fee', desc: 'Biaya platform, pajak, atau fee lainnya', color: 'var(--loss-400)' },
  { type: 'Koreksi', desc: 'Batalkan entri sebelumnya yang salah', color: 'var(--warn-400)' },
];

// ── Pro Tips ──────────────────────────────────────────────────────────────────

const PRO_TIPS = [
  { icon: <RefreshCw size={14} />, text: 'Update harga di awal bulan supaya grafik pertumbuhan portofolio dan skor rebalancing selalu akurat.' },
  { icon: <Download size={14} />, text: 'Ekspor CSV dari halaman Portfolio setiap akhir tahun untuk kebutuhan laporan pajak.' },
  { icon: <Pencil size={14} />, text: 'Salah input? Gunakan fitur Edit Log (ikon pensil di detail aset) — entri lama dikoreksi otomatis, audit trail tetap terjaga.' },
  { icon: <Trash2 size={14} />, text: 'Hapus aset hanya jika memang tidak pernah ada. Untuk aset yang sudah dijual, gunakan entri "Jual Semua" agar riwayat terjaga.' },
  { icon: <Zap size={14} />, text: 'Untuk saham IDX, tombol Sync di tab Pasar langsung membuat entri Update Harga dengan harga terkini — tidak perlu input manual.' },
  { icon: <BookOpen size={14} />, text: 'Kas (tabungan, deposito) tidak perlu update harga bulanan — sistem otomatis tidak menandainya sebagai stale.' },
];

// ── Glossary ──────────────────────────────────────────────────────────────────

const GLOSSARY = [
  { term: 'CAGR', def: 'Compound Annual Growth Rate — tingkat pertumbuhan majemuk tahunan portofolio.' },
  { term: 'Unrealized Gain', def: 'Keuntungan di atas kertas dari aset yang belum dijual.' },
  { term: 'Avg Cost', def: 'Rata-rata harga beli per unit, disesuaikan tiap kali top up.' },
  { term: 'Cost Basis', def: 'Total modal yang diinvestasikan untuk suatu aset (unit × avg cost × kurs).' },
  { term: 'Rebalancing', def: 'Penyesuaian ulang proporsi aset agar sesuai target alokasi.' },
  { term: 'RSI', def: 'Relative Strength Index — indikator momentum 0–100; <30 oversold, >70 overbought.' },
  { term: 'Monte Carlo', def: 'Simulasi probabilistik dengan ribuan skenario acak untuk estimasi harga.' },
  { term: 'Support / Resistance', def: 'Level harga historis tempat harga sering berbalik arah.' },
  { term: 'Yield', def: 'Imbal hasil dividen: total dividen 12 bulan ÷ harga saham × 100%.' },
  { term: 'Stale', def: 'Aset ditandai stale jika harganya belum diperbarui di bulan berjalan.' },
  { term: 'Ledger', def: 'Catatan transaksi immutable — entri tidak pernah dihapus, hanya dikoreksi.' },
  { term: 'Paper Trading', def: 'Simulasi trading dengan saldo virtual, tanpa uang nyata.' },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS: Array<{ section: string; icon: React.ReactNode; color?: string; items: Array<{ q: string; a: string }> }> = [
  {
    section: 'Portfolio & Entri',
    icon: <Activity size={15} strokeWidth={1.75} />,
    items: [
      { q: 'Bagaimana cara menambah aset baru?', a: 'Klik "Posisi Baru" di halaman Portfolio. Pilih kategori aset, isi nama (dan ticker untuk saham IDX, misal BBCA), platform, harga beli per unit, jumlah unit, mata uang, dan tanggal. Sistem akan otomatis menghitung cost basis dan rata-rata harga beli.' },
      { q: 'Apa perbedaan Top Up dengan Posisi Baru?', a: '"Posisi Baru" digunakan saat aset belum ada di portofolio. "Top Up" digunakan untuk pembelian tambahan aset yang sudah ada — sistem akan mengupdate rata-rata harga beli (weighted average) secara otomatis.' },
      { q: 'Apa yang dimaksud aset stale dan bagaimana cara memperbaikinya?', a: 'Aset ditandai stale (ikon ⚠) jika harganya belum diperbarui di bulan berjalan. Untuk saham IDX: buka detail aset → tab Pasar → klik Sync. Untuk aset lain: tambah entri "Update Harga" dengan harga terkini. Aset kas tidak pernah ditandai stale.' },
      { q: 'Bagaimana cara mengedit entri yang sudah tercatat?', a: 'Buka detail aset → klik ikon pensil (✏) di samping entri yang ingin diubah. Isi kolom yang perlu diubah, lalu simpan. Sistem akan menandai entri lama sebagai "dikoreksi" dan membuat entri baru — audit trail tetap terjaga.' },
      { q: 'Bagaimana cara menghapus aset?', a: 'Buka detail aset, scroll ke bawah, klik "Hapus Aset". Semua entri terkait juga akan dihapus permanen. Jika aset sudah dijual habis, lebih baik gunakan entri "Jual Semua" agar riwayat tetap tersimpan.' },
      { q: 'Bisakah mencatat aset dalam mata uang asing?', a: 'Ya. Saat membuat entri, pilih mata uang (USD, SGD, dll.) dan isi kurs ke IDR. Sistem akan mengkonversi ke IDR untuk perhitungan portofolio total.' },
    ],
  },
  {
    section: 'Dashboard & Perhitungan',
    icon: <LayoutGrid size={15} strokeWidth={1.75} />,
    items: [
      { q: 'Dari mana angka Est. CAGR di Dashboard berasal?', a: 'CAGR dihitung dari data historis portofoliomu sendiri: (nilai sekarang / nilai pertama)^(1/tahun) - 1. Jika riwayat portofolio kurang dari 1 tahun, estimasi menggunakan kecepatan pertumbuhan yang diannualisasi.' },
      { q: 'Mengapa grafik pertumbuhan portofolio terlihat flat?', a: 'Grafik menggunakan data historis yang dibackfill dari entri transaksi. Untuk saham IDX yang punya ticker, harga historis diambil dari Yahoo Finance secara otomatis. Jika tidak ada ticker atau data pasar tidak tersedia, grafik akan menggunakan harga beli terakhir sebagai fallback — sehingga bisa terlihat flat untuk aset non-saham.' },
      { q: 'Apa itu Skor Rebalancing?', a: 'Skor 0–100 yang menunjukkan seberapa sesuai alokasi aset aktualmu dengan target alokasi sesuai profil risiko. Skor 100 = alokasi tepat sasaran. Setiap deviasi 5% dari target mengurangi skor. Target alokasi bisa diubah via Pengaturan → Profil Risiko.' },
    ],
  },
  {
    section: 'Saham IDX & Analisis Teknikal',
    icon: <LineChart size={15} strokeWidth={1.75} />,
    color: 'var(--blue-300)',
    items: [
      { q: 'Bagaimana cara melihat harga saham IDX secara real-time?', a: 'Buka detail aset saham IDX (pastikan ticker diisi, misal BBCA), lalu klik tab Pasar. Panel harga akan menampilkan harga terakhir dari Yahoo Finance. Klik tombol "Sync" untuk otomatis membuat entri Update Harga.' },
      { q: 'Apa itu Estimasi Penutupan Berikutnya?', a: 'Sistem menjalankan 2.000 simulasi Monte Carlo menggunakan model Geometric Brownian Motion berdasarkan volatilitas dan return historis. Hasilnya berupa rentang probabilistik: harga terendah (bear case, P10), tengah (base case, median), dan tertinggi (bull case, P90).' },
      { q: 'Apa yang dimaksud RSI, Bollinger Band, dan MA di analisis teknikal?', a: 'RSI (Relative Strength Index): momentum 0–100, <30 oversold (sinyal beli potensial), >70 overbought (sinyal jual potensial). Bollinger Band: pita volatilitas di atas/bawah MA — harga di atas pita atas = overbought, di bawah pita bawah = oversold. Moving Average 20 & 50: tren jangka pendek dan menengah.' },
    ],
  },
  {
    section: 'Dividen & Kupon',
    icon: <CalendarDays size={15} strokeWidth={1.75} />,
    color: 'var(--gain-400)',
    items: [
      { q: 'Bagaimana cara melacak dividen saham IDX?', a: 'Buka halaman Dividen & Kupon, cari ticker saham (ketik BBCA, TLKM, dll. — tanpa .JK). Klik "Tambah ke Watchlist" untuk memantau secara berkala. Data riwayat dividen 5 tahun dan yield trailing 12 bulan ditampilkan otomatis.' },
      { q: 'Apa itu konsistensi pembayaran dividen?', a: 'Konsistensi dihitung dari jumlah tahun unik (dari 5 tahun terakhir) yang memiliki minimal 1 pembayaran dividen. Nilai 5/5 berarti perusahaan membayar dividen setiap tahun selama 5 tahun terakhir.' },
      { q: 'Dari mana data dividen diambil?', a: 'Data diambil dari Yahoo Finance via proxy Vercel (untuk menghindari CORS). Data bersifat historis dan di-cache 5 menit di edge. Untuk aset non-IDX atau yang tidak terdaftar di Yahoo Finance, data mungkin tidak tersedia.' },
    ],
  },
  {
    section: 'Trading & Kripto',
    icon: <BarChart2 size={15} strokeWidth={1.75} />,
    color: 'var(--warn-400)',
    items: [
      { q: 'Apa yang bisa dilakukan di halaman Trading?', a: 'Halaman Trading menyediakan: (1) Watchlist kripto real-time dari CoinGecko — tambah koin yang ingin dipantau, (2) Scanner sinyal RSI otomatis untuk semua koin di watchlist, (3) Paper trading — simulasi beli/jual dengan saldo virtual.' },
      { q: 'Apa itu Paper Trading dan apakah uang sungguhan digunakan?', a: 'Paper trading adalah simulasi murni menggunakan saldo virtual (tidak ada uang nyata yang digunakan). Ini berguna untuk berlatih strategi trading atau menguji sinyal sebelum eksekusi nyata. Saldo awal virtual ditentukan saat setup.' },
      { q: 'Bagaimana cara membaca sinyal RSI di scanner?', a: 'Scanner menampilkan RSI 14-period berdasarkan harga harian. RSI < 30 = sinyal oversold (potensi rebound). RSI > 70 = sinyal overbought (potensi koreksi). Sinyal ini bersifat indikatif dan bukan rekomendasi finansial.' },
    ],
  },
  {
    section: 'Robo Advisor (AI)',
    icon: <MessageSquare size={15} strokeWidth={1.75} />,
    color: 'var(--ai-accent)',
    items: [
      { q: 'Apa yang bisa dilakukan Robo Advisor?', a: 'Robo Advisor adalah AI (via OpenRouter) yang memiliki akses ke data portofoliomu secara real-time: semua aset, nilai, alokasi, profil risiko, unrealized gain/loss, dll. Kamu bisa tanya analisis, rekomendasi rebalancing, saran aset, proyeksi, atau pertanyaan keuangan umum.' },
      { q: 'Apakah AI bisa mengubah data portofolio saya?', a: 'Tidak langsung. AI hanya bisa merekomendasikan perubahan profil risiko atau target alokasi — jika disetujui, Robo Advisor akan memperbarui pengaturanmu. AI tidak bisa membuat atau menghapus entri transaksi.' },
      { q: 'Bagaimana cara mengaktifkan konteks portofolio untuk AI?', a: 'Buka Pengaturan → aktifkan "Sertakan data portofolio untuk AI". Jika diaktifkan, setiap percakapan akan menyertakan snapshot data asetmu sebagai konteks. Jika dinonaktifkan, AI hanya menjawab pertanyaan umum tanpa data personal.' },
    ],
  },
  {
    section: 'Pengaturan & Akun',
    icon: <Settings size={15} strokeWidth={1.75} />,
    items: [
      { q: 'Apa pengaruh Profil Risiko terhadap aplikasi?', a: 'Profil Risiko menentukan target alokasi aset ideal yang digunakan untuk Skor Rebalancing dan saran rebalancing di Dashboard. Konservatif = lebih banyak obligasi/emas; Agresif = lebih banyak saham/kripto. Bisa diubah kapan saja di Pengaturan.' },
      { q: 'Bagaimana cara mengubah bahasa aplikasi?', a: 'Buka Pengaturan → bagian Akun → klik tombol ID / EN untuk beralih antara Bahasa Indonesia dan English.' },
      { q: 'Apakah data saya aman?', a: 'Data tersimpan di Firebase Firestore dengan aturan keamanan yang memastikan hanya kamu yang bisa membaca dan menulis datamu sendiri (verifikasi via Firebase Auth). Semua komunikasi dienkripsi via HTTPS.' },
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--border-dim)' }}>
      <button className="w-full flex items-center justify-between py-3.5 text-left gap-3" onClick={() => setOpen((v) => !v)}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{q}</span>
        <ChevronDown
          size={15} strokeWidth={2} className="flex-shrink-0 transition-transform duration-200"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
        />
      </button>
      {open && <p className="pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{a}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase mb-4" style={{ color: 'var(--blue-400)', letterSpacing: 'var(--tracking-caps)' }}>
      {children}
    </p>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function HelpPage() {
  const { start } = useTour();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'guide' | 'faq'>('guide');

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, letterSpacing: 'var(--tracking-snug)' }}>
            Panduan Fitur
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
            Semua yang perlu kamu tahu untuk menggunakan Trajectory secara optimal.
          </p>
        </div>
        <button
          onClick={start}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: 'var(--blue-400)', border: 'none',
            color: '#fff', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 0 12px rgba(77,124,255,0.3)',
          }}
        >
          <Play size={13} strokeWidth={2.5} style={{ fill: '#fff' }} />
          Tour Interaktif
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        {(['guide', 'faq'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 18px', borderRadius: 9, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: activeTab === tab ? 'var(--bg-raised)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
          >
            {tab === 'guide' ? 'Panduan Fitur' : 'FAQ'}
          </button>
        ))}
      </div>

      {activeTab === 'guide' ? (
        <div className="space-y-8">

          {/* Quick Start */}
          <div>
            <SectionLabel>Mulai dari sini</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUICK_START_STEPS.map((step) => (
                <div
                  key={step.n}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: 'var(--blue-tint)', color: 'var(--blue-400)' }}
                    >
                      {step.n}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ color: 'var(--blue-400)' }}>{step.icon}</span>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{step.title}</span>
                      </div>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(step.route)}
                    className="flex items-center gap-1.5 text-xs font-semibold self-start"
                    style={{ color: 'var(--blue-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {step.cta} <ArrowRight size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Cards */}
          <div>
            <SectionLabel>Semua fitur</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {FEATURE_CARDS.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl p-5 flex flex-col gap-3 cursor-pointer group"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', transition: 'border-color 0.15s' }}
                  onClick={() => navigate(card.route)}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span style={{ color: card.color }}>{card.icon}</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{card.title}</span>
                    </div>
                    {card.badge && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)' }}
                      >
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {card.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span className="mt-1 flex-shrink-0 w-1 h-1 rounded-full" style={{ background: card.color }} />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Entry Types */}
          <div>
            <SectionLabel>Tipe entri transaksi</SectionLabel>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              {ENTRY_TYPES.map((e, i) => (
                <div
                  key={e.type}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ borderBottom: i < ENTRY_TYPES.length - 1 ? '1px solid var(--border-dim)' : 'none' }}
                >
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 w-32 text-center"
                    style={{ background: `color-mix(in srgb, ${e.color} 12%, transparent)`, color: e.color }}
                  >
                    {e.type}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{e.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tips */}
          <div>
            <SectionLabel>Tips & trik</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {PRO_TIPS.map((tip, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="mt-0.5 flex-shrink-0" style={{ color: 'var(--blue-400)' }}>{tip.icon}</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{tip.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Glossary */}
          <div>
            <SectionLabel>Glosarium istilah</SectionLabel>
            <div className="rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {GLOSSARY.map((g, i) => (
                  <div
                    key={g.term}
                    className="flex gap-3 px-5 py-3 text-xs"
                    style={{
                      borderBottom: i < GLOSSARY.length - 1 ? '1px solid var(--border-dim)' : 'none',
                      borderRight: i % 2 === 0 && i < GLOSSARY.length - 1 ? '1px solid var(--border-dim)' : 'none',
                    }}
                  >
                    <span className="font-bold flex-shrink-0 w-28" style={{ color: 'var(--text-primary)' }}>{g.term}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{g.def}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* FAQ Tab */
        <div className="space-y-4">
          {FAQS.map((section) => (
            <div
              key={section.section}
              className="rounded-2xl"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: section.color ?? 'var(--blue-400)' }}>{section.icon}</span>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
                  {section.section}
                </h2>
              </div>
              <div className="px-6">
                {section.items.map((item) => <AccordionItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
