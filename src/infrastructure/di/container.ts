import { FirebaseAuthService } from '../../data/firebase/FirebaseAuthService';
import { FirebaseUserRepository } from '../../data/firebase/FirebaseUserRepository';
import { FirebaseAssetEntryRepository } from '../../data/firebase/FirebaseAssetEntryRepository';
import { FirebaseAssetProjectionRepository } from '../../data/firebase/FirebaseAssetProjectionRepository';
import { FirebasePortfolioRepository } from '../../data/firebase/FirebasePortfolioRepository';
import { FirebaseGoalRepository } from '../../data/firebase/FirebaseGoalRepository';

import { LoginWithEmail } from '../../domain/use-cases/auth/LoginWithEmail';
import { LoginWithGoogle } from '../../domain/use-cases/auth/LoginWithGoogle';
import { RegisterWithEmail } from '../../domain/use-cases/auth/RegisterWithEmail';
import { Logout } from '../../domain/use-cases/auth/Logout';

import { GetUserById } from '../../domain/use-cases/user/GetUserById';
import { CompleteOnboarding } from '../../domain/use-cases/user/CompleteOnboarding';
import { UpdateUserProfile } from '../../domain/use-cases/user/UpdateUserProfile';

import { CreateEntry } from '../../domain/use-cases/asset-entries/CreateEntry';
import { RecomputeAssetProjection } from '../../domain/use-cases/asset-entries/RecomputeAssetProjection';
import { GetAssetEntries } from '../../domain/use-cases/asset-entries/GetAssetEntries';
import { DeleteEntry } from '../../domain/use-cases/asset-entries/DeleteEntry';

import { GetActiveAssets } from '../../domain/use-cases/assets/GetActiveAssets';
import { GetAllAssets } from '../../domain/use-cases/assets/GetAllAssets';
import { DeleteAsset } from '../../domain/use-cases/assets/DeleteAsset';

import { GetPortfolioSummary } from '../../domain/use-cases/portfolio/GetPortfolioSummary';
import { GetPortfolioHistory } from '../../domain/use-cases/portfolio/GetPortfolioHistory';
import { BackfillPortfolioHistory } from '../../domain/use-cases/portfolio/BackfillPortfolioHistory';

import { AIAdvisorRepository } from '../../data/ai/AIAdvisorRepository';
import { SendAdvisorMessage } from '../../domain/use-cases/advisor/SendAdvisorMessage';

// ── Infrastructure ────────────────────────────────────────────────────────────
export const authService      = new FirebaseAuthService();
export const userRepository   = new FirebaseUserRepository();
export const entryRepository  = new FirebaseAssetEntryRepository();
export const projectionRepository = new FirebaseAssetProjectionRepository();
export const portfolioRepository  = new FirebasePortfolioRepository();
export const goalRepository   = new FirebaseGoalRepository();

// ── Auth use-cases ────────────────────────────────────────────────────────────
export const loginWithEmail    = new LoginWithEmail(authService);
export const loginWithGoogle   = new LoginWithGoogle(authService, userRepository);
export const registerWithEmail = new RegisterWithEmail(authService, userRepository);
export const logout            = new Logout(authService);

// ── User use-cases ────────────────────────────────────────────────────────────
export const getUserById        = new GetUserById(userRepository);
export const completeOnboarding = new CompleteOnboarding(userRepository, goalRepository);
export const updateUserProfile  = new UpdateUserProfile(userRepository);

// ── Entry use-cases ───────────────────────────────────────────────────────────
export const createEntry             = new CreateEntry(entryRepository);
export const recomputeAssetProjection = new RecomputeAssetProjection(entryRepository, projectionRepository);
export const getAssetEntries         = new GetAssetEntries(entryRepository);
export const deleteEntry             = new DeleteEntry(entryRepository, recomputeAssetProjection);

// ── Asset use-cases ───────────────────────────────────────────────────────────
export const getActiveAssets = new GetActiveAssets(projectionRepository);
export const getAllAssets     = new GetAllAssets(projectionRepository);
export const deleteAsset     = new DeleteAsset(projectionRepository, entryRepository);

// ── Portfolio use-cases ───────────────────────────────────────────────────────
export const getPortfolioSummary = new GetPortfolioSummary(projectionRepository, portfolioRepository);
export const getPortfolioHistory = new GetPortfolioHistory(portfolioRepository);
export const backfillPortfolioHistory = new BackfillPortfolioHistory(entryRepository, projectionRepository, portfolioRepository);

// ── AI Advisor ────────────────────────────────────────────────────────────────
export const aiAdvisorRepository = new AIAdvisorRepository();
export const sendAdvisorMessage  = new SendAdvisorMessage(aiAdvisorRepository);
