import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookMarked, BookOpen, CalendarDays, CalendarRange, ChevronDown, Compass,
  GraduationCap, HelpCircle, LineChart, PenLine, Sparkles, Target, UserRound,
} from 'lucide-react';

/**
 * Help.jsx — "How to use this app" guide
 *
 * One section per feature area: what it is, how to use it step by step,
 * and a link straight into the feature.
 */

const SECTIONS = [
  {
    id: 'library',
    icon: BookMarked,
    title: 'Course Library',
    what: 'Curriculum-driven content for learners — notes, practice questions and quizzes aligned to the NaCCA indicators.',
    steps: [
      'Open Notes from the Library or Student menu.',
      'Pick a subject, then a class (Basic 7–9).',
      'Browse the strands and choose an indicator with a 📖 notes or 🎯 questions badge.',
      'Read the notes, attempt the practice questions, or take the indicator quiz — progress is saved on the device.',
    ],
    to: '/course',
    linkLabel: 'Open the Course Library',
  },
  {
    id: 'textbooks',
    icon: BookOpen,
    title: 'Textbooks (Learner\'s Books, Workbooks)',
    what: 'The full NaCCA textbooks for English and Mathematics (Basic 7–9), browsable chapter by chapter with their figures.',
    steps: [
      'In the Course Library, scroll to the Textbooks section for the subject and class.',
      'Open a book and pick a chapter from the dropdown.',
      'Use the curriculum-alignment chips at the top of each chapter to jump to the indicators it teaches.',
      'Tap "Plan a lesson from this chapter" to start a guided lesson-plan flow for that chapter\'s content.',
    ],
    to: '/course',
    linkLabel: 'Open the Course Library',
  },
  {
    id: 'planner',
    icon: CalendarDays,
    title: 'Lesson Planner',
    what: 'Build your terms, classes, subjects and weekly topics, then write or AI-generate lesson notes with auto-save.',
    steps: [
      'Open Planner from the Teacher menu and create a term (e.g. First Term, 2026/2027).',
      'Add a class group (Basic 7–9), then subjects — link each subject to its curriculum subject and class.',
      'Open a subject and add topics per week, picking strands, content standards and indicators from the curriculum.',
      'Open a topic to write its lesson note — use the ✨ buttons to generate any part, or the whole plan, with AI.',
      'When you sign in with Google, your planner syncs across devices; without an account it stays on this device.',
    ],
    to: '/planner',
    linkLabel: 'Open the Planner',
  },
  {
    id: 'method',
    icon: PenLine,
    title: 'Teaching-method lesson plans',
    what: 'Your 7-step method — EOPT/dictation, correction, objectives, media, reading time, discussion, assignment (mental-maths variant for Mathematics).',
    steps: [
      'On any library indicator or textbook chapter, tap "Plan this lesson".',
      'Answer just two questions — which term and which week — and the assistant creates the planner rows for you.',
      'Tap "Generate the full lesson note" to draft the complete plan following the teaching method, grounded in the curriculum text, the app\'s notes and the textbook chapter.',
      'The finished note shows the numbered 7-step plan; use "Download PDF" to save or print it in the same layout.',
    ],
    to: '/course',
    linkLabel: 'Start from a content page',
  },
  {
    id: 'timetable',
    icon: CalendarRange,
    title: 'Timetable',
    what: 'Your weekly teaching timetable, one grid per class, saved to your account when signed in.',
    steps: [
      'Open Timetable from the Teacher menu.',
      'Pick a class (add new classes with the + Add class chip).',
      'Tap any period cell and type the subject; add more periods with "Add period".',
      'Save changes — they sync to your Google account, and stay on the device when offline.',
      'Tip: the AI assistant can generate a complete timetable for you from a chat.',
    ],
    to: '/timetable',
    linkLabel: 'Open the Timetable',
  },
  {
    id: 'assistant',
    icon: Sparkles,
    title: 'AI Assistant',
    what: 'A chat assistant available on every page that can create timetables and lesson plans, answer curriculum questions, and research the web with sources.',
    steps: [
      'Tap the floating ✨ button (bottom right) on any page — the panel opens with a greeting and action chips.',
      '"Create a timetable" and "Create a lesson plan" walk you through a short guided chat and do the real work in the app.',
      '"Research a topic online" switches to research mode — ask about any content standard or indicator and the answer cites its sources.',
      'Switch between Teacher and Student modes with the toggle; the full-screen version is behind the expand button.',
    ],
    to: '/ai-assistant',
    linkLabel: 'Open the full assistant',
  },
  {
    id: 'curriculum',
    icon: Compass,
    title: 'Curriculum browser & Scheme of Learning',
    what: 'Explore the complete NaCCA Common Core Programme (all 10 subjects, Basic 7–9) and the 2026/2027 Maths & Science scheme.',
    steps: [
      'Open Curriculum from the Library menu, pick a subject and class, and drill into strands, sub-strands, content standards and indicators.',
      'Use the AI drawer (✨ button) on any standard to generate a lesson, activities, an assessment, or a plain-language explanation.',
      'Open Scheme from the Teacher menu to browse the week-by-week Maths and Science scheme with resources and source notes.',
    ],
    to: '/curriculum',
    linkLabel: 'Open the Curriculum',
  },
  {
    id: 'practice',
    icon: Target,
    title: 'Practice & the BECE question bank',
    what: 'Course practice questions plus a full bank of BECE-style mock papers parsed from the bundled science papers.',
    steps: [
      'Open Practice from the Student menu and choose the Course Practice or BECE Question Bank tab.',
      'In the bank, pick a class, then a mock paper (each has 40 objective questions and theory questions).',
      'Answer questions for instant feedback, and finish for your score — attempts are recorded on the device.',
      'Bundled sample lesson notes can also be loaded into any matching lesson plan from its overview page.',
    ],
    to: '/practice',
    linkLabel: 'Open Practice',
  },
  {
    id: 'profile',
    icon: UserRound,
    title: 'Profile, progress & accounts',
    what: 'Student progress lives on the device; an optional Google account syncs teacher data (planner + timetable) across devices.',
    steps: [
      'Open Profile from the Settings menu to set the learner\'s name and text size — no account is needed for learning.',
      'In the Teacher account card, sign in with Google to sync your lesson plans and timetable to your account.',
      'Progress (also in Settings) shows lesson and planning progress. The whole app works offline after the first visit and can be installed like an app.',
    ],
    to: '/profile',
    linkLabel: 'Open Profile',
  },
];

