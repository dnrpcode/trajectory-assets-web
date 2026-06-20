import { IAIAdvisorRepository } from '../domain/repositories/IAIAdvisorRepository';
import { AdvisorMessage } from '../domain/entities/AdvisorConversation';

/**
 * OpenAI-compatible HTTP implementation of IAIAdvisorRepository.
 * Works with any provider that follows the OpenAI chat/completions format:
 * OpenRouter, OpenAI, Together AI, Groq, local Ollama, etc.
 *
 * To switch provider: update env vars only — no code change needed.
 *   VITE_AI_API_KEY   — provider API key
 *   VITE_AI_API_URL   — completions endpoint
 *   VITE_AI_MODEL     — model ID
 */

const DEFAULT_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL   = 'google/gemma-3-27b-it:free';

type OpenAIMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type OpenAIResponse = { choices: Array<{ message: { content: string } }> };
type OpenAIError    = { error?: { message?: string } };

export class AIAdvisorRepository implements IAIAdvisorRepository {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly model: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_AI_API_KEY ?? '';
    this.apiUrl = import.meta.env.VITE_AI_API_URL ?? DEFAULT_API_URL;
    this.model  = import.meta.env.VITE_AI_MODEL   ?? DEFAULT_MODEL;
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async sendMessage(systemPrompt: string, history: AdvisorMessage[], userMessage: string): Promise<string> {
    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Trajectory Robo Advisor',
      },
      body: JSON.stringify({ model: this.model, max_tokens: 1024, messages }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as OpenAIError;
      throw new Error(err.error?.message ?? `AI API error ${response.status}`);
    }

    const data = await response.json() as OpenAIResponse;
    return data.choices[0]?.message?.content ?? '';
  }
}
