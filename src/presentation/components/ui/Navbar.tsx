
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutGrid, Activity, FileText, ShieldCheck, TrendingUp, MessageSquare, Settings, LogOut } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/presentation/hooks/useAuth';
import { logout as logoutUseCase } from '@/domain/use-cases/auth/Logout';

const navItems = [
  {
    to: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: <LayoutGrid size={18} strokeWidth={1.75} />,
  },
  {
    to: '/portfolio',
    labelKey: 'nav.portfolio',
    icon: <Activity size={18} strokeWidth={1.75} />,
  },
  {
    to: '/journal',
    labelKey: 'nav.journal',
    icon: <FileText size={18} strokeWidth={1.75} />,
  },
  {
    to: '/advisory',
    labelKey: 'nav.advisory',
    icon: <ShieldCheck size={18} strokeWidth={1.75} />,
  },
  {
    to: '/projections',
    labelKey: 'nav.projections',
    icon: <TrendingUp size={18} strokeWidth={1.75} />,
  },
  {
    to: '/chat',
    labelKey: 'nav.chat',
    icon: <MessageSquare size={18} strokeWidth={1.75} />,
  },
  {
    to: '/settings',
    labelKey: 'nav.settings',
    icon: <Settings size={18} strokeWidth={1.75} />,
  },
];

function LogoMark({ size = 28 }: { size?: number }) {
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

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

export function Navbar() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUseCase();
    navigate('/login');
  };

  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-30"
      style={{ width: 'var(--sidebar-width)', background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]" style={{ height: 'var(--topbar-height)' }}>
        <LogoMark size={28} />
        <span className="text-[1.05rem] font-bold text-[var(--text-primary)]" style={{ letterSpacing: 'var(--tracking-snug)', fontFamily: 'var(--font-sans)' }}>
          Trajectory
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, labelKey, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-[background,color] duration-150 group',
                isActive
                  ? 'bg-[var(--blue-tint-2)] text-[var(--blue-300)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-raised)] hover:text-[var(--text-primary)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex-shrink-0 transition-colors duration-150', isActive ? 'text-[var(--blue-400)]' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]')}>
                  {icon}
                </span>
                {t(labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      {user && (
        <div className="px-3 py-3 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[var(--bg-raised)] transition-colors duration-150 cursor-default">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--blue-tint-2)', color: 'var(--blue-300)', border: '1px solid rgba(77,124,255,0.22)', fontFamily: 'var(--font-sans)' }}
            >
              {getInitials(user.displayName || user.email || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{user.displayName || 'Pengguna'}</p>
              <p className="text-[0.6875rem] text-[var(--text-muted)] truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--loss-400)] transition-colors duration-150"
              title="Keluar"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
