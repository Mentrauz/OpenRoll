'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

// ─── Suggestion pills ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'List all company units',
  'Show employee details',
  'Salary breakdown for last month',
  'Compare salary between months',
];

// ─── Input component ──────────────────────────────────────────────────────────

const CopilotInput = ({
  onSend,
  isLoading,
  isOpen,
}: {
  onSend: (text: string) => void;
  isLoading: boolean;
  isOpen: boolean;
}) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="copilot-input-area">
      <input
        ref={inputRef}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Ask about employees, salaries, attendance..."
        className="copilot-input"
        disabled={isLoading}
      />
      <button type="submit" className="copilot-send-btn" disabled={isLoading || !input.trim()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </form>
  );
};

// ─── Main widget ──────────────────────────────────────────────────────────────

export default function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build history including the new user message
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        text: m.text,
      }));

      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(errBody || `HTTP ${response.status}`);
      }

      const responseText = await response.text();
      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: responseText,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('[CopilotWidget] error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: 'Sorry, I encountered an error fetching data. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const starIcon = (
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
  );

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="copilot-fab"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.4 }}
      >
        <span className="copilot-fab-icon">
          {isOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {starIcon}
            </svg>
          )}
        </span>
        {!isOpen && <span className="copilot-fab-label">AI Copilot</span>}
      </motion.button>

      {/* Chat Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="copilot-drawer"
            className="copilot-drawer"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="copilot-header">
              <div className="copilot-header-left">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="copilot-back-btn"
                    title="Back to main page"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  </button>
                )}
                <div className="copilot-avatar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {starIcon}
                  </svg>
                </div>
                <div>
                  <h3 className="copilot-title">Payroll Copilot</h3>
                  <span className="copilot-subtitle">Powered by Gemini</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="copilot-close-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Messages Area */}
            <div className="copilot-messages">
              {messages.length === 0 && (
                <div className="copilot-empty-state">
                  <div className="copilot-empty-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {starIcon}
                    </svg>
                  </div>
                  <p className="copilot-empty-title">How can I help?</p>
                  <p className="copilot-empty-desc">
                    Ask me anything about employees, salaries, attendance, or payroll compliance.
                  </p>
                  <div className="copilot-suggestions">
                    {SUGGESTIONS.map((s, i) => (
                      <button key={i} onClick={() => sendMessage(s)} className="copilot-suggestion-pill">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map(m => (
                <div
                  key={m.id}
                  className={`copilot-message ${m.role === 'user' ? 'copilot-message-user' : 'copilot-message-assistant'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="copilot-message-avatar">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {starIcon}
                      </svg>
                    </div>
                  )}
                  <div className={`copilot-bubble ${m.role === 'user' ? 'copilot-bubble-user' : 'copilot-bubble-assistant'}`}>
                    {m.role === 'user' ? (
                      <span>{m.text}</span>
                    ) : (
                      <div className="copilot-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="copilot-message copilot-message-assistant">
                  <div className="copilot-message-avatar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {starIcon}
                    </svg>
                  </div>
                  <div className="copilot-bubble copilot-bubble-assistant">
                    <div className="copilot-typing">
                      <span className="copilot-typing-dot" />
                      <span className="copilot-typing-dot" />
                      <span className="copilot-typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <CopilotInput
              onSend={sendMessage}
              isLoading={isLoading}
              isOpen={isOpen}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
