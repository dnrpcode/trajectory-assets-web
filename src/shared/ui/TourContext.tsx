import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TOUR_STEPS, TOUR_STORAGE_KEY, TourStep } from '@/shared/constants/tourSteps';

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  step: TourStep | null;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  registerDrawerControl: (fn: (open: boolean) => void) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

function stepNeedsDrawer(idx: number): boolean {
  return TOUR_STEPS[idx]?.target?.includes('nav-') ?? false;
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const hasAutoStarted = useRef(false);
  const drawerControlFn = useRef<((open: boolean) => void) | null>(null);

  const registerDrawerControl = useCallback((fn: (open: boolean) => void) => {
    drawerControlFn.current = fn;
  }, []);

  const controlDrawer = useCallback((open: boolean) => {
    if (window.innerWidth < 768 && drawerControlFn.current) {
      drawerControlFn.current(open);
    }
  }, []);

  const goToStep = useCallback((idx: number) => {
    const s = TOUR_STEPS[idx];
    if (s?.path) navigate(s.path);
    setCurrentStep(idx);
    controlDrawer(stepNeedsDrawer(idx));
  }, [navigate, controlDrawer]);

  const start = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    const first = TOUR_STEPS[0];
    if (first?.path) navigate(first.path);
    controlDrawer(false);
  }, [navigate, controlDrawer]);

  const next = useCallback(() => {
    const nextIdx = currentStep + 1;
    if (nextIdx >= TOUR_STEPS.length) {
      setIsActive(false);
      controlDrawer(false);
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      return;
    }
    goToStep(nextIdx);
  }, [currentStep, goToStep, controlDrawer]);

  const prev = useCallback(() => {
    if (currentStep <= 0) return;
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const skip = useCallback(() => {
    setIsActive(false);
    controlDrawer(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  }, [controlDrawer]);

  // Auto-start once when user first lands on /dashboard after onboarding
  useEffect(() => {
    if (hasAutoStarted.current) return;
    const completed = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!completed && location.pathname === '/dashboard') {
      hasAutoStarted.current = true;
      const timer = setTimeout(start, 1800);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, start]);

  const step = isActive ? (TOUR_STEPS[currentStep] ?? null) : null;

  return (
    <TourContext.Provider value={{
      isActive, currentStep, totalSteps: TOUR_STEPS.length,
      step, start, next, prev, skip, registerDrawerControl,
    }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}
