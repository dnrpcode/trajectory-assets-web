import React from 'react';
import { ThemeProvider } from './presentation/contexts/ThemeContext';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from './presentation/hooks/useAuth';
import { FullPageSpinner } from './presentation/components/ui/Spinner';
import { LoginPage } from './presentation/pages/Auth/LoginPage';
import { RegisterPage } from './presentation/pages/Auth/RegisterPage';
import { OnboardingPage } from './presentation/pages/Onboarding/OnboardingPage';
import { DashboardPage } from './presentation/pages/Dashboard/DashboardPage';
import { PortfolioPage } from './presentation/pages/Portfolio/PortfolioPage';
import { AssetDetailPage } from './presentation/pages/Portfolio/AssetDetailPage';
import { JournalPage } from './presentation/pages/Journal/JournalPage';
import { SettingsPage } from './presentation/pages/Settings/SettingsPage';
import { AdvisoryPage } from './presentation/pages/Advisory/AdvisoryPage';
import { ProjectionsPage } from './presentation/pages/Projections/ProjectionsPage';
import { ChatPage } from './presentation/pages/Chat/ChatPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { authUser, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!authUser) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, authUser, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser && !user?.onboardingComplete) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { authUser, loading } = useAuth();
  if (loading) return <FullPageSpinner />;

  return (
    <Routes>
      <Route path="/login" element={authUser ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={authUser ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      <Route
        path="/onboarding"
        element={
          <AuthGuard>
            <OnboardingPage />
          </AuthGuard>
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
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
