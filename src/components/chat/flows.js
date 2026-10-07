/**
 * flows.js — guided chat flows that execute real app actions
 *
 * A flow is a fixed sequence of chip/free-text questions that collect a
 * params object, then an `execute` function performs the actual app work
 * (create planner rows, generate + save a timetable, …). Deterministic
 * steps mean the critical parameters are never guessed from free text.
 *
 * ctx (provided by ChatContext):
 *   planner       — usePlannerActions() result (auth-aware Dexie/Firestore)
 *   saveSchedule  — saves a weeklyTimetable (Firestore when signed in, Dexie always)
 *   scheduleData  — current timetable (for context)
 */

import {
  generateTimetable, generateLessonPlan, extractLessonPlanSections,
  generateMethodLessonPlan, extractMethodSections,
} from '../../services/ai';
import { getMethod, methodSectionsToFields } from '../../data/teachingMethods';

export const ACTION_CHIPS = [
  { id: 'timetable', label: '⏰ Create a timetable' },
  { id: 'lessonplan', label: '📋 Create a lesson plan' },
  { id: 'sampleplans', label: '📄 Browse sample lesson plans' },
  { id: 'research', label: '🔍 Research a topic online' },
];

export const DONE_CHIP = { id: '__done', label: 'Continue →' };

const CLASS_CHIPS = [
  { id: 'B7', label: 'Basic 7' },
  { id: 'B8', label: 'Basic 8' },
  { id: 'B9', label: 'Basic 9' },
];

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

async function loadCurriculum() {
  return import('../../data/curriculumData');
}

/** Compact text preview of a generated timetable, one line per day per class. */
function previewTimetable(timetable, classes) {
  let out = '';
  for (const cls of classes) {
    out += `**${cls}**\n`;
    for (const day of DAY_NAMES) {
      const periods = (timetable[cls]?.[day] ?? [])
        .slice()
        .sort((a, b) => (a.period ?? 0) - (b.period ?? 0));
      const cells = periods.map(p => `P${p.period} ${p.subject}`).join(' · ') || '—';
      out += `- ${day}: ${cells}\n`;
    }
    out += '\n';
  }
  return out.trim();
}

// ── Timetable flow ─────────────────────────────────────────────────────────────

const timetableFlow = {
  steps: [
    {
      key: 'classes',
      ask: () => 'Which class(es) should this timetable cover? Pick all that apply, then Continue.',
      options: async () => [
        { id: 'Basic 7', label: 'Basic 7' },
        { id: 'Basic 8', label: 'Basic 8' },
        { id: 'Basic 9', label: 'Basic 9' },
        DONE_CHIP,
      ],
      multi: true,
    },
    {
      key: 'subjects',
      ask: () => 'Which subjects are taught each day? Type them separated by commas.\n\ne.g. Mathematics, English, Science, ICT, RME, Career Technology',
      freeText: true,
      validate: text => text.split(',').filter(s => s.trim()).length >= 2,
      invalid: 'Please list at least two subjects, separated by commas.',
    },
    {
      key: 'periods',
      ask: () => 'How many periods per day?',
      options: async () => [
        { id: '4', label: '4 periods' },
        { id: '6', label: '6 periods' },
        { id: '8', label: '8 periods' },
      ],
    },
  ],
  async execute(ctx, data) {
    const timetable = await generateTimetable({
      classLevels: data.classes,
      subjects: data.subjects.split(',').map(s => s.trim()).filter(Boolean),
      periodsPerDay: Number(data.periods),
    });
    data.timetable = timetable;
    return {
      reply: `Here's a draft ${data.periods}-period timetable:\n\n${previewTimetable(timetable, data.classes)}\n\nSave it, or regenerate for a different arrangement?`,
      chips: [
        { id: 'save', label: '💾 Save timetable' },
        { id: 'regenerate', label: '🔁 Regenerate' },
      ],
      stage: 'confirm',
    };
  },
  async confirm(ctx, flow, chipId) {
    if (chipId === 'regenerate') {
      return timetableFlow.execute(ctx, flow.data);
    }
    if (chipId === 'save') {
      await ctx.saveSchedule(flow.data.timetable);
      return {
        reply: `Timetable saved${ctx.uid ? ' to your account' : ' on this device'} ✅`,
        links: [{ label: 'Open Timetable →', to: '/timetable' }],
        stage: null,
      };
    }
    return { reply: 'Okay, keeping the current timetable.', stage: null };
  },
};

// ── Lesson plan flow ───────────────────────────────────────────────────────────

