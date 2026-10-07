/**
 * ChatPanel.jsx — the shared assistant conversation UI
 *
 * Used full-page by the AI Assistant route and compactly by the floating
 * drawer. Renders messages (markdown + sources + links + chips), the
 * active-flow options, and the input bar.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Loader2, Send, Trash2, User, Globe, BookOpen, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useUsage, FREE_MONTHLY_LIMIT } from '../../hooks/useUsage';
import { Markdown } from './Markdown';

function MessageBubble({ message, interactive, picks, busy, onChip, closePanel }) {
  const isUser = message.role === 'user';
  const showChips = interactive && message.chips?.length > 0;

  return (
    <div className={`flex gap-2 items-start ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
          isUser ? 'bg-accent text-white' : 'bg-paper border border-line text-accent'
        }`}
        aria-hidden="true"
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className={`max-w-[85%] min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-accent text-white rounded-tr-sm inline-block text-left'
              : 'bg-card border border-line rounded-tl-sm'
          }`}
        >
          {isUser
            ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            : <Markdown text={message.content} />
          }

          {/* Web-search sources */}
          {message.sources?.length > 0 && (
            <div className="mt-2 pt-2 border-t border-line space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Sources</p>
              {message.sources.map((src, i) => (
                <a
                  key={i}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-accent underline break-all hover:text-accent/80"
                >
                  {i + 1}. {src.title || src.url}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Navigation links — close the floating panel so the target page is visible */}
        {message.links?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.links.map((link, i) => (
              <Link
                key={i}
                to={link.to}
                onClick={closePanel}
                className="rounded-xl bg-accent text-white text-sm font-medium px-3 py-1.5 hover:bg-accent/90 transition"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Chips (greeting actions, flow options, confirm choices) */}
        {showChips && (
          <div className="mt-2 flex flex-col gap-1.5">
            {message.chips.map(chip => {
              const checked = picks?.has(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => onChip(chip.id)}
                  disabled={busy}
                  className={`text-left rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
                    checked
                      ? 'border-accent bg-accent/10 text-accent font-medium'
                      : 'border-line bg-card text-ink hover:border-accent hover:bg-accent/5'
                  }`}
                >
                  {chip.label}
                  {checked ? ' ✓' : ''}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({ className = '' }) {
  const {
    messages, loading, error, flow, send, handleChip, cancelFlow, clear,
    persona, setPersona, classLevel, setClassLevel, mode, setMode,
    closePanel,
  } = useChat();
  const { signedIn, plan, remaining, outOfQuota } = useUsage();

  const [input, setInput] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, loading]);

  const lastAssistantId = [...messages].reverse().find(m => m.role === 'assistant')?.id;

  function submit() {
    const text = input.trim();
    if (!text) return;
    setInput('');
    send(text);
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={`flex flex-col min-h-0 bg-paper ${className}`}>
      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-line bg-card px-3 py-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-line bg-paper p-0.5" role="group" aria-label="Assistant mode">
            <button
              type="button"
              onClick={() => setMode('assistant')}
              aria-pressed={mode === 'assistant'}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === 'assistant' ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <BookOpen size={12} /> Assistant
            </button>
            <button
              type="button"
              onClick={() => setMode('research')}
              aria-pressed={mode === 'research'}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === 'research' ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              <Globe size={12} /> Research
            </button>
          </div>

          <div className="flex rounded-lg border border-line bg-paper p-0.5" role="group" aria-label="Persona">
            {['teacher', 'student'].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPersona(p)}
                aria-pressed={persona === p}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  persona === p ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {persona === 'student' && (
            <select
              value={classLevel}
              onChange={e => setClassLevel(e.target.value)}
              className="rounded-lg border border-line bg-paper px-2 py-1 text-xs text-ink"
              aria-label="Student class level"
            >
              {['Basic 7', 'Basic 8', 'Basic 9'].map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          )}

          {messages.length > 1 && (
            <button
              onClick={() => { if (window.confirm('Clear this conversation?')) clear(); }}
              className="ml-auto p-1.5 rounded-lg text-ink-soft hover:text-red-500 hover:bg-red-50"
              aria-label="Clear conversation"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* Plan / quota line */}
        <p className="mt-1.5 text-[11px] text-ink-soft">
          {!signedIn ? (
            <Link to="/profile" className="text-accent hover:underline">Sign in to use the assistant</Link>
          ) : plan === 'pro' ? (
            'Pro plan — unlimited AI generations'
          ) : outOfQuota ? (
            <Link to="/profile" className="text-amber-700 hover:underline">
              Monthly limit reached — upgrade to Pro
            </Link>
          ) : (
            <>Free plan — {remaining} of {FREE_MONTHLY_LIMIT} AI generations left</>
          )}
        </p>
      </div>

      {/* ── Thread ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            interactive={
              Boolean(flow)
                ? msg.id === lastAssistantId
                : (msg.id === 'greeting' || msg.id === lastAssistantId) && msg.chips?.length > 0
            }
            picks={flow?.stage == null && flow?.picks?.size ? flow.picks : null}
            busy={loading}
            onChip={handleChip}
            closePanel={closePanel}
          />
        ))}

        {loading && (
          <div className="flex gap-2 items-start">
            <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 bg-paper border border-line text-accent">
              <Bot size={14} />
            </div>
            <div className="bg-card border border-line rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <Loader2 size={14} className="text-accent animate-spin" />
              <span className="text-sm text-ink-soft">Working…</span>
            </div>
          </div>
        )}

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

        {flow && (
          <div className="flex items-center gap-2">
            <button
              onClick={cancelFlow}
              className="flex items-center gap-1 text-xs text-ink-soft hover:text-red-500"
            >
              <X size={12} /> Cancel this flow
            </button>
          </div>
        )}

        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-line bg-card px-3 py-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={onKeyDown}
            placeholder={mode === 'research' ? 'Ask me to research a topic…' : 'Ask about any curriculum topic…'}
            disabled={loading}
            className="flex-1 resize-none overflow-hidden border border-line rounded-xl bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-accent leading-relaxed disabled:opacity-50"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            aria-label="Message input"
          />
          <button
            onClick={submit}
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
        <p className="text-[11px] text-ink-soft/60 text-center mt-1.5">
          AI responses may contain errors — always verify against the official NaCCA curriculum.
        </p>
      </div>
    </div>
  );
}
