import { useState, useCallback } from 'react';
import { askGemini } from '@/services/gemini/assistant';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export function useGemini() {
  const { employee } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!employee || !question.trim()) return;

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        text: question.trim(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        const history = messages.map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const answer = await askGemini(question.trim(), employee, history);

        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'model', text: answer },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'فشل الاتصال بالمساعد');
      } finally {
        setLoading(false);
      }
    },
    [employee, messages]
  );

  return { messages, loading, error, sendMessage };
}
