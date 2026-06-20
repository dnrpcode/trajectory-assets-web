// Domain
export type { AdvisorMessage, AdvisorAction, AdvisorResponse } from './domain/entities/AdvisorConversation';
export type { IAIAdvisorRepository } from './domain/repositories/IAIAdvisorRepository';
export { SendAdvisorMessage } from './domain/use-cases/SendAdvisorMessage';

// Data
export { AIAdvisorRepository } from './data/AIAdvisorRepository';

// Hooks
export { useClaudeAdvisor } from './presentation/hooks/useClaudeAdvisor';
export type { PendingAction } from './presentation/hooks/useClaudeAdvisor';

// Pages
export { ChatPage } from './presentation/pages/ChatPage';

// Components
export { RoboAdvisorChat } from './presentation/components/RoboAdvisorChat';
