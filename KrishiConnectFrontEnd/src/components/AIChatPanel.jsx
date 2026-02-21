import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Loader } from 'lucide-react';

// ============================================================================
// AI CHAT PANEL – Expandable below AI card; same layout/theme as Home sections
// ============================================================================

/**
 * Placeholder: replace with real backend AI API.
 * @param {string} message - User message
 * @returns {Promise<string>} - AI reply
 */
const sendMessage = async (message) => {
  // TODO: integrate backend AI API
  await new Promise((r) => setTimeout(r, 800));
  return `This is a placeholder reply to: "${message}". Connect your AI API in sendMessage.`;
};

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

    const userMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const reply = await sendMessage(text);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
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
        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">AI Assistant</h3>
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
            Ask anything about crops, weather, or farming.
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
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="flex-1 min-w-0 px-3 py-2.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 transition"
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputValue.trim() || loading}
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
