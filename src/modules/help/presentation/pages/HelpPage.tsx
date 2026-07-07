import { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, LayoutGrid, Activity, ShieldCheck, TrendingUp,
  MessageSquare, FileText, Settings, Play, BarChart2,
  CalendarDays, PlusCircle, RefreshCw, Download,
  Pencil, Zap, ArrowRight, Bot, Search, CheckCircle2, Target,
} from 'lucide-react';
import { Layout } from '@/shared/ui/Layout';
import { useTour } from '@/shared/ui/TourContext';
import { useNavigate } from 'react-router-dom';

// ── Tiny demo helpers ──────────────────────────────────────────────────────────

function DRow({ l, r, lc = 'var(--text-secondary)', rc = 'var(--text-primary)', style }: {
  l: React.ReactNode; r: React.ReactNode;
  lc?: string; rc?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...style }}>
      <span style={{ fontSize: 11, color: lc }}>{l}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: rc }}>{r}</span>
    </div>
  );
}

function DCard({ children, style, hi }: { children: React.ReactNode; style?: React.CSSProperties; hi?: boolean }) {
  return (
    <div style={{
      background: hi ? 'color-mix(in srgb, var(--blue-400) 7%, var(--bg-raised))' : 'var(--bg-raised)',
      border: hi ? '1px solid color-mix(in srgb, var(--blue-400) 22%, transparent)' : '1px solid transparent',
      borderRadius: 10, padding: '8px 11px', ...style,
    }}>
      {children}
    </div>
  );
}

function DChip({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, lineHeight: 1, flexShrink: 0,
      background: `color-mix(in srgb, ${color} 14%, transparent)`,
      color, borderRadius: 5, padding: '2px 6px',
    }}>
      {label}
    </span>
  );
}

// ── Demo Step Components ──────────────────────────────────────────────────────
// Each component remounts on step change (via key) so CSS animations restart.

