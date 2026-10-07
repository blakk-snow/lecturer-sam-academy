/**
 * ChatLauncher.jsx — floating assistant button + slide-over panel
 *
 * Mounted in AppShell so the assistant is reachable from every page.
 * The panel and the full /ai-assistant page share one thread via ChatContext.
 */

import { Link } from 'react-router-dom';
import { Bot, Expand, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { ChatPanel } from './ChatPanel';

export function ChatLauncher() {
  const { panelOpen, openPanel, closePanel } = useChat();

  return (
    <>
      {!panelOpen && (
        <button
          onClick={openPanel}
          className="fixed right-4 bottom-20 md:bottom-6 z-40 w-12 h-12 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:bg-accent/90 transition print:hidden"
          aria-label="Open AI assistant"
        >
          <Bot size={22} />
        </button>
      )}

      {panelOpen && (
        <>
          {/* Backdrop — click outside to close (mobile) */}
          <div
            className="fixed inset-0 z-40 bg-black/30 md:bg-transparent md:pointer-events-none print:hidden"
            onClick={closePanel}
            aria-hidden="true"
          />

          <div className="fixed z-50 right-0 top-0 bottom-0 w-full sm:w-[26rem] max-w-full bg-paper shadow-2xl flex flex-col print:hidden">
            <div className="flex items-center gap-2 border-b border-line bg-card px-3 py-2.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Bot size={16} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">AI Assistant</p>
                <p className="text-xs text-ink-soft truncate">NaCCA Common Core Programme</p>
              </div>
              <Link
                to="/ai-assistant"
                onClick={closePanel}
                className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper"
                aria-label="Open full page"
              >
                <Expand size={15} />
              </Link>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper"
                aria-label="Close panel"
              >
                <X size={16} />
              </button>
            </div>
            <ChatPanel className="flex-1 min-h-0" />
          </div>
        </>
      )}
    </>
  );
}
