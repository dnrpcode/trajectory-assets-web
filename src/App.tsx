import React from 'react';
import { ThemeProvider } from '@/shared/ui/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TourProvider } from '@/shared/ui/TourContext';
import { TourOverlay } from '@/shared/ui/TourOverlay';
import { ToastProvider } from '@/shared/ui/Toast';
import { useAuth, useAuthBootstrap } from '@/modules/auth/presentation/hooks/useAuth';
import { FullPageSpinner } from '@/shared/ui/Spinner';
import { LoginPage } from '@/modules/auth/presentation/pages/LoginPage';
import { RegisterPage } from '@/modules/auth/presentation/pages/RegisterPage';
import { OnboardingPage } from '@/modules/user/presentation/pages/OnboardingPage';
import { DashboardPage } from '@/modules/dashboard/presentation/pages/DashboardPage';
import { PortfolioPage } from '@/modules/portfolio/presentation/pages/PortfolioPage';
import { AssetDetailPage } from '@/modules/portfolio/presentation/pages/AssetDetailPage';
import { JournalPage } from '@/modules/dashboard/presentation/pages/JournalPage';
import { SettingsPage } from '@/modules/user/presentation/pages/SettingsPage';
import { AdvisoryPage } from '@/modules/dashboard/presentation/pages/AdvisoryPage';
import { ProjectionsPage } from '@/modules/dashboard/presentation/pages/ProjectionsPage';
import { ChatPage } from '@/modules/advisor/presentation/pages/ChatPage';
import { HelpPage } from '@/modules/help';
import { NotFoundPage } from '@/shared/ui/NotFoundPage';
import { TradingPage } from '@/modules/trading/presentation/pages/TradingPage';
import { CoinDetailPage } from '@/modules/trading/presentation/pages/CoinDetailPage';
import { IncomePage } from '@/modules/income';
import { GoalsPage } from '@/modules/goals';

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
  const { authUser, loading } = useAuth();
  if (loading) return <FullPageSpinner />;

  return (
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
