import React from 'react';
import { Navbar } from './Navbar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Navbar />
      <main
        className="min-h-screen"
        style={{ marginLeft: 'var(--sidebar-width)', padding: '0' }}
      >
        <div className="px-8 py-8 max-w-[var(--max-content)] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
