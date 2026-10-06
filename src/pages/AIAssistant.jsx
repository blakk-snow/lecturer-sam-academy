/**
 * AIAssistant.jsx — full-page view of the shared assistant thread
 *
 * The conversation state lives in ChatContext, so this page and the
 * floating drawer show the same messages. The floating launcher opens
 * this page via its expand button.
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ChatPanel } from '../components/chat/ChatPanel';

export default function AIAssistant() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8.5rem)]">
      <div className="flex items-center gap-2 pb-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-paper"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-lg font-bold font-serif">AI Assistant</h1>
      </div>
      <div className="flex-1 min-h-0 rounded-2xl border border-line overflow-hidden bg-paper">
        <ChatPanel className="h-full" />
      </div>
    </div>
  );
}
