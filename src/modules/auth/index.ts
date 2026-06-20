// Domain
export { LoginWithEmail } from './domain/use-cases/LoginWithEmail';
export { LoginWithGoogle } from './domain/use-cases/LoginWithGoogle';
export { RegisterWithEmail } from './domain/use-cases/RegisterWithEmail';
export { Logout } from './domain/use-cases/Logout';

// Data
export { FirebaseAuthService } from './data/FirebaseAuthService';

// Presentation hooks
export { useAuth, useAuthStore } from './presentation/hooks/useAuth';

// Presentation pages
export { LoginPage } from './presentation/pages/LoginPage';
export { RegisterPage } from './presentation/pages/RegisterPage';
