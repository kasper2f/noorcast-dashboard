import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { useGemini } from '@/hooks/useGemini';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ar } from '@/i18n/ar';

export function AIAssistantPage() {
  const [question, setQuestion] = useState('');
  const { messages, loading, error, sendMessage } = useGemini();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;
    const q = question;
    setQuestion('');
    await sendMessage(q);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>{ar.pages.assistant.title}</h2>
        <p>{ar.pages.assistant.subtitle}</p>
      </div>

      <div className="assistant-panel">
        <div className="assistant-messages">
          {messages.length === 0 && (
            <p className="assistant-placeholder">{ar.pages.assistant.emptyChat}</p>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble chat-${msg.role}`}>
              <span className="chat-role">
                {msg.role === 'user' ? ar.pages.assistant.you : ar.pages.assistant.bot}
              </span>
              <p>{msg.text}</p>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble chat-model">
              <LoadingSpinner />
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
        </div>

        <form onSubmit={handleSubmit} className="assistant-input">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={ar.pages.assistant.placeholder}
            disabled={loading}
          />
          <button type="submit" className="btn btn-primary" disabled={loading || !question.trim()}>
            {loading ? ar.common.loading : ar.pages.assistant.send}
          </button>
        </form>
      </div>
    </div>
  );
}