const lessonPlanFlow = {
  steps: [
    {
      key: 'term',
      ask: () => 'Which term should this lesson plan live in? Or create a new one.',
      options: async (ctx) => {
        const terms = await ctx.listTerms();
        return [
          ...terms.map(t => ({ id: String(t.id), label: `${t.name} (${t.year})` })),
          { id: '__new', label: '➕ Create a new term' },
        ];
      },
      jump: data => (data.term === '__new' ? 1 : 3),
    },
    {
      key: 'termName',
      ask: () => 'What should the new term be called?',
      freeText: true,
      validate: text => text.trim().length > 0,
      invalid: 'Please type a term name, e.g. "First Term".',
    },
    {
      key: 'termNumber',
      ask: () => 'Which term of the year is it?',
      options: async () => [
        { id: '1', label: 'Term 1' },
        { id: '2', label: 'Term 2' },
        { id: '3', label: 'Term 3' },
      ],
    },
    {
      key: 'class',
      ask: () => 'Which class level?',
      options: async () => CLASS_CHIPS,
    },
    {
      key: 'subject',
      ask: () => 'Which subject?',
      options: async () => {
        const { subjects } = await loadCurriculum();
        return subjects.map(s => ({ id: s.id, label: s.label }));
      },
    },
    {
      key: 'strand',
      ask: data => `Which strand for this lesson?`,
      options: async (ctx, data) => {
        const { curriculumMap } = await loadCurriculum();
        const strands = (curriculumMap[data.subject] ?? {})[data.class] ?? [];
        return strands.map(s => ({ id: s.id, label: s.title }));
      },
    },
    {
      key: 'subStrand',
      ask: () => 'Which sub-strand?',
      options: async (ctx, data) => {
        const { curriculumMap } = await loadCurriculum();
        const strands = (curriculumMap[data.subject] ?? {})[data.class] ?? [];
        const strand = strands.find(s => s.id === data.strand);
        return (strand?.subStrands ?? []).map(ss => ({ id: ss.id, label: `${ss.code} ${ss.title}` }));
      },
    },
    {
      key: 'contentStandard',
      ask: () => 'Which content standard?',
      options: async (ctx, data) => {
        const { curriculumMap } = await loadCurriculum();
        const strands = (curriculumMap[data.subject] ?? {})[data.class] ?? [];
        const strand = strands.find(s => s.id === data.strand);
        const ss = (strand?.subStrands ?? []).find(s => s.id === data.subStrand);
        return (ss?.contentStandards ?? []).map(cs => ({
          id: cs.id,
          label: `${cs.code} — ${cs.description.slice(0, 64)}${cs.description.length > 64 ? '…' : ''}`,
        }));
      },
    },
    {
      key: 'indicators',
      ask: () => 'Which indicators does this lesson cover? Pick all that apply, then Continue.',
      options: async (ctx, data) => {
        const { curriculumMap } = await loadCurriculum();
        const strands = (curriculumMap[data.subject] ?? {})[data.class] ?? [];
        const strand = strands.find(s => s.id === data.strand);
        const ss = (strand?.subStrands ?? []).find(s => s.id === data.subStrand);
        const cs = (ss?.contentStandards ?? []).find(c => c.id === data.contentStandard);
        return [
          ...(cs?.indicators ?? []).map(ind => ({
            id: ind.id,
            label: `${ind.code} — ${ind.description.slice(0, 56)}${ind.description.length > 56 ? '…' : ''}`,
          })),
          DONE_CHIP,
        ];
      },
      multi: true,
    },
    {
      key: 'method',
      ask: data => `Which teaching method should the lesson plan follow?${
        data.subject === 'mathematics'
          ? ' The Mathematics variant is recommended for this subject.'
          : ' The EOPT / Reading method is recommended for this subject.'
      }`,
      options: async () => [
        { id: 'eopt-reading', label: '📖 EOPT / Reading method' },
        { id: 'maths-eopt', label: '🔢 Mathematics variant' },
      ],
    },
    {
      key: 'week',
      ask: () => 'Which week of the term should this be taught? (1–16)',
      freeText: true,
      validate: (text) => /^\d{1,2}$/.test(text.trim()) && Number(text.trim()) >= 1 && Number(text.trim()) <= 16,
      invalid: 'Please enter a week number between 1 and 16.',
    },
  ],
  async execute(ctx, data) {
    const { subjects, curriculumMap } = await loadCurriculum();
    const subjectLabel = subjects.find(s => s.id === data.subject)?.label ?? data.subject;
    const strands = (curriculumMap[data.subject] ?? {})[data.class] ?? [];
    const strand = strands.find(s => s.id === data.strand);
    const ss = strand?.subStrands?.find(s => s.id === data.subStrand);
    const cs = ss?.contentStandards?.find(c => c.id === data.contentStandard);
    const indicators = (cs?.indicators ?? []).filter(i => data.indicators.includes(i.id));

    // 1. Term (create if this flow started from "__new")
    let termId = data.term && data.term !== '__new' ? data.term : null;
    if (!termId) {
      termId = await ctx.planner.createTerm({
        name: data.termName,
        year: '2026/2027',
        termNumber: Number(data.termNumber),
        startDate: '',
        endDate: '',
      });
    }

    // 2. Class group, subject, week plan, topic — the same pipeline the
    //    planner pages use, so the result opens in PlannerLesson unchanged.
    const cgId = await ctx.planner.addClassGroup(termId, data.class);
    const subId = await ctx.planner.addSubject(cgId, subjectLabel, data.subject, data.class, termId);
    const weekNumber = Number(data.week);
    // Firestore ignores planId (week number is the path); Dexie needs it to
    // link the topic to its plan — so always use the returned id.
    const planId = await ctx.planner.upsertWeekPlan(subId, weekNumber, {
      weekType: 'teaching',
      status: 'planned',
    }, termId, cgId, null);
    const topicId = await ctx.planner.addWeekTopic(planId, {
      curriculumSubjectId: data.subject,
      curriculumClassId: data.class,
      strandId: data.strand,
      subStrandId: data.subStrand,
      contentStandardId: data.contentStandard,
      indicatorIds: JSON.stringify(data.indicators),
      notes: `${cs?.code ?? ''} — Week ${weekNumber}`.trim(),
      resources: '',
    }, termId, cgId, subId, weekNumber);

    const planUrl = `/planner/${termId}/${subId}/${topicId}`;

    // Stash the execution results on the flow data so the confirm step
    // ("Generate the full lesson note") can use them.
    Object.assign(data, {
      topicId, termId, subId, weekNumber, planUrl,
      lessonParams: {
        level: data.class,
        subject: subjectLabel,
        strand: strand?.title ?? '',
        subStrand: ss ? `${ss.code} ${ss.title}` : '',
        contentStandard: cs ? `${cs.code} — ${cs.description}` : '',
        indicator: indicators.map(i => `${i.code} — ${i.description}`).join('; '),
      },
    });

    return {
      reply: `Lesson plan slot created ✅\n\n**${subjectLabel} · ${data.class} · Week ${weekNumber}**\nContent standard ${cs?.code ?? ''}: ${cs?.description ?? ''}\nIndicators: ${indicators.map(i => i.code).join(', ')}\n\nOpen it to write or AI-generate the full lesson note, or let me draft the note now.`,
      links: [{ label: 'Open Lesson Plan →', to: planUrl }],
      chips: [{ id: 'genNote', label: '✨ Generate the full lesson note now' }],
      stage: 'confirm',
    };
  },
  async confirm(ctx, flow, chipId) {
    if (chipId === 'genNote') {
      const { lessonParams, topicId, termId, subId, weekNumber } = flow.data;
      let noteFields;

      if (flow.data.method) {
        const method = getMethod(flow.data.method);
        const text = await generateMethodLessonPlan({
          ...lessonParams,
          subjectId: flow.data.subject,
          classId: flow.data.class,
          indicatorCodes: flow.data.indicators,
          method,
        });
        const sections = extractMethodSections(text, method);
        noteFields = { ...methodSectionsToFields(sections), methodId: method.id, sections };
      } else {
        const plan = await generateLessonPlan(lessonParams);
        const sections = extractLessonPlanSections(plan);
        noteFields = {
          starter: sections.starter,
          mainLearning: sections.mainLearning,
          plenary: sections.plenary,
          evaluation: sections.evaluation,
          homework: sections.homework,
          methodId: null,
          sections: [],
        };
      }

      await ctx.planner.upsertLessonNote(topicId, {
        day: '',
        date: '',
        weekNumber,
        resourceType: null,
        status: 'draft',
        ...noteFields,
        resourceUrl: noteFields.resourceUrl ?? '',
      }, null);
      return {
        reply: 'Full lesson note generated with the teaching method and saved ✅',
        links: [{ label: 'Open Lesson Plan →', to: `/planner/${termId}/${subId}/${topicId}` }],
        stage: null,
      };
    }
    return { reply: 'Lesson plan slot is ready — open it from the link above anytime.', stage: null };
  },
};

// ── Registry ───────────────────────────────────────────────────────────────────

export const FLOWS = {
  timetable: timetableFlow,
  lessonplan: lessonPlanFlow,
};
