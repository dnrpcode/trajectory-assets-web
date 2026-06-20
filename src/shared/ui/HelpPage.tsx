import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LayoutGrid, Activity, ShieldCheck, TrendingUp, MessageSquare, FileText, Settings, Play } from 'lucide-react';
import { Layout } from './Layout';
import { useTour } from './TourContext';

interface Section {
  icon: React.ReactNode;
  titleKey: string;
  items: { q: string; a: string }[];
}

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: 'var(--border-dim)' }}
    >
      <button
        className="w-full flex items-center justify-between py-3.5 text-left gap-3"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{q}</span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className="flex-shrink-0 transition-transform duration-200"
          style={{
            color: 'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {a}
        </p>
      )}
    </div>
  );
}

function HelpSection({ icon, title, items }: { icon: React.ReactNode; title: string; items: { q: string; a: string }[] }) {
  return (
    <div
      className="rounded-2xl"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div
        className="flex items-center gap-3 px-6 py-4 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <span style={{ color: 'var(--blue-400)' }}>{icon}</span>
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: 'var(--tracking-snug)' }}>
          {title}
        </h2>
      </div>
      <div className="px-6">
        {items.map((item) => (
          <AccordionItem key={item.q} q={item.q} a={item.a} />
        ))}
      </div>
    </div>
  );
}

export function HelpPage() {
  const { t } = useTranslation();
  const { start } = useTour();

  const sections: Section[] = [
    {
      icon: <LayoutGrid size={16} strokeWidth={1.75} />,
      titleKey: 'help.dashboardTitle',
      items: [
        { q: t('help.q_dashboard_1'), a: t('help.a_dashboard_1') },
        { q: t('help.q_dashboard_2'), a: t('help.a_dashboard_2') },
        { q: t('help.q_dashboard_3'), a: t('help.a_dashboard_3') },
        { q: t('help.q_dashboard_4'), a: t('help.a_dashboard_4') },
      ],
    },
    {
      icon: <Activity size={16} strokeWidth={1.75} />,
      titleKey: 'help.portfolioTitle',
      items: [
        { q: t('help.q_portfolio_1'), a: t('help.a_portfolio_1') },
        { q: t('help.q_portfolio_2'), a: t('help.a_portfolio_2') },
        { q: t('help.q_portfolio_3'), a: t('help.a_portfolio_3') },
        { q: t('help.q_portfolio_4'), a: t('help.a_portfolio_4') },
      ],
    },
    {
      icon: <ShieldCheck size={16} strokeWidth={1.75} />,
      titleKey: 'help.rebalancingTitle',
      items: [
        { q: t('help.q_rebalancing_1'), a: t('help.a_rebalancing_1') },
        { q: t('help.q_rebalancing_2'), a: t('help.a_rebalancing_2') },
        { q: t('help.q_rebalancing_3'), a: t('help.a_rebalancing_3') },
      ],
    },
    {
      icon: <TrendingUp size={16} strokeWidth={1.75} />,
      titleKey: 'help.projectionsTitle',
      items: [
        { q: t('help.q_projections_1'), a: t('help.a_projections_1') },
        { q: t('help.q_projections_2'), a: t('help.a_projections_2') },
        { q: t('help.q_projections_3'), a: t('help.a_projections_3') },
      ],
    },
    {
      icon: <MessageSquare size={16} strokeWidth={1.75} />,
      titleKey: 'help.chatTitle',
      items: [
        { q: t('help.q_chat_1'), a: t('help.a_chat_1') },
        { q: t('help.q_chat_2'), a: t('help.a_chat_2') },
        { q: t('help.q_chat_3'), a: t('help.a_chat_3') },
      ],
    },
    {
      icon: <FileText size={16} strokeWidth={1.75} />,
      titleKey: 'help.journalTitle',
      items: [
        { q: t('help.q_journal_1'), a: t('help.a_journal_1') },
        { q: t('help.q_journal_2'), a: t('help.a_journal_2') },
      ],
    },
    {
      icon: <Settings size={16} strokeWidth={1.75} />,
      titleKey: 'help.settingsTitle',
      items: [
        { q: t('help.q_settings_1'), a: t('help.a_settings_1') },
        { q: t('help.q_settings_2'), a: t('help.a_settings_2') },
        { q: t('help.q_settings_3'), a: t('help.a_settings_3') },
      ],
    },
  ];

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1
            style={{
              color: 'var(--text-primary)',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: 'var(--tracking-snug)',
            }}
          >
            {t('help.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: 4 }}>
            {t('help.subtitle')}
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
          {t('tour.replayTour')}
        </button>
      </div>

      {/* Glossary */}
      <div
        className="rounded-2xl p-5 mb-6"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <p className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--blue-400)', letterSpacing: 'var(--tracking-caps)' }}>
          {t('help.glossaryTitle')}
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {(['CAGR', 'Unrealized Gain', 'Avg Cost', 'Rebalancing'] as const).map((term) => (
            <div key={term} className="flex gap-2 items-start text-xs py-2 border-b lg:border-b-0" style={{ borderColor: 'var(--border-dim)' }}>
              <span className="font-bold flex-shrink-0 w-28" style={{ color: 'var(--text-primary)' }}>{term}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{t(`help.glossary_${term.toLowerCase().replace(/ /g, '_')}`)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((sec) => (
          <HelpSection
            key={sec.titleKey}
            icon={sec.icon}
            title={t(sec.titleKey)}
            items={sec.items}
          />
        ))}
      </div>
    </Layout>
  );
}
