import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader } from 'lucide-react';
import { api } from '../services/api';

// ============================================================================
// AI CHAT PANEL – Expandable below AI card; calls backend POST /api/v1/ai/ask
// ============================================================================

const MIN_QUESTION_LENGTH = 10;
const MAX_QUESTION_LENGTH = 1000;

/**
 * Call backend AI endpoint. Requires auth; question 10–1000 chars, agriculture-related.
 * @param {string} question - User question
 * @returns {Promise<string>} - AI reply text
 */
async function askAI(question) {
  const { data } = await api.post('ai/ask', { question: question.trim() });
  const answer = data?.data?.answer;
  if (typeof answer !== 'string') return 'No response from assistant.';
  return answer;
}

const AIChatPanel = ({ onClose, className = '' }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || loading) return;

    if (text.length < MIN_QUESTION_LENGTH) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text },
        {
          role: 'assistant',
          content: `Please type at least ${MIN_QUESTION_LENGTH} characters (e.g. "What is the best time to sow wheat?").`,
        },
      ]);
      setInputValue('');
      return;
    }
    if (text.length > MAX_QUESTION_LENGTH) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: text.slice(0, 80) + '…' },
        { role: 'assistant', content: 'Question is too long. Please keep it under 1000 characters.' },
      ]);
      setInputValue('');
      return;
    }

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const reply = await askAI(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      let content = 'Sorry, something went wrong. Please try again.';
      if (status === 400 && msg) content = msg;
      else if (status === 401) content = 'Please log in to use the assistant.';
      else if (status === 429) content = msg || 'Too many requests. Please wait a few minutes and try again.';
      else if ((status === 502 || status === 503) && msg) content = msg;
      setMessages((prev) => [...prev, { role: 'assistant', content }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-2xl shadow-sm overflow-hidden transition-colors duration-200 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Krishi Assistant</h3>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div className="overflow-y-auto min-h-[200px] max-h-[320px] p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
        {messages.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
            Ask agriculture-related questions (crops, soil, pests, irrigation, weather, schemes). Min 10 characters.
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white dark:bg-green-700'
                  : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-600'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3 py-2 bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Loader size={14} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.slice(0, MAX_QUESTION_LENGTH))}
            onKeyDown={handleKeyDown}
            placeholder="Ask about crops, soil, weather, farming... (min 10 characters)"
            maxLength={MAX_QUESTION_LENGTH}
            className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || loading || inputValue.trim().length < MIN_QUESTION_LENGTH}
            className="p-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex-shrink-0"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;
