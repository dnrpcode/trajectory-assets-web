import { IAIAdvisorRepository } from '../domain/repositories/IAIAdvisorRepository';
import { AdvisorMessage } from '../domain/entities/AdvisorConversation';
import { auth } from '@/data/firebase/config';

type ProxyResponse = { content?: string; error?: string };

export class AIAdvisorRepository implements IAIAdvisorRepository {
  isAvailable(): boolean {
    return true; // availability is determined server-side
  }

  async sendMessage(systemPrompt: string, history: AdvisorMessage[], userMessage: string): Promise<string> {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) throw new Error('Sesi tidak valid. Silakan login ulang.');

    const response = await fetch('/api/advisor/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ systemPrompt, history, userMessage }),
    });

    const data = await response.json() as ProxyResponse;

    if (!response.ok) {
      throw new Error(data.error ?? `AI proxy error ${response.status}`);
    }

    return data.content ?? '';
  }
}
