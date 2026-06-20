import { AdvisorMessage } from '../entities/AdvisorConversation';

export interface IAIAdvisorRepository {
  isAvailable(): boolean;
  sendMessage(systemPrompt: string, history: AdvisorMessage[], userMessage: string): Promise<string>;
}
