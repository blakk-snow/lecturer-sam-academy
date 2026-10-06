/**
 * ChatContext.jsx — shared assistant state for the floating panel and the
 * full AI Assistant page (one thread, two surfaces).
 *
 * Handles: greeting + action chips, guided flows (timetable, lesson plan),
 * research mode with web search, streaming responses, and Dexie persistence.
 */

import {
  createContext, useCallback, useContext, useEffect, useRef, useState,
} from 'react';
import { useAuth } from './AuthContext';
import { usePlannerActions, useTerms } from '../hooks/usePlanner';
import { useTeacherSchedule } from '../hooks/useTeacherSchedule';
import { curriculumChatStream, researchChatStream } from '../services/ai';
import { db } from '../db/database';
import { ACTION_CHIPS, FLOWS } from '../components/chat/flows';

const ChatContext = createContext(null);

const THREAD_ID = 'default';

const GREETING = {
  id: 'greeting',
  role: 'assistant',
  content: `Hello! I'm your teaching assistant for the NaCCA Common Core Programme. I can:

- **Create a timetable** for your classes
- **Create a lesson plan** from any curriculum indicator
- **Research topics online** with sources
- **Answer questions** about any content standard or indicator

What would you like to do?`,
  chips: ACTION_CHIPS,
};

const nextId = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export function ChatProvider({ children }) {
  const { user } = useAuth();
  const planner = usePlannerActions();
  const terms = useTerms();
  const { schedule, source: scheduleSource, save: saveSchedule } = useTeacherSchedule();

  const [messages, setMessages] = useState([GREETING]);
  const [persona, setPersona] = useState('teacher');
  const [classLevel, setClassLevel] = useState('Basic 7');
  const [mode, setMode] = useState('assistant'); // 'assistant' | 'research'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [flow, setFlow] = useState(null); // { flowId, stepIndex, data, picks, stage }
  const [panelOpen, setPanelOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const flowRef = useRef(flow);
  flowRef.current = flow;

  // ── Persistence ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    db.chatThreads.get(THREAD_ID).then(row => {
      if (cancelled || !row) return;
      if (row.messages?.length) setMessages(row.messages);
      setPersona(row.persona ?? 'teacher');
      setMode(row.mode ?? 'assistant');
      setClassLevel(row.classLevel ?? 'Basic 7');
    }).finally(() => setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const timer = setTimeout(() => {
      db.chatThreads.put({
        id: THREAD_ID,
        messages: messages.slice(-60),
        persona,
        mode,
        classLevel,
        updatedAt: Date.now(),
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [loaded, messages, persona, mode, classLevel]);

  // ── Message helpers ──────────────────────────────────────────────────────────
  const appendMessage = useCallback(msg => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id, patch) => {
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  // ── Flow engine ──────────────────────────────────────────────────────────────
  const ctx = {
    planner,
    uid: user?.uid ?? null,
    saveSchedule,
    scheduleData: schedule,
    listTerms: () => (terms ?? []),
  };
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  const pushStep = useCallback(async (flowState) => {
    const def = FLOWS[flowState.flowId];
    const step = def.steps[flowState.stepIndex];
    const options = step.options ? await step.options(ctxRef.current, flowState.data) : undefined;
    appendMessage({
      id: nextId(),
      role: 'assistant',
      content: step.ask(flowState.data),
      chips: options,
    });
  }, [appendMessage]);

  const runExecute = useCallback(async (flowState) => {
    setFlow(null);
    setLoading(true);
    try {
      const def = FLOWS[flowState.flowId];
      const result = await def.execute(ctxRef.current, flowState.data);
      if (result.stage === 'confirm') {
        setFlow({ flowId: flowState.flowId, data: flowState.data, stage: 'confirm' });
      }
      appendMessage({
        id: nextId(),
        role: 'assistant',
        content: result.reply,
        chips: result.chips,
        links: result.links,
      });
    } catch (err) {
      appendMessage({
        id: nextId(),
        role: 'assistant',
        content: `Sorry, that didn't work: ${err?.message ?? 'unknown error'}. Please try again.`,
      });
    } finally {
      setLoading(false);
    }
  }, [appendMessage]);

  const advance = useCallback(async (flowState) => {
    const def = FLOWS[flowState.flowId];
    let next = flowState.stepIndex + 1;
    const step = def.steps[flowState.stepIndex];
    if (step.jump) {
      const jump = step.jump(flowState.data);
      if (jump != null) next = jump;
    }
    if (next < def.steps.length) {
      setFlow({ ...flowState, stepIndex: next, picks: new Set() });
      await pushStep({ ...flowState, stepIndex: next });
    } else {
      await runExecute(flowState);
    }
  }, [pushStep, runExecute]);

  const beginFlow = useCallback(async (flowId) => {
    const flowState = { flowId, stepIndex: 0, data: {}, picks: new Set(), stage: null };
    setFlow(flowState);
    await pushStep(flowState);
  }, [pushStep]);

  const cancelFlow = useCallback(() => {
    setFlow(null);
    appendMessage({ id: nextId(), role: 'assistant', content: 'Okay, cancelled. How else can I help?' });
  }, [appendMessage]);

  const handleFlowChip = useCallback(async (chipId) => {
    const flowState = flowRef.current;
    if (!flowState) return;
    const def = FLOWS[flowState.flowId];

    if (flowState.stage === 'confirm') {
      setLoading(true);
      try {
        const result = await def.confirm(ctxRef.current, flowState, chipId);
        if (result.stage === 'confirm') {
          setFlow(flowState);
        } else {
          setFlow(null);
        }
        appendMessage({ id: nextId(), role: 'assistant', content: result.reply, chips: result.chips, links: result.links });
      } catch (err) {
        setFlow(null);
        appendMessage({ id: nextId(), role: 'assistant', content: `Sorry, that didn't work: ${err?.message ?? 'unknown error'}.` });
      } finally {
        setLoading(false);
      }
      return;
    }

    const step = def.steps[flowState.stepIndex];
    if (step.multi) {
      if (chipId === '__done') {
        if (flowState.picks.size === 0) {
          appendMessage({ id: nextId(), role: 'assistant', content: 'Please pick at least one option first.' });
          return;
        }
        flowState.data[step.key] = [...flowState.picks];
        await advance(flowState);
      } else {
        const picks = new Set(flowState.picks);
        if (picks.has(chipId)) picks.delete(chipId); else picks.add(chipId);
        setFlow({ ...flowState, picks });
      }
    } else {
      flowState.data[step.key] = chipId;
      await advance(flowState);
    }
  }, [advance, appendMessage]);

  const handleFlowText = useCallback(async (text) => {
    const flowState = flowRef.current;
    if (!flowState) return;
    const def = FLOWS[flowState.flowId];
    if (flowState.stage === 'confirm') {
      appendMessage({ id: nextId(), role: 'assistant', content: 'Please pick one of the options above.' });
      return;
    }
    const step = def.steps[flowState.stepIndex];
    if (step.freeText) {
      if (step.validate && !step.validate(text, flowState.data)) {
        appendMessage({ id: nextId(), role: 'assistant', content: step.invalid ?? 'That input doesn\'t look right — please try again.' });
        return;
      }
      flowState.data[step.key] = text.trim();
      await advance(flowState);
    } else {
      appendMessage({ id: nextId(), role: 'assistant', content: 'Please pick one of the options below.' });
    }
  }, [advance, appendMessage]);

  // ── Sending ──────────────────────────────────────────────────────────────────
  const handleChip = useCallback(async (chipId) => {
    const flowState = flowRef.current;
    if (flowState) {
      await handleFlowChip(chipId);
      return;
    }
    if (chipId === 'research') {
      setMode('research');
      appendMessage({
        id: nextId(),
        role: 'assistant',
        content: 'Research mode is on — I\'ll search the web and cite my sources. What topic, content standard, or indicator should I look up?',
      });
      return;
    }
    if (chipId === 'sampleplans') {
      const { sampleLessonPlans } = await import('../data/sampleLessonPlans');
      const list = sampleLessonPlans.map(p =>
        `- **${p.title}** — Content Standard ${p.contentStandard || '—'} (Indicators: ${p.indicators.map(i => i.code).join(', ') || '—'})`,
      ).join('\n');
      appendMessage({
        id: nextId(),
        role: 'assistant',
        content: `Here are the bundled sample lesson notes (Week 5):\n\n${list}\n\nCreate a lesson plan slot for the same subject and class, then use "Load into this note" on the lesson page.`,
        links: [{ label: 'Open Planner →', to: '/planner' }],
      });
      return;
    }
    if (FLOWS[chipId]) {
      await beginFlow(chipId);
    }
  }, [appendMessage, beginFlow, handleFlowChip]);

  const send = useCallback(async (rawText) => {
    const text = (rawText ?? '').trim();
    if (!text || loading) return;

    // Active flow? Route the text through the flow engine instead of the AI.
    if (flowRef.current) {
      await handleFlowText(text);
      return;
    }

    setError(null);
    const userMsg = { id: nextId(), role: 'user', content: text };
    appendMessage(userMsg);

    const assistantId = nextId();
    appendMessage({ id: assistantId, role: 'assistant', content: '' });
    setLoading(true);

    const history = [...messagesRef.current, userMsg]
      .filter(m => m.id !== 'greeting')
      .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }));

    const onToken = (delta) => {
      setMessages(prev => prev.map(m => (
        m.id === assistantId ? { ...m, content: m.content + delta } : m
      )));
    };

    try {
      const call = mode === 'research'
        ? researchChatStream(history, { onToken })
        : curriculumChatStream(history, {
            persona, classLevel,
            scheduleData: schedule, scheduleSource,
            onToken,
          });
      const { text: reply, sources } = await call;
      updateMessage(assistantId, { content: reply || '_(no response)_', sources });
    } catch (err) {
      const msg = err?.message ?? String(err) ?? 'Something went wrong. Please try again.';
      setMessages(prev => prev.filter(m => m.id !== assistantId));
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [appendMessage, classLevel, handleFlowText, loading, mode, persona, schedule, scheduleSource, updateMessage]);

  const clear = useCallback(async () => {
    setMessages([GREETING]);
    setFlow(null);
    setError(null);
    await db.chatThreads.delete(THREAD_ID);
  }, []);

  const value = {
    messages,
    loading,
    error,
    persona,
    setPersona,
    classLevel,
    setClassLevel,
    mode,
    setMode,
    flow,
    send,
    handleChip,
    cancelFlow,
    clear,
    panelOpen,
    setPanelOpen,
    openPanel: () => setPanelOpen(true),
    closePanel: () => setPanelOpen(false),
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used inside ChatProvider');
  return ctx;
}
