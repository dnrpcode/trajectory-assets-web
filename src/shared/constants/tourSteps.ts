export type TourPlacement = 'right' | 'left' | 'bottom' | 'top' | 'center';

export interface TourStep {
  id: string;
  titleKey: string;
  descKey: string;
  target: string | null; // CSS selector [data-tour="x"], null = centered modal
  path?: string;          // navigate here before showing
  placement?: TourPlacement;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    titleKey: 'tour.welcomeTitle',
    descKey: 'tour.welcomeDesc',
    target: null,
    path: '/dashboard',
    placement: 'center',
  },
  {
    id: 'dashboard-stats',
    titleKey: 'tour.dashboardStatsTitle',
    descKey: 'tour.dashboardStatsDesc',
    target: '[data-tour="dashboard-stats"]',
    path: '/dashboard',
    placement: 'bottom',
  },
  {
    id: 'dashboard-score',
    titleKey: 'tour.rebalancingScoreTitle',
    descKey: 'tour.rebalancingScoreDesc',
    target: '[data-tour="rebalancing-score"]',
    path: '/dashboard',
    placement: 'left',
  },
  {
    id: 'portfolio',
    titleKey: 'tour.portfolioTitle',
    descKey: 'tour.portfolioDesc',
    target: '[data-tour="nav-portfolio"]',
    path: '/portfolio',
    placement: 'right',
  },
  {
    id: 'trading',
    titleKey: 'tour.tradingTitle',
    descKey: 'tour.tradingDesc',
    target: '[data-tour="nav-trading"]',
    path: '/trading',
    placement: 'right',
  },
  {
    id: 'income',
    titleKey: 'tour.incomeTitle',
    descKey: 'tour.incomeDesc',
    target: '[data-tour="nav-income"]',
    path: '/income',
    placement: 'right',
  },
  {
    id: 'advisory',
    titleKey: 'tour.advisoryTitle',
    descKey: 'tour.advisoryDesc',
    target: '[data-tour="nav-advisory"]',
    path: '/advisory',
    placement: 'right',
  },
  {
    id: 'projections',
    titleKey: 'tour.projectionsTitle',
    descKey: 'tour.projectionsDesc',
    target: '[data-tour="nav-projections"]',
    path: '/projections',
    placement: 'right',
  },
  {
    id: 'chat',
    titleKey: 'tour.chatTitle',
    descKey: 'tour.chatDesc',
    target: '[data-tour="nav-chat"]',
    path: '/chat',
    placement: 'right',
  },
  {
    id: 'journal',
    titleKey: 'tour.journalTitle',
    descKey: 'tour.journalDesc',
    target: '[data-tour="nav-journal"]',
    path: '/journal',
    placement: 'right',
  },
  {
    id: 'settings',
    titleKey: 'tour.settingsTitle',
    descKey: 'tour.settingsDesc',
    target: '[data-tour="nav-settings"]',
    path: '/settings',
    placement: 'right',
  },
  {
    id: 'help',
    titleKey: 'tour.helpTitle',
    descKey: 'tour.helpDesc',
    target: '[data-tour="nav-help"]',
    path: '/help',
    placement: 'right',
  },
  {
    id: 'finish',
    titleKey: 'tour.finishTitle',
    descKey: 'tour.finishDesc',
    target: null,
    placement: 'center',
  },
];

export const TOUR_STORAGE_KEY = 'trajectory_tour_v1';
