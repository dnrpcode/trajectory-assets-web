import { useState, useCallback } from 'react';
import { Asset } from '@/modules/portfolio/domain/entities/Asset';
import { User } from '@/modules/user/domain/entities/User';
import { AdvisorAction, AdvisorMessage } from '../../domain/entities/AdvisorConversation';
import { sendAdvisorMessage } from '@/infrastructure/di/container';

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
  const [isTyping, setIsTyping] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  const hasApiKey = sendAdvisorMessage.isAvailable();

  const streamTextToMessage = useCallback((msgId: string, fullText: string) => {
    let charIndex = 0;
    const charsPerFrame = 3;
    const delayMs = 20;

    const interval = setInterval(() => {
      charIndex += charsPerFrame;
      const displayText = fullText.slice(0, charIndex);

      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, content: displayText } : m)),
      );

      if (charIndex >= fullText.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, delayMs);

    return () => clearInterval(interval);
  }, []);

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

        const msgId = (Date.now() + 1).toString();
        const emptyMsg: ChatMessage = {
          id: msgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, emptyMsg]);
        setIsTyping(true);
        streamTextToMessage(msgId, text);

        if (action) setPendingAction(action);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Gagal terhubung ke AI';
        setError(errMsg);
        const msgId = (Date.now() + 1).toString();
        const errorContent = `Maaf, terjadi kesalahan: ${errMsg}. Coba lagi dalam beberapa saat.`;

        const emptyMsg: ChatMessage = {
          id: msgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, emptyMsg]);
        setIsTyping(true);
        streamTextToMessage(msgId, errorContent);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, assets, user, isLoading, streamTextToMessage],
  );

  const dismissAction = useCallback(() => setPendingAction(null), []);

  return { messages, isLoading, isTyping, pendingAction, error, hasApiKey, sendMessage, dismissAction };
}
