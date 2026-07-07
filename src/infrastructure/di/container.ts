import { FirebaseAuthService } from '@/modules/auth/data/FirebaseAuthService';
import { FirebaseUserRepository } from '@/modules/user/data/FirebaseUserRepository';
import { FirebaseGoalRepository } from '@/modules/goals/data/FirebaseGoalRepository';
import { FirebaseAssetEntryRepository } from '@/modules/portfolio/data/FirebaseAssetEntryRepository';
import { FirebaseAssetProjectionRepository } from '@/modules/portfolio/data/FirebaseAssetProjectionRepository';
import { FirebasePortfolioRepository } from '@/modules/dashboard/data/FirebasePortfolioRepository';
import { FirebaseWatchlistRepository } from '@/modules/trading/data/FirebaseWatchlistRepository';
import { FirebasePaperTradeRepository } from '@/modules/trading/data/FirebasePaperTradeRepository';
import { AIAdvisorRepository } from '@/modules/advisor/data/AIAdvisorRepository';

import { LoginWithEmail } from '@/modules/auth/domain/use-cases/LoginWithEmail';
import { LoginWithGoogle } from '@/modules/auth/domain/use-cases/LoginWithGoogle';
import { RegisterWithEmail } from '@/modules/auth/domain/use-cases/RegisterWithEmail';
import { Logout } from '@/modules/auth/domain/use-cases/Logout';

import { GetUserById } from '@/modules/user/domain/use-cases/GetUserById';
import { CompleteOnboarding } from '@/modules/user/domain/use-cases/CompleteOnboarding';
import { UpdateUserProfile } from '@/modules/user/domain/use-cases/UpdateUserProfile';

import { CreateEntry } from '@/modules/portfolio/domain/use-cases/CreateEntry';
import { RecomputeAssetProjection } from '@/modules/portfolio/domain/use-cases/RecomputeAssetProjection';
import { GetAssetEntries } from '@/modules/portfolio/domain/use-cases/GetAssetEntries';
import { DeleteEntry } from '@/modules/portfolio/domain/use-cases/DeleteEntry';
import { GetActiveAssets } from '@/modules/portfolio/domain/use-cases/GetActiveAssets';
import { GetAllAssets } from '@/modules/portfolio/domain/use-cases/GetAllAssets';
import { DeleteAsset } from '@/modules/portfolio/domain/use-cases/DeleteAsset';
import { UpdateAssetMeta } from '@/modules/portfolio/domain/use-cases/UpdateAssetMeta';

import { GetPortfolioSummary } from '@/modules/dashboard/domain/use-cases/GetPortfolioSummary';
import { GetPortfolioHistory } from '@/modules/dashboard/domain/use-cases/GetPortfolioHistory';
import { BackfillPortfolioHistory } from '@/modules/dashboard/domain/use-cases/BackfillPortfolioHistory';

import { SendAdvisorMessage } from '@/modules/advisor/domain/use-cases/SendAdvisorMessage';

import { GetWatchlist } from '@/modules/trading/domain/use-cases/GetWatchlist';
import { AddToWatchlist } from '@/modules/trading/domain/use-cases/AddToWatchlist';
import { RemoveFromWatchlist } from '@/modules/trading/domain/use-cases/RemoveFromWatchlist';
import { ExecutePaperTrade } from '@/modules/trading/domain/use-cases/ExecutePaperTrade';
import { GetPaperTrades } from '@/modules/trading/domain/use-cases/GetPaperTrades';

import { InvestorFlowRepository } from '@/modules/portfolio/data/InvestorFlowRepository';
import { yahooDividendRepository } from '@/modules/income/data/YahooDividendRepository';
import { FirebaseDividendWatchlistRepository } from '@/modules/income/data/FirebaseDividendWatchlistRepository';
import { GetDividendInfo } from '@/modules/income/domain/use-cases/GetDividendInfo';
import { SearchTicker } from '@/modules/income/domain/use-cases/SearchTicker';
import { GetDividendWatchlist, AddToDividendWatchlist, RemoveFromDividendWatchlist } from '@/modules/income/domain/use-cases/ManageDividendWatchlist';
import { BuildDividendRotationRoadmap } from '@/modules/income/domain/use-cases/BuildDividendRotationRoadmap';

import { GetGoals, CreateGoal, UpdateGoal, DeleteGoal } from '@/modules/goals/domain/use-cases/ManageGoals';
import { ComputeGoalProgress } from '@/modules/goals/domain/use-cases/ComputeGoalProgress';


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

// ── Investor flow ─────────────────────────────────────────────────────────────
export const investorFlowRepository = new InvestorFlowRepository();

// ── Asset use-cases ───────────────────────────────────────────────────────────
export const getActiveAssets  = new GetActiveAssets(projectionRepository);
export const getAllAssets      = new GetAllAssets(projectionRepository);
export const deleteAsset      = new DeleteAsset(projectionRepository, entryRepository);
export const updateAssetMeta  = new UpdateAssetMeta(projectionRepository, entryRepository);

// ── Portfolio use-cases ───────────────────────────────────────────────────────
export const getPortfolioSummary = new GetPortfolioSummary(projectionRepository, portfolioRepository);
export const getPortfolioHistory = new GetPortfolioHistory(portfolioRepository);
export const backfillPortfolioHistory = new BackfillPortfolioHistory(entryRepository, projectionRepository, portfolioRepository);

// ── Goals ─────────────────────────────────────────────────────────────────────
export const getGoals            = new GetGoals(goalRepository);
export const createGoal          = new CreateGoal(goalRepository);
export const updateGoal          = new UpdateGoal(goalRepository);
export const deleteGoal          = new DeleteGoal(goalRepository);
export const computeGoalProgress = new ComputeGoalProgress();

// ── AI Advisor ────────────────────────────────────────────────────────────────
export const aiAdvisorRepository = new AIAdvisorRepository();
export const sendAdvisorMessage  = new SendAdvisorMessage(aiAdvisorRepository);

// ── Trading ───────────────────────────────────────────────────────────────────
// ── Dividend calendar ─────────────────────────────────────────────────────────
export const dividendWatchlistRepository  = new FirebaseDividendWatchlistRepository();
export const getDividendInfo              = new GetDividendInfo(yahooDividendRepository);
export const searchDividendTicker         = new SearchTicker(yahooDividendRepository);
export const getDividendWatchlist         = new GetDividendWatchlist(dividendWatchlistRepository);
export const addToDividendWatchlist       = new AddToDividendWatchlist(dividendWatchlistRepository);
export const removeFromDividendWatchlist  = new RemoveFromDividendWatchlist(dividendWatchlistRepository);
export const buildDividendRotationRoadmap = new BuildDividendRotationRoadmap();

// ── Trading ───────────────────────────────────────────────────────────────────
export const watchlistRepository   = new FirebaseWatchlistRepository();
export const paperTradeRepository  = new FirebasePaperTradeRepository();
export const getWatchlist          = new GetWatchlist(watchlistRepository);
export const addToWatchlist        = new AddToWatchlist(watchlistRepository);
export const removeFromWatchlist   = new RemoveFromWatchlist(watchlistRepository);
export const executePaperTrade     = new ExecutePaperTrade(paperTradeRepository);
export const getPaperTrades        = new GetPaperTrades(paperTradeRepository);

