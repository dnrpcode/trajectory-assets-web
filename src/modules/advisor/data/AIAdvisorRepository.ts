import { IAIAdvisorRepository } from '../domain/repositories/IAIAdvisorRepository';
import { AdvisorMessage } from '../domain/entities/AdvisorConversation';

/**
 * Calls the server-side /api/advisor/chat proxy.
 * The actual AI API key lives in Vercel server-only env vars (no VITE_ prefix)
 * and is never exposed to the browser.
 */

type ProxyResponse = { content?: string; error?: string };

export class AIAdvisorRepository implements IAIAdvisorRepository {
  isAvailable(): boolean {
    return true; // availability is determined server-side
  }

  async sendMessage(systemPrompt: string, history: AdvisorMessage[], userMessage: string): Promise<string> {
    const response = await fetch('/api/advisor/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ systemPrompt, history, userMessage }),
    });

    const data = await response.json() as ProxyResponse;

    if (!response.ok) {
      throw new Error(data.error ?? `AI proxy error ${response.status}`);
    }

    return data.content ?? '';
  }
}
