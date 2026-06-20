import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#0c1422"/>
      <line x1="4" y1="28" x2="28" y2="28" stroke="#1a2a40" strokeWidth="1"/>
      <line x1="4" y1="20" x2="28" y2="20" stroke="#1a2a40" strokeWidth="1"/>
      <line x1="4" y1="12" x2="28" y2="12" stroke="#1a2a40" strokeWidth="1"/>
      <circle cx="26" cy="7" r="5" fill="rgba(77,124,255,0.15)"/>
      <polyline points="5,26 10,20 16,14 22,10 26,7" stroke="#4d7cff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="26" cy="7" r="2.5" fill="#4d7cff"/>
    </svg>
  );
}

export function Layout({ children }: LayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div style={{ background: 'var(--bg-base)' }}>
      <Navbar mobileOpen={drawerOpen} onMobileClose={() => setDrawerOpen(false)} />

      {/* Mobile topbar — fixed, only on mobile */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-3 px-4"
        style={{
          height: 'var(--topbar-height)',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 -ml-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-raised)] transition-colors"
        >
          <Menu size={20} />
        </button>
        <LogoMark size={24} />
        <span className="text-[0.95rem] font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-sans)', letterSpacing: 'var(--tracking-snug)' }}>
          Trajectory
        </span>
      </header>

      {/* Main — offset by sidebar on desktop */}
      <main
        className="md:ml-[var(--sidebar-width)]"
        style={{ minHeight: '100vh' }}
      >
        <div className="px-4 py-5 md:px-8 md:py-8 max-w-[var(--max-content)] mx-auto">
          {/* Spacer to clear fixed mobile topbar */}
          <div className="md:hidden" style={{ height: 'var(--topbar-height)' }} />
          {children}
        </div>
      </main>
    </div>
  );
}
