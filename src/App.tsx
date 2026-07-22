import React, { lazy, Suspense } from 'react';
import { ThemeProvider } from '@/shared/ui/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TourProvider } from '@/shared/ui/TourContext';
import { TourOverlay } from '@/shared/ui/TourOverlay';
import { ToastProvider } from '@/shared/ui/Toast';
import { useAuth, useAuthBootstrap } from '@/modules/auth/presentation/hooks/useAuth';
import { useAlertWatcher } from '@/modules/trading';
import { FullPageSpinner } from '@/shared/ui/Spinner';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';

// Setiap halaman route di-lazy-load supaya bundle awal kecil — modul besar
// (trading/CoinGecko, advisor/AI, income/Yahoo) baru diunduh saat dibuka.
const LoginPage        = lazy(() => import('@/modules/auth/presentation/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage     = lazy(() => import('@/modules/auth/presentation/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const OnboardingPage   = lazy(() => import('@/modules/user/presentation/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const DashboardPage    = lazy(() => import('@/modules/dashboard/presentation/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const PortfolioPage    = lazy(() => import('@/modules/portfolio/presentation/pages/PortfolioPage').then((m) => ({ default: m.PortfolioPage })));
const AssetDetailPage  = lazy(() => import('@/modules/portfolio/presentation/pages/AssetDetailPage').then((m) => ({ default: m.AssetDetailPage })));
const JournalPage      = lazy(() => import('@/modules/dashboard/presentation/pages/JournalPage').then((m) => ({ default: m.JournalPage })));
const SettingsPage     = lazy(() => import('@/modules/user/presentation/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const AdvisoryPage     = lazy(() => import('@/modules/dashboard/presentation/pages/AdvisoryPage').then((m) => ({ default: m.AdvisoryPage })));
const ProjectionsPage  = lazy(() => import('@/modules/dashboard/presentation/pages/ProjectionsPage').then((m) => ({ default: m.ProjectionsPage })));
const ChatPage         = lazy(() => import('@/modules/advisor/presentation/pages/ChatPage').then((m) => ({ default: m.ChatPage })));
const HelpPage         = lazy(() => import('@/modules/help').then((m) => ({ default: m.HelpPage })));
const TradingPage      = lazy(() => import('@/modules/trading/presentation/pages/TradingPage').then((m) => ({ default: m.TradingPage })));
const CoinDetailPage   = lazy(() => import('@/modules/trading/presentation/pages/CoinDetailPage').then((m) => ({ default: m.CoinDetailPage })));
const IncomePage       = lazy(() => import('@/modules/income').then((m) => ({ default: m.IncomePage })));
const GoalsPage        = lazy(() => import('@/modules/goals').then((m) => ({ default: m.GoalsPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, authUser, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser && !user?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingPageGuard({ children }: { children: React.ReactNode }) {
  const { user, authUser, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser && user?.onboardingComplete) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  useAuthBootstrap(); // single onAuthStateChanged subscription for the whole app
  useAlertWatcher(); // background price/RSI alert polling — runs on every authenticated page
  const { authUser, loading } = useAuth();
  if (loading) return <FullPageSpinner />;

  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={authUser ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={authUser ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route
          path="/onboarding"
          element={
            <OnboardingPageGuard>
              <OnboardingPage />
            </OnboardingPageGuard>
          }
        />
        <Route
          path="/dashboard"
          element={
            <OnboardingGuard>
              <DashboardPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/portfolio"
          element={
            <OnboardingGuard>
              <PortfolioPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/portfolio/:assetId"
          element={
            <OnboardingGuard>
              <AssetDetailPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/journal"
          element={
            <OnboardingGuard>
              <JournalPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <OnboardingGuard>
              <SettingsPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/advisory"
          element={
            <OnboardingGuard>
              <AdvisoryPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/projections"
          element={
            <OnboardingGuard>
              <ProjectionsPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/chat"
          element={
            <OnboardingGuard>
              <ChatPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/help"
          element={
            <OnboardingGuard>
              <HelpPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/trading"
          element={
            <OnboardingGuard>
              <TradingPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/trading/:coinId"
          element={
            <OnboardingGuard>
              <CoinDetailPage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/income"
          element={
            <OnboardingGuard>
              <IncomePage />
            </OnboardingGuard>
          }
        />
        <Route
          path="/goals"
          element={
            <OnboardingGuard>
              <GoalsPage />
            </OnboardingGuard>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastProvider>
            <TourProvider>
              <AppRoutes />
              <TourOverlay />
            </TourProvider>
          </ToastProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
