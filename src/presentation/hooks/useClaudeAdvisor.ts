import { useState, useCallback } from 'react';
import { Asset } from '../../domain/entities/Asset';
import { User } from '../../domain/entities/User';
import { AdvisorAction, AdvisorMessage } from '../../domain/entities/AdvisorConversation';
import { sendAdvisorMessage } from '../../infrastructure/di/container';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type PendingAction = AdvisorAction;

export function useClaudeAdvisor(assets: Asset[], user: User) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = sendAdvisorMessage.isAvailable();

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);
      setPendingAction(null);

      const history: AdvisorMessage[] = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const { text, action } = await sendAdvisorMessage.execute({
          assets,
          user,
          history: history.slice(0, -1),
          userMessage: userText.trim(),
        });

        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), role: 'assistant', content: text, timestamp: new Date() },
        ]);
        if (action) setPendingAction(action);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Gagal terhubung ke AI';
        setError(errMsg);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `Maaf, terjadi kesalahan: ${errMsg}. Coba lagi dalam beberapa saat.`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, assets, user, isLoading],
  );

  const dismissAction = useCallback(() => setPendingAction(null), []);

  return { messages, isLoading, pendingAction, error, hasApiKey, sendMessage, dismissAction };
}
