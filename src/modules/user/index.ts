// Domain entities
export type { User } from './domain/entities/User';

// Domain repositories
export type { IUserRepository } from './domain/repositories/IUserRepository';
export type { IAuthService, AuthUser } from './domain/repositories/IAuthService';

// Domain use-cases
export { GetUserById } from './domain/use-cases/GetUserById';
export { CompleteOnboarding } from './domain/use-cases/CompleteOnboarding';
export type { OnboardingInput } from './domain/use-cases/CompleteOnboarding';
export { UpdateUserProfile } from './domain/use-cases/UpdateUserProfile';

// Data
export { FirebaseUserRepository } from './data/FirebaseUserRepository';

// Pages
export { OnboardingPage } from './presentation/pages/OnboardingPage';
export { SettingsPage } from './presentation/pages/SettingsPage';
