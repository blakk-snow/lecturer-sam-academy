import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { curriculumChat } from '../services/ai';

// ── Markdown-lite renderer (same pattern as Curriculum.jsx) ───────────────────

function AiText({ text }) {
  if (!text) return null;
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {paragraphs.map((para, i) => {
        const lines = para.split('\n');
        return (
          <div key={i} className="space-y-0.5">
            {lines.map((line, j) => {
              const boldHeading = line.match(/^\*\*(.+)\*\*\s*:?\s*(.*)$/);
              if (boldHeading) {
                return (
                  <p key={j} className="text-sm leading-relaxed">
                    <span className="font-semibold text-ink">{boldHeading[1]}</span>
                    {boldHeading[2] && <span className="text-ink"> — {boldHeading[2]}</span>}
                  </p>
                );
              }
              if (/^(\d+\.|[-•*])\s/.test(line)) {
                return <p key={j} className="text-sm text-ink pl-3 leading-relaxed">{line}</p>;
              }
              return line.trim()
                ? <p key={j} className="text-sm text-ink leading-relaxed">{line}</p>
                : null;
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Suggested prompts ─────────────────────────────────────────────────────────

const SUGGESTIONS = [
  'What is the difference between a content standard and an indicator?',
  'Suggest 3 starter activities for teaching fractions to Basic 7 learners.',
  'How do I teach the water cycle in a school with no internet access?',
  'What are the NaCCA core competencies and how do I embed them in a lesson?',
  'Explain the coding in NaCCA curriculum indicators like B7.1.1.1.1.',
  'Give me ideas for cross-curricular activities linking Science and English.',
];

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-2 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
          isUser ? 'bg-accent text-white' : 'bg-paper border border-line text-accent'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[82%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-accent text-white rounded-tr-sm'
            : 'bg-card border border-line rounded-tl-sm'
        }`}
      >
        {isUser
          ? <p className="text-sm leading-relaxed">{message.content}</p>
          : <AiText text={message.content} />
        }
      </div>
    </div>
  );
}

// ── Thinking indicator ────────────────────────────────────────────────────────

function ThinkingBubble() {
  return (
    <div className="flex gap-2 items-start">
      <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 bg-paper border border-line text-accent">
        <Bot size={14} />
      </div>
      <div className="bg-card border border-line rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <Loader2 size={14} className="text-accent animate-spin" />
        <span className="text-sm text-ink-soft">Thinking…</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const WELCOME = {
  role: 'assistant',
  content: `Hello! I'm your NaCCA curriculum assistant. I can help you:

• **Understand curriculum indicators** — explain what any code means
• **Plan lessons** — suggest activities, starters, plenaries and resources
• **Create assessments** — questions, quizzes and rubrics aligned to indicators
• **Embed core competencies** — show how to weave CC, CI, CP, DL and PL into lessons
• **Connect subjects** — suggest cross-curricular links

What would you like help with today?`,
};

export default function AIAssistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = useCallback(async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    setInput('');
    setError(null);

    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build history excluding the welcome message for the API call
      const history = [
        ...messages.filter(m => m !== WELCOME),
        userMsg,
      ].map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

      const reply = await curriculumChat(history);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err?.message ?? String(err) ?? 'Something went wrong. Make sure the AI server is running.';
      setError(msg);
      // Remove the optimistic user message on failure
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleClear() {
    if (messages.length <= 1) return;
    if (window.confirm('Clear this conversation?')) {
      setMessages([WELCOME]);
      setError(null);
    }
  }

  const showSuggestions = messages.length === 1 && !loading;

  return (
    <div className="flex flex-col h-dvh bg-paper">

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <div className="shrink-0 sticky top-0 z-10 bg-card border-b border-line px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <Bot size={16} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink leading-tight">Curriculum Assistant</p>
            <p className="text-xs text-ink-soft truncate">NaCCA Common Core Programme</p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-ink-soft hover:text-red-500 hover:bg-red-50"
            aria-label="Clear conversation"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* ── Message thread ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && <ThinkingBubble />}

        {/* Suggested prompts — shown only on fresh conversation */}
        {showSuggestions && (
          <div className="mt-4">
            <p className="text-xs text-ink-soft mb-2 font-medium uppercase tracking-wide">Try asking…</p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="text-left rounded-xl border border-line bg-card px-3 py-2.5 text-sm text-ink hover:border-accent hover:bg-accent/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold mb-0.5">Request failed</p>
            <p>{error}</p>
            {import.meta.env.DEV && (
              <p className="mt-1.5 text-xs text-red-500">
                Make sure the AI proxy is running: <code className="font-mono">node server.js</code>
              </p>
            )}
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-line bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Auto-grow: reset then set scrollHeight
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask about any curriculum topic…"
            disabled={loading}
            className="flex-1 resize-none overflow-hidden border border-line rounded-xl bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent leading-relaxed disabled:opacity-50"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            aria-label="Message input"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="shrink-0 w-10 h-10 rounded-xl bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            {loading
              ? <Loader2 size={16} className="animate-spin" />
              : <Send size={16} />
            }
          </button>
        </div>
        <p className="text-xs text-ink-soft/50 text-center mt-2">
          AI responses may contain errors — always verify against the official NaCCA curriculum.
        </p>
      </div>

    </div>
  );
}