/* Portfolio */
function DemoPortfolio1() {
  const assets = [
    { name: 'BBCA', cat: 'Saham', val: 'Rp 35,4 jt', gain: '+8.2%', d: 0 },
    { name: 'Reksa Dana Pendapatan X', cat: 'Reksa Dana', val: 'Rp 15 jt', gain: '+3.1%', d: 0.07 },
    { name: 'SBR013', cat: 'Obligasi', val: 'Rp 10 jt', gain: '+6.5%', d: 0.14 },
    { name: 'Tabungan BCA', cat: 'Kas', val: 'Rp 8 jt', gain: '—', d: 0.21 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Portofolio</span>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'var(--blue-400)', color: '#fff', border: 'none',
          borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          animation: 'demo-pulse-blue 1.8s ease infinite',
        }}>
          <PlusCircle size={11} strokeWidth={2.5} /> Posisi Baru
        </button>
      </div>
      {assets.map(a => (
        <DCard key={a.name} style={{ animation: `demo-slide-right 0.35s ease ${a.d}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{a.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{a.cat}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{a.val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 1, color: a.gain === '—' ? 'var(--text-muted)' : 'var(--gain-400)' }}>{a.gain}</div>
            </div>
          </div>
        </DCard>
      ))}
    </div>
  );
}

function DemoPortfolio2() {
  const fields = [
    { l: 'Nama Aset', v: 'Bank Central Asia (BBCA)', cursor: true },
    { l: 'Kategori', v: 'Saham' },
    { l: 'Harga Beli / Unit', v: 'Rp 9.250', active: true },
    { l: 'Jumlah', v: '100 lot (10.000 lbr)' },
    { l: 'Tanggal', v: '4 Jul 2026' },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>Posisi Baru</div>
      {fields.map((f, i) => (
        <div key={f.l} style={{ animation: `demo-fadein 0.3s ease ${i * 0.07}s both` }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 2, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.l}</div>
          <div style={{
            background: 'var(--bg-raised)', borderRadius: 8, padding: '5px 10px',
            fontSize: 11, color: 'var(--text-primary)',
            border: f.active ? '1px solid var(--blue-400)' : '1px solid var(--border-dim)',
            display: 'flex', alignItems: 'center',
          }}>
            <span style={{ flex: 1 }}>{f.v}</span>
            {f.cursor && <span style={{ color: 'var(--blue-400)', animation: 'demo-blink 1s step-end infinite', marginLeft: 2 }}>|</span>}
          </div>
        </div>
      ))}
      <button style={{
        width: '100%', background: 'var(--blue-400)', color: '#fff', border: 'none',
        borderRadius: 8, padding: '7px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 2,
        animation: 'demo-pulse-blue 1.5s ease 0.6s infinite',
      }}>Simpan Transaksi</button>
    </div>
  );
}

function DemoPortfolio3() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Portofolio</span>
        <button style={{ background: 'var(--blue-400)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 11px', fontSize: 11, fontWeight: 700 }}>+ Posisi Baru</button>
      </div>
      <div style={{
        background: 'color-mix(in srgb, var(--gain-400) 8%, var(--bg-raised))',
        border: '1px solid color-mix(in srgb, var(--gain-400) 30%, transparent)',
        borderRadius: 10, padding: '8px 11px',
        animation: 'demo-scale-in 0.45s ease both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>BBCA</span>
              <DChip label="Baru ✓" color="var(--gain-400)" />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>Saham · 100 lot · Avg Rp 9.250</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>Rp 92,5 jt</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginTop: 1 }}>+0.0%</div>
          </div>
        </div>
      </div>
      {[
        { name: 'Reksa Dana Pendapatan X', cat: 'Reksa Dana', val: 'Rp 15 jt', gain: '+3.1%', d: 0.07 },
        { name: 'SBR013', cat: 'Obligasi', val: 'Rp 10 jt', gain: '+6.5%', d: 0.14 },
        { name: 'Tabungan BCA', cat: 'Kas', val: 'Rp 8 jt', gain: '—', d: 0.21 },
      ].map(a => (
        <DCard key={a.name} style={{ animation: `demo-fadein 0.3s ease ${a.d}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{a.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{a.cat}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{a.val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 1, color: a.gain === '—' ? 'var(--text-muted)' : 'var(--gain-400)' }}>{a.gain}</div>
            </div>
          </div>
        </DCard>
      ))}
    </div>
  );
}

/* Dashboard */
function DemoDashboard1() {
  const stats = [
    { l: 'Total Nilai', v: 'Rp 125,4 jt', s: '+Rp 19,2 jt', c: 'var(--gain-400)', d: 0 },
    { l: 'Est. CAGR', v: '14,3%', s: 'Sejak 2022', c: 'var(--blue-400)', d: 0.08 },
    { l: 'Unrealized Gain', v: '+15,3%', s: '+Rp 19,2 jt', c: 'var(--gain-400)', d: 0.16 },
    { l: 'Skor Rebalancing', v: '74', s: '/ 100', c: 'var(--warn-400)', d: 0.24 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
        {stats.map(c => (
          <DCard key={c.l} style={{ animation: `demo-fadein 0.35s ease ${c.d}s both` }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{c.l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c.c, lineHeight: 1 }}>{c.v}</div>
            <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 3 }}>{c.s}</div>
          </DCard>
        ))}
      </div>
      <DCard style={{ animation: 'demo-fadein 0.35s ease 0.35s both' }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 7 }}>Alokasi Aset</div>
        <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 }}>
          {[
            { w: '48%', c: 'var(--blue-400)', d: 0 },
            { w: '20%', c: 'var(--gain-400)', d: 0.1 },
            { w: '13%', c: '#fbbf24', d: 0.2 },
            { w: '11%', c: '#c084fc', d: 0.3 },
            { w: '8%', c: 'var(--text-secondary)', d: 0.4 },
          ].map((s, i) => (
            <div key={i} style={{ width: s.w, background: s.c, borderRadius: 3, transformOrigin: 'left', animation: `demo-grow-x 0.5s ease ${s.d}s both` }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
          {['Saham 48%', 'RD 20%', 'Kripto 13%', 'Obligasi 11%'].map(l => (
            <span key={l} style={{ fontSize: 9, color: 'var(--text-secondary)' }}>{l}</span>
          ))}
        </div>
      </DCard>
    </div>
  );
}

function DemoDashboard2() {
  const vals = '10,88 35,80 60,74 85,77 108,65 130,57 152,52 172,46 195,38 220,30 240,22';
  const cost = '10,88 35,80 60,74 85,74 108,72 130,70 152,68 172,66 195,64 220,62 240,60';
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Pertumbuhan Portofolio</span>
        <DChip label="3 tahun" color="var(--blue-400)" />
      </div>
      <div style={{ flex: 1, background: 'var(--bg-raised)', borderRadius: 10, padding: '8px 6px', overflow: 'hidden' }}>
        <svg viewBox="0 0 250 96" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4d7cff" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#4d7cff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={`M${vals.replace(/(\d+),(\d+)/g, '$1,$2')} L240,96 L10,96 Z`} fill="url(#dg1)" />
          <polyline points={cost} fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeDasharray="4 3" style={{ opacity: 0, animation: 'demo-fadein 0.3s ease 1.6s forwards' }} />
          <polyline points={vals} fill="none" stroke="var(--blue-400)" strokeWidth="2" strokeDasharray="280" style={{ animation: 'demo-draw-line 1.8s ease both' }} />
          <circle cx="240" cy="22" r="3.5" fill="var(--blue-400)" style={{ opacity: 0, animation: 'demo-scale-in 0.3s ease 1.9s forwards' }} />
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        {[
          { l: 'Nilai', c: 'var(--blue-400)', dash: false },
          { l: 'Modal', c: 'var(--text-muted)', dash: true },
        ].map(lg => (
          <div key={lg.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 14, height: 2, background: lg.c, borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{lg.l}</span>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {['Rp 125,4 jt', '+Rp 19,2 jt'].map((v, i) => (
            <span key={v} style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? 'var(--text-primary)' : 'var(--gain-400)' }}>{v}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoDashboard3() {
  const allocs = [
    { l: 'Saham', actual: 48, target: 55, c: 'var(--blue-400)', d: 0 },
    { l: 'Reksa Dana', actual: 20, target: 20, c: 'var(--gain-400)', d: 0.08 },
    { l: 'Kripto', actual: 13, target: 10, c: '#fbbf24', d: 0.16 },
    { l: 'Obligasi', actual: 11, target: 10, c: '#c084fc', d: 0.24 },
    { l: 'Kas', actual: 8, target: 5, c: 'var(--text-secondary)', d: 0.32 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Audit Rebalancing</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--warn-400)', animation: 'demo-fadein 0.5s ease both' }}>74</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/100</span>
        </div>
      </div>
      {allocs.map(a => (
        <div key={a.l} style={{ animation: `demo-fadein 0.3s ease ${a.d}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{a.l}</span>
            <span style={{ fontSize: 10 }}>
              <span style={{ color: Math.abs(a.actual - a.target) > 3 ? 'var(--warn-400)' : 'var(--gain-400)', fontWeight: 600 }}>{a.actual}%</span>
              <span style={{ color: 'var(--text-muted)' }}> vs {a.target}%</span>
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--bg-raised)', borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${a.target}%`, background: 'var(--border-default)', borderRadius: 3 }} />
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${a.actual}%`, background: a.c, borderRadius: 3, transformOrigin: 'left', animation: `demo-grow-x 0.5s ease ${a.d + 0.1}s both` }} />
          </div>
        </div>
      ))}
      <DCard style={{ marginTop: 2, background: 'color-mix(in srgb, var(--blue-400) 6%, var(--bg-raised))', border: '1px solid color-mix(in srgb, var(--blue-400) 18%, transparent)', animation: 'demo-fadein 0.4s ease 0.5s both' }}>
        <span style={{ fontSize: 10, color: 'var(--blue-400)', fontWeight: 600 }}>💡 </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Tambah Saham +7% untuk mencapai target alokasi profil agresif</span>
      </DCard>
    </div>
  );
}

/* Sync Harga */
function DemoSync1() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>BBCA · Detail Aset</span>
      <DCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>BBCA</span>
              <DChip label="⚠ Stale" color="var(--warn-400)" />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Saham IDX · 100 lot</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Rp 88,0 jt</div>
            <div style={{ fontSize: 10, color: 'var(--gain-400)' }}>+Rp 3 jt (+3.5%)</div>
          </div>
        </div>
      </DCard>
      <DCard style={{ background: 'color-mix(in srgb, var(--warn-400) 6%, var(--bg-raised))', border: '1px solid color-mix(in srgb, var(--warn-400) 22%, transparent)', animation: 'demo-fadein 0.4s ease 0.2s both' }}>
        <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
          <span>⚠️</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warn-400)' }}>Harga perlu diperbarui</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Terakhir update 4 bulan lalu (Rp 8.800/lbr). Harga pasar mungkin sudah berubah.</div>
          </div>
        </div>
      </DCard>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        {['Ringkasan', 'Pasar', 'Log Transaksi'].map(t => (
          <button key={t} style={{
            padding: '4px 10px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600,
            background: t === 'Pasar' ? 'var(--blue-400)' : 'var(--bg-raised)',
            color: t === 'Pasar' ? '#fff' : 'var(--text-muted)', cursor: 'pointer',
            animation: t === 'Pasar' ? 'demo-pulse-blue 1.8s ease 0.5s infinite' : 'none',
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function DemoSync2() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>BBCA · Pasar</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['Ringkasan', 'Pasar', 'Log'].map(t => (
            <span key={t} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: t === 'Pasar' ? 'var(--blue-400)' : 'var(--bg-raised)', color: t === 'Pasar' ? '#fff' : 'var(--text-muted)' }}>{t}</span>
          ))}
        </div>
      </div>
      <DCard hi style={{ animation: 'demo-fadein 0.4s ease both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>Harga Pasar Saat Ini</span>
          <DChip label="Live" color="var(--gain-400)" />
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>Rp 9.250</div>
        <div style={{ fontSize: 11, color: 'var(--gain-400)', marginTop: 4 }}>+150 (+1.65%) hari ini</div>
      </DCard>
      <DCard style={{ animation: 'demo-fadein 0.3s ease 0.2s both' }}>
        <DRow l="Harga Tersimpan" r="Rp 8.800" rc="var(--text-secondary)" />
        <div style={{ height: 1, background: 'var(--border-dim)', margin: '6px 0' }} />
        <DRow l="Selisih vs Tersimpan" r="+5.11%" rc="var(--gain-400)" />
      </DCard>
      <button style={{
        width: '100%', background: 'var(--blue-400)', color: '#fff', border: 'none',
        borderRadius: 9, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        animation: 'demo-pulse-blue 1.6s ease 0.4s infinite', marginTop: 'auto',
      }}>
        <RefreshCw size={13} strokeWidth={2.5} /> Sync Harga Sekarang
      </button>
    </div>
  );
}

function DemoSync3() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>BBCA · Detail Aset</span>
      <div style={{
        background: 'color-mix(in srgb, var(--gain-400) 10%, var(--bg-raised))',
        border: '1px solid color-mix(in srgb, var(--gain-400) 28%, transparent)',
        borderRadius: 10, padding: '7px 12px',
        display: 'flex', alignItems: 'center', gap: 7,
        animation: 'demo-slide-up 0.4s ease both',
      }}>
        <CheckCircle2 size={14} color="var(--gain-400)" strokeWidth={2} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gain-400)' }}>Update Harga berhasil — Rp 9.250</span>
      </div>
      <DCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>BBCA</span>
              <DChip label="✓ Updated" color="var(--gain-400)" />
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Saham IDX · 100 lot</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Rp 92,5 jt</div>
            <div style={{ fontSize: 10, color: 'var(--gain-400)' }}>+Rp 7,5 jt (+8.8%)</div>
          </div>
        </div>
      </DCard>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Entri Terbaru di Log</div>
      <DCard style={{ animation: 'demo-scale-in 0.4s ease 0.3s both' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <DChip label="Update Harga" color="var(--blue-400)" />
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>4 Jul 2026 · Auto-sync pasar</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Rp 9.250/lbr</div>
        </div>
      </DCard>
    </div>
  );
}

/* Robo Advisor */
function DemoAdvisor1() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bot size={14} color="var(--ai-accent)" strokeWidth={1.75} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Robo Advisor</span>
        <DChip label="AI" color="var(--ai-accent)" />
      </div>
      <DCard style={{ background: 'color-mix(in srgb, var(--ai-accent) 6%, var(--bg-raised))', border: '1px solid color-mix(in srgb, var(--ai-accent) 18%, transparent)', animation: 'demo-fadein 0.4s ease both' }}>
        <div style={{ fontSize: 9, color: 'var(--ai-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>Konteks Portofolio Aktif</div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[['Total Nilai', 'Rp 125,4 jt'], ['Aset Aktif', '4 aset'], ['CAGR', '14.3%'], ['Skor', '74/100']].map(([l, v]) => (
            <div key={l}>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginTop: 1 }}>{v}</div>
            </div>
          ))}
        </div>
      </DCard>
      <div style={{ display: 'flex', gap: 8, animation: 'demo-fadein 0.4s ease 0.25s both' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'color-mix(in srgb, var(--ai-accent) 18%, var(--bg-raised))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={13} color="var(--ai-accent)" />
        </div>
        <div style={{ background: 'var(--bg-raised)', borderRadius: '4px 12px 12px 12px', padding: '8px 11px', maxWidth: '85%' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>Halo! Saya sudah membaca portofoliomu. Ada pertanyaan atau mau saya analisis sesuatu?</p>
        </div>
      </div>
      <div style={{ marginTop: 'auto', background: 'var(--bg-raised)', borderRadius: 10, padding: '8px 12px', border: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flex: 1 }}>Tanya apapun tentang portofoliomu...</span>
        <button style={{ background: 'var(--ai-accent)', border: 'none', borderRadius: 7, padding: '4px 9px', color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer', animation: 'demo-pulse-blue 2s ease 0.5s infinite' }}>Kirim</button>
      </div>
    </div>
  );
}

function DemoAdvisor2() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bot size={14} color="var(--ai-accent)" strokeWidth={1.75} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Robo Advisor</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'color-mix(in srgb, var(--ai-accent) 18%, var(--bg-raised))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={13} color="var(--ai-accent)" />
        </div>
        <div style={{ background: 'var(--bg-raised)', borderRadius: '4px 12px 12px 12px', padding: '8px 11px' }}>
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0 }}>Halo! Saya sudah membaca portofoliomu. Mau tanya apa?</p>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', animation: 'demo-slide-up 0.4s ease 0.1s both' }}>
        <div style={{ background: 'var(--blue-400)', borderRadius: '12px 4px 12px 12px', padding: '8px 11px', maxWidth: '80%' }}>
          <p style={{ fontSize: 11, color: '#fff', margin: 0 }}>Bagaimana kondisi alokasi portofolio saya? Perlu rebalancing tidak?</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, animation: 'demo-fadein 0.3s ease 0.6s both' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'color-mix(in srgb, var(--ai-accent) 18%, var(--bg-raised))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={13} color="var(--ai-accent)" />
        </div>
        <div style={{ background: 'var(--bg-raised)', borderRadius: '4px 12px 12px 12px', padding: '9px 13px', display: 'flex', gap: 5, alignItems: 'center' }}>
          {[0, 0.18, 0.36].map((d, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ai-accent)', animation: `demo-bounce-dot 0.9s ease ${d}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoAdvisor3() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Bot size={14} color="var(--ai-accent)" strokeWidth={1.75} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Robo Advisor</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ background: 'var(--blue-400)', borderRadius: '12px 4px 12px 12px', padding: '6px 10px', maxWidth: '75%' }}>
          <p style={{ fontSize: 10, color: '#fff', margin: 0 }}>Bagaimana alokasi portofolio saya?</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, animation: 'demo-fadein 0.4s ease both' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'color-mix(in srgb, var(--ai-accent) 18%, var(--bg-raised))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Bot size={13} color="var(--ai-accent)" />
        </div>
        <div style={{ background: 'var(--bg-raised)', borderRadius: '4px 12px 12px 12px', padding: '9px 11px', flex: 1, border: '1px solid color-mix(in srgb, var(--ai-accent) 14%, transparent)' }}>
          <p style={{ fontSize: 10, color: 'var(--text-primary)', margin: '0 0 7px', fontWeight: 700 }}>Analisis Alokasi Portofolio:</p>
          {[
            { t: 'Saham 48% — target 55%, perlu ditambah ~Rp 9 jt', ok: false },
            { t: 'Reksa Dana 20% — sesuai target ✓', ok: true },
            { t: 'Kripto 13% — sedikit berlebih dari target 10%', ok: false },
          ].map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 5, marginBottom: 4, animation: `demo-fadein 0.3s ease ${0.2 + i * 0.15}s both` }}>
              <span style={{ color: b.ok ? 'var(--gain-400)' : 'var(--warn-400)', flexShrink: 0, fontSize: 10 }}>{b.ok ? '✓' : '→'}</span>
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Simulasi CAGR */
function DemoCAGR1() {
  const inputs = [
    { l: 'Nilai Portofolio Saat Ini', v: 'Rp 125.400.000', c: 'var(--text-primary)' },
    { l: 'Target CAGR / Tahun', v: '12%', c: 'var(--blue-400)' },
    { l: 'Horizon Investasi', v: '20 tahun', c: 'var(--blue-400)' },
    { l: 'Kontribusi Rutin (opsional)', v: 'Rp 3.000.000 / bulan', c: 'var(--text-primary)' },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Simulasi CAGR</span>
      {inputs.map((f, i) => (
        <DCard key={f.l} style={{ animation: `demo-fadein 0.35s ease ${i * 0.09}s both` }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{f.l}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: f.c }}>{f.v}</div>
        </DCard>
      ))}
      <button style={{
        width: '100%', background: 'var(--blue-400)', color: '#fff', border: 'none',
        borderRadius: 9, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        animation: 'demo-pulse-blue 1.8s ease 0.5s infinite',
      }}>Hitung Proyeksi →</button>
    </div>
  );
}

function DemoCAGR2() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Proyeksi 20 Tahun</span>
        <DChip label="3 skenario" color="var(--blue-400)" />
      </div>
      <div style={{ flex: 1, background: 'var(--bg-raised)', borderRadius: 10, padding: '8px 6px', overflow: 'hidden' }}>
        <svg viewBox="0 0 250 96" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
          <defs>
            <linearGradient id="dg2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.01" />
            </linearGradient>
          </defs>
          {/* Optimis */}
          <polyline points="10,88 55,72 100,52 150,30 200,14 240,6"
            fill="none" stroke="var(--gain-400)" strokeWidth="1.8" strokeDasharray="280"
            style={{ animation: 'demo-draw-line 1.8s ease both' }} />
          {/* Base */}
          <polyline points="10,88 55,78 100,64 150,46 200,30 240,20"
            fill="none" stroke="var(--blue-400)" strokeWidth="2" strokeDasharray="280"
            style={{ animation: 'demo-draw-line 1.8s ease 0.1s both' }} />
          {/* Pesimis */}
          <polyline points="10,88 55,83 100,76 150,67 200,56 240,49"
            fill="none" stroke="var(--loss-400)" strokeWidth="1.5" strokeDasharray="4 4"
            style={{ opacity: 0, animation: 'demo-fadein 0.4s ease 1.6s forwards' }} />
          {/* Labels */}
          {[['Rp 2,3M', 6], ['Rp 1,1M', 22], ['Rp 380jt', 52]].map(([l, y]) => (
            <text key={l as string} x="4" y={y as number} fontSize="6.5" fill="rgba(92,115,143,0.8)">{l}</text>
          ))}
        </svg>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {[
          { l: 'Optimis', c: 'var(--gain-400)' },
          { l: 'Base Case', c: 'var(--blue-400)' },
          { l: 'Pesimis', c: 'var(--loss-400)' },
        ].map(lg => (
          <div key={lg.l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 12, height: 2, background: lg.c, borderRadius: 1 }} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{lg.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoCAGR3() {
  const rows = [
    { y: '5 th', p: 'Rp 216 jt', b: 'Rp 241 jt', o: 'Rp 268 jt', d: 0 },
    { y: '10 th', p: 'Rp 381 jt', b: 'Rp 462 jt', o: 'Rp 558 jt', d: 0.09 },
    { y: '20 th', p: 'Rp 1,19 M', b: 'Rp 1,69 M', o: 'Rp 2,37 M', d: 0.18 },
    { y: '30 th', p: 'Rp 3,74 M', b: 'Rp 6,25 M', o: 'Rp 10,3 M', d: 0.27 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Hasil Proyeksi</span>
      <div style={{ background: 'var(--bg-raised)', borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: 'var(--bg-overlay)', padding: '6px 10px' }}>
          {['Tahun', 'Pesimis', 'Base', 'Optimis'].map((h, i) => (
            <span key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>
        {rows.map(row => (
          <div key={row.y} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '7px 10px', borderBottom: '1px solid var(--border-dim)', animation: `demo-fadein 0.3s ease ${row.d}s both` }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{row.y}</span>
            <span style={{ fontSize: 10, color: 'var(--loss-400)', textAlign: 'right' }}>{row.p}</span>
            <span style={{ fontSize: 10, color: 'var(--blue-400)', textAlign: 'right', fontWeight: 700 }}>{row.b}</span>
            <span style={{ fontSize: 10, color: 'var(--gain-400)', textAlign: 'right' }}>{row.o}</span>
          </div>
        ))}
      </div>
      <DCard style={{ animation: 'demo-fadein 0.4s ease 0.4s both' }}>
        <DRow l="Modal sekarang" r="Rp 125,4 jt" lc="var(--text-muted)" />
        <DRow l="Base case 20 tahun" r="Rp 1,69 miliar" rc="var(--blue-400)" style={{ marginTop: 4 }} />
        <DRow l="Kelipatan" r="13,5×" rc="var(--gain-400)" style={{ marginTop: 4 }} />
      </DCard>
    </div>
  );
}

/* Dividen */
function DemoDividend1() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <CalendarDays size={14} color="var(--gain-400)" strokeWidth={1.75} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Dividen & Kupon</span>
      </div>
      <div style={{ background: 'var(--bg-raised)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--blue-400)', animation: 'demo-fadein 0.3s ease both' }}>
        <Search size={13} color="var(--text-muted)" />
        <span style={{ fontSize: 12, color: 'var(--text-primary)', flex: 1 }}>BBCA</span>
        <span style={{ color: 'var(--blue-400)', animation: 'demo-blink 1s step-end infinite', fontSize: 13 }}>|</span>
      </div>
      <div style={{ background: 'var(--bg-overlay)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-default)', animation: 'demo-fadein 0.4s ease 0.2s both' }}>
        {[
          { t: 'BBCA', n: 'Bank Central Asia Tbk', active: true },
          { t: 'BBCA-R', n: 'Bank Central Asia Rights', active: false },
        ].map((r, i) => (
          <div key={r.t} style={{ padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: r.active ? 'color-mix(in srgb, var(--blue-400) 8%, var(--bg-overlay))' : 'transparent', borderBottom: i === 0 ? '1px solid var(--border-dim)' : 'none' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{r.t}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{r.n}</div>
            </div>
            <DChip label="IDX" color="var(--blue-400)" />
          </div>
        ))}
      </div>
      <DCard style={{ animation: 'demo-fadein 0.4s ease 0.5s both' }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          💡 Ketik ticker singkat: <b style={{ color: 'var(--text-primary)' }}>BBCA</b>, <b style={{ color: 'var(--text-primary)' }}>TLKM</b>, <b style={{ color: 'var(--text-primary)' }}>BMRI</b>
        </span>
      </DCard>
    </div>
  );
}

function DemoDividend2() {
  const history = [
    { yr: '2024', amt: 'Rp 267/lbr', yld: '2.9%', d: 0 },
    { yr: '2023', amt: 'Rp 220/lbr', yld: '2.5%', d: 0.08 },
    { yr: '2022', amt: 'Rp 168/lbr', yld: '2.1%', d: 0.16 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>BBCA</span>
            <DChip label="IDX" color="var(--blue-400)" />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Bank Central Asia Tbk</div>
        </div>
        <button style={{ background: 'var(--gain-400)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer', animation: 'demo-pulse-green 1.8s ease infinite' }}>+ Watchlist</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        {[
          { l: 'Yield 12M', v: '2.41%', c: 'var(--gain-400)', d: 0 },
          { l: 'Konsistensi', v: '5 / 5', c: 'var(--text-primary)', d: 0.08 },
          { l: 'Harga', v: 'Rp 9.250', c: 'var(--text-primary)', d: 0.16 },
        ].map(s => (
          <DCard key={s.l} style={{ animation: `demo-fadein 0.35s ease ${s.d}s both` }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>{s.l}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</div>
          </DCard>
        ))}
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Riwayat Dividen</div>
      {history.map(row => (
        <DCard key={row.yr} style={{ animation: `demo-fadein 0.3s ease ${row.d}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{row.yr}</span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{row.amt}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gain-400)' }}>{row.yld}</span>
          </div>
        </DCard>
      ))}
    </div>
  );
}

function DemoDividend3() {
  const items = [
    { t: 'BBCA', yld: '2.41%', cons: '5/5', last: 'Jun 2024', d: 0 },
    { t: 'TLKM', yld: '5.12%', cons: '5/5', last: 'Nov 2024', d: 0.08 },
    { t: 'BMRI', yld: '4.78%', cons: '4/5', last: 'Mar 2024', d: 0.16 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Watchlist Dividen</span>
      {items.map(a => (
        <DCard key={a.t} style={{ animation: `demo-fadein 0.35s ease ${a.d}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{a.t}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>Terakhir: {a.last}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gain-400)' }}>{a.yld}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>Konsistensi {a.cons}</div>
            </div>
          </div>
        </DCard>
      ))}
      <DCard style={{ background: 'color-mix(in srgb, var(--gain-400) 6%, var(--bg-raised))', border: '1px solid color-mix(in srgb, var(--gain-400) 18%, transparent)', animation: 'demo-fadein 0.4s ease 0.3s both' }}>
        <DRow l="Estimasi yield rata-rata watchlist" r="4.10%" rc="var(--gain-400)" />
      </DCard>
    </div>
  );
}

/* Trading */
function DemoTrading1() {
  const coins = [
    { t: 'BTC', n: 'Bitcoin', p: 'Rp 1,02 M', c: '+2.4%', pos: true, d: 0 },
    { t: 'ETH', n: 'Ethereum', p: 'Rp 52,4 jt', c: '+1.1%', pos: true, d: 0.07 },
    { t: 'SOL', n: 'Solana', p: 'Rp 2,43 jt', c: '-0.8%', pos: false, d: 0.14 },
    { t: 'BNB', n: 'BNB', p: 'Rp 9,87 jt', c: '+0.3%', pos: true, d: 0.21 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart2 size={14} color="var(--warn-400)" strokeWidth={1.75} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Kripto Watchlist</span>
        </div>
        <DChip label="CoinGecko" color="var(--warn-400)" />
      </div>
      {coins.map(c => (
        <DCard key={c.t} style={{ animation: `demo-slide-right 0.35s ease ${c.d}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--warn-400)', flexShrink: 0 }}>{c.t[0]}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>{c.t}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{c.n}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{c.p}</div>
              <div style={{ fontSize: 10, fontWeight: 600, marginTop: 1, color: c.pos ? 'var(--gain-400)' : 'var(--loss-400)' }}>{c.c}</div>
            </div>
          </div>
        </DCard>
      ))}
    </div>
  );
}

function DemoTrading2() {
  const signals = [
    { t: 'BTC', rsi: 28, sig: 'Oversold', c: 'var(--gain-400)', d: 0 },
    { t: 'ETH', rsi: 45, sig: 'Netral', c: 'var(--text-secondary)', d: 0.09 },
    { t: 'SOL', rsi: 72, sig: 'Overbought', c: 'var(--loss-400)', d: 0.18 },
    { t: 'BNB', rsi: 38, sig: 'Netral', c: 'var(--text-secondary)', d: 0.27 },
  ];
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Activity size={14} color="var(--warn-400)" strokeWidth={1.75} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Scanner Sinyal Multi-Indikator</span>
      </div>
      {signals.map(s => (
        <DCard key={s.t} style={{ animation: `demo-fadein 0.35s ease ${s.d}s both` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', width: 36 }}>{s.t}</span>
            <div style={{ flex: 1, height: 5, background: 'var(--bg-overlay)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${s.rsi}%`, background: s.c, borderRadius: 3, transformOrigin: 'left', animation: `demo-grow-x 0.5s ease ${s.d + 0.1}s both` }} />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: s.c, width: 22, textAlign: 'right' }}>{s.rsi}</span>
            <DChip label={s.sig} color={s.c} />
          </div>
        </DCard>
      ))}
      <DCard style={{ animation: 'demo-fadein 0.4s ease 0.4s both' }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          RSI + MA + MACD + support/resistance digabung jadi <span style={{ color: 'var(--gain-400)', fontWeight: 700 }}>skor −100…+100</span> · skor ≥ +30 = sinyal beli, ≤ −30 = sinyal jual
        </span>
      </DCard>
    </div>
  );
}

function DemoTrading3() {
  return (
    <div style={{ padding: '12px 14px', height: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Paper Trade</span>
        <DChip label="Virtual" color="var(--warn-400)" />
      </div>
      <DCard hi>
        <DRow l="Saldo Virtual" r="Rp 100.000.000" />
        <DRow l="P&L Total" r="+Rp 4.280.000 (+4.28%)" rc="var(--gain-400)" style={{ marginTop: 4 }} />
      </DCard>
      <DCard style={{ animation: 'demo-fadein 0.4s ease 0.2s both' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Beli Bitcoin (BTC)</div>
        {[
          { l: 'Harga Beli', v: 'Rp 1.020.000.000' },
          { l: 'Jumlah', v: '0.002 BTC' },
          { l: 'Total', v: 'Rp 2.040.000' },
        ].map((f, i) => (
          <div key={f.l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < 2 ? '1px solid var(--border-dim)' : 'none' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{f.l}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>{f.v}</span>
          </div>
        ))}
      </DCard>
      <button style={{
        width: '100%', background: 'var(--gain-400)', color: '#fff', border: 'none',
        borderRadius: 9, padding: '8px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        animation: 'demo-pulse-green 1.8s ease 0.3s infinite',
      }}>✓ Eksekusi Paper Trade</button>
    </div>
  );
}

// ── Demo config ───────────────────────────────────────────────────────────────

interface DemoStep { label: string; Component: () => React.ReactElement }
interface DemoConfig { id: string; title: string; icon: React.ReactNode; color: string; steps: DemoStep[] }

const DEMOS: DemoConfig[] = [
  {
    id: 'portfolio', title: 'Tambah Aset',
    icon: <PlusCircle size={13} strokeWidth={2} />, color: 'var(--blue-400)',
    steps: [
      { label: 'Daftar aset aktif — tekan Posisi Baru untuk mencatat aset baru', Component: DemoPortfolio1 },
      { label: 'Isi nama, harga beli per unit, jumlah lot, dan tanggal transaksi', Component: DemoPortfolio2 },
      { label: 'Aset langsung masuk ke daftar, nilai & gain dihitung otomatis', Component: DemoPortfolio3 },
    ],
  },
  {
    id: 'dashboard', title: 'Dashboard',
    icon: <LayoutGrid size={13} strokeWidth={2} />, color: 'var(--blue-400)',
    steps: [
      { label: 'Ringkasan total nilai, unrealized gain, CAGR, dan skor rebalancing', Component: DemoDashboard1 },
      { label: 'Grafik pertumbuhan nilai vs modal dari semua data historis', Component: DemoDashboard2 },
      { label: 'Audit rebalancing: alokasi aktual vs target dan saran penyesuaian', Component: DemoDashboard3 },
    ],
  },
  {
    id: 'sync', title: 'Sync Harga',
    icon: <RefreshCw size={13} strokeWidth={2} />, color: 'var(--blue-300)',
    steps: [
      { label: 'Aset bertanda ⚠ Stale berarti harganya belum diupdate bulan ini', Component: DemoSync1 },
      { label: 'Tab Pasar menampilkan harga real-time saham IDX dari Yahoo Finance', Component: DemoSync2 },
      { label: 'Klik Sync — entri Update Harga dibuat otomatis, tanda stale hilang', Component: DemoSync3 },
    ],
  },
  {
    id: 'advisor', title: 'Robo Advisor',
    icon: <Bot size={13} strokeWidth={2} />, color: 'var(--ai-accent)',
    steps: [
      { label: 'AI memiliki akses ke seluruh data portofoliomu secara real-time', Component: DemoAdvisor1 },
      { label: 'Tanyakan apa saja: analisis, rekomendasi, atau simulasi skenario', Component: DemoAdvisor2 },
      { label: 'Respons AI berisi analisis spesifik berdasarkan kondisi portofoliomu', Component: DemoAdvisor3 },
    ],
  },
  {
    id: 'cagr', title: 'Simulasi CAGR',
    icon: <TrendingUp size={13} strokeWidth={2} />, color: 'var(--blue-400)',
    steps: [
      { label: 'Masukkan nilai portofolio, target CAGR, dan horizon investasi', Component: DemoCAGR1 },
      { label: 'Tiga skenario diproyeksikan: optimis, base case, dan pesimis', Component: DemoCAGR2 },
      { label: 'Lihat estimasi nilai di 5, 10, 20, hingga 30 tahun ke depan', Component: DemoCAGR3 },
    ],
  },
  {
    id: 'dividend', title: 'Dividen',
    icon: <CalendarDays size={13} strokeWidth={2} />, color: 'var(--gain-400)',
    steps: [
      { label: 'Cari ticker saham IDX (BBCA, TLKM, BMRI, dll.) di kolom pencarian', Component: DemoDividend1 },
      { label: 'Yield trailing 12 bulan, konsistensi, dan riwayat pembayaran tampil otomatis', Component: DemoDividend2 },
      { label: 'Tambahkan ke watchlist untuk memantau beberapa emiten sekaligus', Component: DemoDividend3 },
    ],
  },
  {
    id: 'trading', title: 'Trading Kripto',
    icon: <BarChart2 size={13} strokeWidth={2} />, color: 'var(--warn-400)',
    steps: [
      { label: 'Watchlist kripto real-time dari CoinGecko — harga, volume, market cap', Component: DemoTrading1 },
      { label: 'Scanner multi-indikator (RSI, MA, MACD, support/resistance) memberi skor sinyal beli/jual lengkap dengan alasan per faktor', Component: DemoTrading2 },
      { label: 'Paper trading: simulasi beli/jual kripto tanpa menggunakan uang nyata', Component: DemoTrading3 },
    ],
  },
];

// ── Demo Player ───────────────────────────────────────────────────────────────

function FeatureDemoPlayer() {
  const [fi, setFi] = useState(0);
  const [si, setSi] = useState(0);
  const [stepKey, setStepKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  function startTimer(featIdx: number) {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSi(prev => {
        setStepKey(k => k + 1);
        return (prev + 1) % DEMOS[featIdx].steps.length;
      });
    }, 3000);
  }

  useEffect(() => {
    startTimer(0);
    return () => clearInterval(timerRef.current);
  }, []);

  function selectFeature(idx: number) {
    setFi(idx);
    setSi(0);
    setStepKey(k => k + 1);
    startTimer(idx);
  }

  function selectStep(idx: number) {
    clearInterval(timerRef.current);
    setSi(idx);
    setStepKey(k => k + 1);
    startTimer(fi);
  }

  const demo = DEMOS[fi];
  const StepContent = demo.steps[si].Component;

  return (
    <div>
      {/* Feature selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {DEMOS.map((d, i) => (
          <button
            key={d.id}
            onClick={() => selectFeature(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 600,
              background: i === fi ? d.color : 'var(--bg-raised)',
              color: i === fi ? '#fff' : 'var(--text-secondary)',
              transition: 'all 0.15s',
              boxShadow: i === fi ? `0 0 10px color-mix(in srgb, ${d.color} 30%, transparent)` : 'none',
            }}
          >
            <span style={{ color: i === fi ? '#fff' : d.color }}>{d.icon}</span>
            {d.title}
          </button>
        ))}
      </div>

      {/* Demo screen */}
      <div style={{
        borderRadius: 16, border: '1px solid var(--border-subtle)',
        overflow: 'hidden', height: 306,
        background: 'var(--bg-surface)', position: 'relative',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        {/* Faux window chrome */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-raised)' }}>
          {['#f87171', '#fbbf24', '#34d399'].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />
          ))}
          <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>trajectory-assets.vercel.app</span>
        </div>
        {/* Step content — key forces remount = CSS animations restart */}
        <div
          key={stepKey}
          style={{ height: 'calc(100% - 29px)', animation: 'demo-fadein 0.35s ease forwards', overflow: 'hidden' }}
        >
          <StepContent />
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {demo.steps.map((_, i) => (
            <button
              key={i}
              onClick={() => selectStep(i)}
              style={{
                width: i === si ? 22 : 7, height: 7,
                borderRadius: 4, border: 'none', cursor: 'pointer',
                background: i === si ? demo.color : 'var(--border-default)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 480 }}>
          {demo.steps[si].label}
        </p>
      </div>
    </div>
  );
}

// ── Quick Start ───────────────────────────────────────────────────────────────

const QUICK_START = [
  { n: '1', title: 'Catat aset pertamamu', icon: <PlusCircle size={17} />, route: '/portfolio', cta: 'Buka Portfolio', desc: 'Buka Portfolio → klik "Posisi Baru". Isi nama aset, kategori, harga beli, jumlah unit, dan tanggal. Semua kelas aset didukung: saham, reksa dana, obligasi, emas, kripto, hingga kas.' },
  { n: '2', title: 'Update harga setiap bulan', icon: <RefreshCw size={17} />, route: '/portfolio', cta: 'Lihat Portfolio', desc: 'Untuk saham IDX: buka detail aset → tab Pasar → klik Sync. Untuk aset lain: tambah entri "Update Harga". Ini menjaga nilai portofolio akurat dan menghilangkan tanda stale ⚠.' },
  { n: '3', title: 'Pantau di Dashboard', icon: <LayoutGrid size={17} />, route: '/dashboard', cta: 'Buka Dashboard', desc: 'Dashboard merangkum total nilai, unrealized gain/loss, estimasi CAGR, skor rebalancing, dan grafik pertumbuhan. Cukup dibuka sekali sebulan setelah update harga.' },
  { n: '4', title: 'Tanya Robo Advisor', icon: <MessageSquare size={17} />, route: '/chat', cta: 'Mulai Chat', desc: 'AI memiliki akses penuh ke data portofoliomu. Tanya rekomendasi, analisis alokasi, atau simulasi skenario kapan saja. Tidak perlu copas data manual.' },
];

// ── Entry Types ───────────────────────────────────────────────────────────────

const ENTRY_TYPES = [
  { type: 'Posisi Baru', desc: 'Pembelian aset yang belum ada di portofolio', color: 'var(--gain-400)' },
  { type: 'Top Up', desc: 'Pembelian tambahan aset yang sudah ada', color: 'var(--gain-400)' },
  { type: 'Jual Sebagian', desc: 'Penjualan sebagian unit aset', color: 'var(--loss-400)' },
  { type: 'Jual Semua', desc: 'Penjualan seluruh unit, menutup posisi', color: 'var(--loss-400)' },
  { type: 'Update Harga', desc: 'Catat harga pasar terkini (wajib tiap bulan untuk aset non-kas)', color: 'var(--blue-400)' },
  { type: 'Pendapatan', desc: 'Dividen, kupon, atau bunga yang diterima', color: 'var(--gain-400)' },
  { type: 'Biaya / Fee', desc: 'Biaya platform, pajak, atau fee lainnya', color: 'var(--loss-400)' },
  { type: 'Koreksi', desc: 'Batalkan entri sebelumnya yang salah tanpa menghapusnya', color: 'var(--warn-400)' },
];

// ── Pro Tips ──────────────────────────────────────────────────────────────────

const PRO_TIPS = [
  { icon: <RefreshCw size={14} />, text: 'Update harga di awal bulan supaya grafik pertumbuhan portofolio dan skor rebalancing selalu akurat.' },
  { icon: <Download size={14} />, text: 'Ekspor CSV dari halaman Portfolio setiap akhir tahun untuk kebutuhan laporan pajak.' },
  { icon: <Pencil size={14} />, text: 'Salah input? Gunakan fitur Edit Log (ikon pensil di detail aset) — entri lama dikoreksi otomatis, audit trail tetap terjaga.' },
  { icon: <Zap size={14} />, text: 'Untuk saham IDX, tombol Sync di tab Pasar langsung membuat entri Update Harga dengan harga terkini — tidak perlu input manual.' },
  { icon: <ShieldCheck size={14} />, text: 'Kas (tabungan, deposito) tidak perlu update harga bulanan — sistem tidak menandainya sebagai stale.' },
  { icon: <MessageSquare size={14} />, text: 'Aktifkan "Konteks Portofolio untuk AI" di Pengaturan agar Robo Advisor bisa menganalisis data aktualmu.' },
  { icon: <RefreshCw size={14} />, text: 'Tambahkan minimal 2 saham ke watchlist Dividen & Kupon untuk melihat Roadmap Rotasi Dividen — urutan pindah saham berdasarkan pola dividen & harga historis.' },
  { icon: <Target size={14} />, text: 'Buat target di halaman Target Finansial dengan tanggal & kontribusi bulanan — sistem menghitung apakah portofoliomu on track dan berapa setoran bulanan yang dibutuhkan.' },
];

// ── Glossary ──────────────────────────────────────────────────────────────────

const GLOSSARY = [
  { term: 'CAGR', def: 'Compound Annual Growth Rate — tingkat pertumbuhan majemuk tahunan portofolio.' },
  { term: 'Unrealized Gain', def: 'Keuntungan di atas kertas dari aset yang belum dijual.' },
  { term: 'Avg Cost', def: 'Rata-rata harga beli per unit, disesuaikan setiap kali top up.' },
  { term: 'Cost Basis', def: 'Total modal yang diinvestasikan untuk suatu aset (unit × avg cost × kurs).' },
  { term: 'Rebalancing', def: 'Penyesuaian ulang proporsi aset agar sesuai target alokasi.' },
  { term: 'RSI', def: 'Relative Strength Index — indikator momentum 0–100; <30 oversold, >70 overbought.' },
  { term: 'MACD', def: 'Moving Average Convergence Divergence — selisih EMA12 dan EMA26; histogram positif yang menguat menandakan momentum beli bertambah.' },
  { term: 'Monte Carlo', def: 'Simulasi probabilistik dengan ribuan skenario acak untuk estimasi harga.' },
  { term: 'Support / Resistance', def: 'Level harga historis tempat harga sering berbalik arah.' },
  { term: 'Yield', def: 'Imbal hasil dividen: total dividen 12 bulan ÷ harga saham × 100%.' },
  { term: 'Stale', def: 'Aset belum diupdate harganya di bulan berjalan — perlu Update Harga / Sync.' },
  { term: 'Ledger', def: 'Catatan transaksi immutable — entri tidak pernah dihapus, hanya dikoreksi.' },
  { term: 'Paper Trading', def: 'Simulasi trading kripto dengan saldo virtual, tanpa uang nyata.' },
  { term: 'Dividend Capture', def: 'Strategi memegang saham hanya di sekitar periode pembagian dividen untuk mengejar yield, lalu rotasi ke saham lain.' },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    section: 'Portfolio & Entri', icon: <Activity size={15} strokeWidth={1.75} />,
    items: [
      { q: 'Bagaimana cara menambah aset baru?', a: 'Klik "Posisi Baru" di halaman Portfolio. Pilih kategori aset, isi nama (dan ticker untuk saham IDX, misal BBCA), platform, harga beli per unit, jumlah unit, mata uang, dan tanggal. Sistem akan otomatis menghitung cost basis dan rata-rata harga beli.' },
      { q: 'Apa perbedaan Top Up dengan Posisi Baru?', a: '"Posisi Baru" digunakan saat aset belum ada di portofolio. "Top Up" digunakan untuk pembelian tambahan aset yang sudah ada — sistem akan mengupdate rata-rata harga beli (weighted average) secara otomatis.' },
      { q: 'Apa yang dimaksud aset stale dan bagaimana cara memperbaikinya?', a: 'Aset ditandai stale (ikon ⚠) jika harganya belum diperbarui di bulan berjalan. Untuk saham IDX: buka detail aset → tab Pasar → klik Sync. Untuk aset lain: tambah entri "Update Harga" dengan harga terkini. Aset kas tidak pernah ditandai stale.' },
      { q: 'Bagaimana cara mengedit entri yang sudah tercatat?', a: 'Buka detail aset → klik ikon pensil (✏) di samping entri yang ingin diubah. Isi kolom yang perlu diubah, lalu simpan. Sistem akan menandai entri lama sebagai "dikoreksi" dan membuat entri baru — audit trail tetap terjaga.' },
      { q: 'Bagaimana cara menghapus aset?', a: 'Buka detail aset, scroll ke bawah, klik "Hapus Aset". Semua entri terkait juga akan dihapus. Jika aset sudah dijual habis, lebih baik gunakan entri "Jual Semua" agar riwayat tetap tersimpan.' },
    ],
  },
  {
    section: 'Dashboard & Perhitungan', icon: <LayoutGrid size={15} strokeWidth={1.75} />,
    items: [
      { q: 'Dari mana angka Est. CAGR di Dashboard berasal?', a: 'CAGR dihitung dari data historis portofoliomu sendiri: (nilai sekarang / nilai pertama)^(1/tahun) - 1. Jika riwayat portofolio kurang dari 1 tahun, estimasi menggunakan kecepatan pertumbuhan yang diannualisasi.' },
      { q: 'Mengapa grafik pertumbuhan portofolio terlihat flat?', a: 'Grafik menggunakan data historis yang dibackfill dari entri transaksi. Untuk saham IDX yang punya ticker, harga historis diambil dari Yahoo Finance secara otomatis. Jika tidak ada ticker atau data pasar tidak tersedia, grafik menggunakan harga beli terakhir sebagai fallback.' },
      { q: 'Apa itu Skor Rebalancing?', a: 'Skor 0–100 yang menunjukkan seberapa sesuai alokasi aset aktualmu dengan target alokasi sesuai profil risiko. Skor 100 = alokasi tepat sasaran. Setiap deviasi signifikan dari target mengurangi skor. Target alokasi bisa diubah via Pengaturan → Profil Risiko.' },
    ],
  },
  {
    section: 'Saham IDX & Analisis Teknikal', icon: <FileText size={15} strokeWidth={1.75} />, color: 'var(--blue-300)',
    items: [
      { q: 'Bagaimana cara melihat harga saham IDX secara real-time?', a: 'Buka detail aset saham IDX (pastikan ticker diisi, misal BBCA), lalu klik tab Pasar. Panel harga akan menampilkan harga terakhir dari Yahoo Finance. Klik tombol "Sync" untuk otomatis membuat entri Update Harga.' },
      { q: 'Apa itu Estimasi Penutupan Berikutnya?', a: 'Sistem menjalankan 2.000 simulasi Monte Carlo menggunakan model Geometric Brownian Motion berdasarkan volatilitas dan return historis. Hasilnya berupa rentang probabilistik: harga terendah (bear, P10), tengah (base, median), dan tertinggi (bull, P90).' },
      { q: 'Apa yang dimaksud RSI, Bollinger Band, dan MA di analisis teknikal?', a: 'RSI (Relative Strength Index): momentum 0–100, <30 oversold, >70 overbought. Bollinger Band: pita volatilitas di atas/bawah MA — harga di luar pita = potensi reversal. Moving Average 20 & 50: tren jangka pendek dan menengah.' },
    ],
  },
  {
    section: 'Robo Advisor (AI)', icon: <MessageSquare size={15} strokeWidth={1.75} />, color: 'var(--ai-accent)',
    items: [
      { q: 'Apa yang bisa dilakukan Robo Advisor?', a: 'Robo Advisor adalah AI yang memiliki akses ke data portofoliomu secara real-time: semua aset, nilai, alokasi, profil risiko, unrealized gain/loss, dll. Kamu bisa tanya analisis, rekomendasi rebalancing, saran aset, proyeksi, atau pertanyaan keuangan umum.' },
      { q: 'Apakah AI bisa mengubah data portofolio saya?', a: 'Tidak langsung. AI hanya bisa merekomendasikan perubahan profil risiko atau target alokasi — jika disetujui, Robo Advisor akan memperbarui pengaturanmu. AI tidak bisa membuat atau menghapus entri transaksi.' },
      { q: 'Bagaimana cara mengaktifkan konteks portofolio untuk AI?', a: 'Buka Pengaturan → aktifkan "Sertakan data portofolio untuk AI". Jika diaktifkan, setiap percakapan akan menyertakan snapshot data asetmu sebagai konteks. Jika dinonaktifkan, AI hanya menjawab pertanyaan umum tanpa data personal.' },
    ],
  },
  {
    section: 'Dividen & Kalender', icon: <CalendarDays size={15} strokeWidth={1.75} />, color: 'var(--gain-400)',
    items: [
      { q: 'Apa itu Roadmap Rotasi Dividen?', a: 'Fitur di halaman Dividen & Kupon yang menyusun urutan estimasi "pindah dari saham A ke B" sepanjang tahun, berdasarkan pola historis bulan pembayaran dividen dan pergerakan harga di sekitar periode itu. Muncul otomatis setelah kamu punya minimal 2 saham di watchlist.' },
      { q: 'Apakah tanggal di Roadmap Rotasi Dividen itu pasti?', a: 'Tidak. Yahoo Finance (sumber data kami) hanya menyediakan tanggal pembayaran historis, bukan cum-date/ex-date resmi. Jadi rentang bulan di roadmap adalah estimasi dari pola tahun-tahun sebelumnya — selalu cek jadwal resmi emiten (IDX/RUPS) sebelum bertransaksi.' },
      { q: 'Bagaimana skor keyakinan (confidence) dihitung?', a: 'Berdasarkan seberapa konsisten saham tersebut membayar dividen di bulan yang sama selama 5 tahun terakhir. Tinggi = pola sangat konsisten, Rendah = pola tidak stabil sehingga estimasi tanggal & return kurang bisa diandalkan.' },
    ],
  },
  {
    section: 'Target Finansial', icon: <Target size={15} strokeWidth={1.75} />, color: 'var(--warn-400)',
    items: [
      { q: 'Bagaimana progres target finansial dihitung?', a: 'Progres = total nilai portofolio aktif saat ini ÷ target dana × 100%. Semua target diukur terhadap portofolio yang sama — jadi kalau kamu punya beberapa target, anggap masing-masing sebagai milestone dari total kekayaan, bukan pot dana terpisah.' },
      { q: 'Apa arti status On Track / Perlu Dikejar?', a: 'Kalau target punya tanggal tenggat, sistem memproyeksikan nilai portofolio di tanggal itu memakai asumsi CAGR (sama seperti halaman Simulasi CAGR) plus kontribusi bulanan yang kamu rencanakan. Proyeksi ≥ target = On Track; di bawahnya = Perlu Dikejar. Target tanpa tanggal hanya menampilkan progres.' },
      { q: 'Apa bedanya "Butuh per bulan" dengan kontribusi bulanan yang saya isi?', a: 'Kontribusi bulanan adalah rencana setoranmu. "Butuh per bulan" adalah hitungan sistem: setoran bulanan minimum agar tepat mencapai target di tanggal tenggat dengan asumsi CAGR saat ini. Kalau angka kebutuhan jauh di atas rencanamu, artinya perlu menambah setoran, memundurkan tenggat, atau menurunkan target.' },
      { q: 'Kenapa target yang saya buat saat onboarding muncul di sini?', a: 'Target dana yang diisi saat onboarding tersimpan sebagai target finansial pertamamu. Kamu bisa mengubah nama, nominal, tenggat, dan kontribusinya kapan saja dari halaman Target Finansial.' },
    ],
  },
  {
    section: 'Pengaturan & Akun', icon: <Settings size={15} strokeWidth={1.75} />,
    items: [
      { q: 'Apa pengaruh Profil Risiko terhadap aplikasi?', a: 'Profil Risiko menentukan target alokasi aset ideal yang digunakan untuk Skor Rebalancing dan saran di Dashboard. Konservatif = lebih banyak obligasi/emas; Agresif = lebih banyak saham/kripto. Bisa diubah kapan saja di Pengaturan.' },
      { q: 'Bagaimana cara mengubah bahasa aplikasi?', a: 'Buka Pengaturan → bagian Akun → klik tombol ID / EN untuk beralih antara Bahasa Indonesia dan English.' },
      { q: 'Apakah data saya aman?', a: 'Data tersimpan di Firebase Firestore dengan aturan keamanan yang memastikan hanya kamu yang bisa membaca dan menulis datamu sendiri (verifikasi via Firebase Auth). Semua komunikasi dienkripsi via HTTPS dengan security headers aktif.' },
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--border-dim)' }}>
      <button className="w-full flex items-center justify-between py-3.5 text-left gap-3" onClick={() => setOpen(v => !v)}>
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{q}</span>
        <ChevronDown size={15} strokeWidth={2} className="flex-shrink-0 transition-transform duration-200"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0)' }} />
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
  const [tab, setTab] = useState<'guide' | 'faq'>('guide');

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: 700, letterSpacing: 'var(--tracking-snug)' }}>
            Panduan Fitur
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
            Simulasi interaktif semua fitur Trajectory — klik fitur di bawah untuk melihat cara kerjanya.
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
        {(['guide', 'faq'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '6px 18px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: tab === t ? 'var(--bg-raised)' : 'transparent',
            color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
            transition: 'all 0.15s',
          }}>
            {t === 'guide' ? 'Panduan & Simulasi' : 'FAQ'}
          </button>
        ))}
      </div>

      {tab === 'guide' ? (
        <div className="space-y-10">

          {/* Feature Demo Player */}
          <div>
            <SectionLabel>Simulasi fitur</SectionLabel>
            <FeatureDemoPlayer />
          </div>

          {/* Quick Start */}
          <div>
            <SectionLabel>Mulai dari sini</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {QUICK_START.map(step => (
                <div key={step.n} className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--blue-tint)', color: 'var(--blue-400)' }}>
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
                  <button onClick={() => navigate(step.route)} className="flex items-center gap-1.5 text-xs font-semibold self-start" style={{ color: 'var(--blue-400)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    {step.cta} <ArrowRight size={12} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Entry Types */}
          <div>
            <SectionLabel>Tipe entri transaksi</SectionLabel>
            <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              {ENTRY_TYPES.map((e, i) => (
                <div key={e.type} className="flex items-center gap-4 px-5 py-3" style={{ borderBottom: i < ENTRY_TYPES.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 w-32 text-center" style={{ background: `color-mix(in srgb, ${e.color} 12%, transparent)`, color: e.color }}>{e.type}</span>
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
                <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
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
                  <div key={g.term} className="flex gap-3 px-5 py-3 text-xs" style={{ borderBottom: i < GLOSSARY.length - 2 ? '1px solid var(--border-dim)' : 'none', borderRight: i % 2 === 0 && i < GLOSSARY.length - 1 ? '1px solid var(--border-dim)' : 'none' }}>
                    <span className="font-bold flex-shrink-0 w-28" style={{ color: 'var(--text-primary)' }}>{g.term}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{g.def}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-4">
          {FAQS.map(section => (
            <div key={section.section} className="rounded-2xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-3 px-6 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                <span style={{ color: (section as { color?: string }).color ?? 'var(--blue-400)' }}>{section.icon}</span>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>{section.section}</h2>
              </div>
              <div className="px-6">
                {section.items.map(item => <AccordionItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