function HelpSection({ section, open, onToggle }) {
  const Icon = section.icon;
  return (
    <div className="rounded-2xl border border-line bg-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-paper transition"
        aria-expanded={open}
      >
        <span className="inline-flex rounded-lg bg-accent/10 p-2 shrink-0">
          <Icon size={17} className="text-accent" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-serif text-base text-ink">{section.title}</span>
        </span>
        <ChevronDown size={17} className={`shrink-0 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0.5 space-y-3">
          <p className="text-sm text-ink-soft leading-relaxed">{section.what}</p>
          <ol className="space-y-1.5">
            {section.steps.map((step, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-ink leading-relaxed">
                <span className="font-bold text-accent shrink-0">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link to={section.to} className="inline-block text-sm font-medium text-accent hover:underline">
            {section.linkLabel} →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Help() {
  const [openId, setOpenId] = useState(SECTIONS[0].id);

  return (
    <div className="space-y-6 pb-24">
      <div>
        <div className="flex items-center gap-2">
          <HelpCircle size={22} className="text-accent" />
          <h1 className="font-serif text-3xl">How to use this app</h1>
        </div>
        <p className="mt-2 max-w-2xl text-ink-soft">
          A quick tour of Lecturer Sam Academy — tap any section to see what it does and how to use it, step by step.
        </p>
      </div>

      <div className="space-y-3">
        {SECTIONS.map(section => (
          <HelpSection
            key={section.id}
            section={section}
            open={openId === section.id}
            onToggle={() => setOpenId(id => (id === section.id ? null : section.id))}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-card p-5 flex items-start gap-3">
        <GraduationCap size={20} className="text-accent shrink-0 mt-0.5" />
        <p className="text-sm text-ink-soft leading-relaxed">
          Need more help? The <Link to="/ai-assistant" className="text-accent font-medium hover:underline">AI assistant</Link> (the
          floating button on every page) can walk you through any of these features, or answer questions about the NaCCA curriculum.
        </p>
      </div>
    </div>
  );
}
