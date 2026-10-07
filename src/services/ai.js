/**
 * ai.js — Client-side AI service for Lecturer Sam Academy
 *
 * All functions POST to /api/generate (proxied to OpenRouter in dev,
 * or a serverless function in production). The API key never touches
 * the browser.
 */

import { getTomorrowSchedule } from '../data/ai/teacherSchedule';

const MODEL = 'openai/gpt-4o-mini';

// ── Low-level fetch helper ────────────────────────────────────────────────────

/**
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [extra] - extra OpenRouter params (plugins, response_format, …)
 * @returns {Promise<string>} The assistant's text response
 */
async function chat(messages, extra = {}) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, ...extra }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // OpenRouter errors: { error: { message, code } } or { error: "string" }
    const errObj = err.error;
    const detail = typeof errObj === 'string'
      ? errObj
      : errObj?.message ?? JSON.stringify(errObj) ?? `AI request failed (${res.status})`;
    throw new Error(`${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    // Surface the full response so we can debug unexpected shapes
    throw new Error(`Unexpected response shape: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return text;
}

// ── Shared context builder ────────────────────────────────────────────────────

function buildCurriculumContext({ level, subject, strand, subStrand, contentStandard, indicator }) {
  const parts = [];
  if (level)           parts.push(`Class: ${level}`);
  if (subject)         parts.push(`Subject: ${subject}`);
  if (strand)          parts.push(`Strand: ${strand}`);
  if (subStrand)       parts.push(`Sub-strand: ${subStrand}`);
  if (contentStandard) parts.push(`Content Standard: ${contentStandard}`);
  if (indicator)       parts.push(`Indicator: ${indicator}`);
  return parts.join('\n');
}

const SYSTEM_TEACHER = `You are an experienced Ghanaian JHS teacher and curriculum specialist. 
You always align your responses to the NaCCA Common Core Programme curriculum. 
Keep language clear and practical for Ghanaian classroom contexts. 
Use examples that are relevant to Ghanaian students' daily lives and environment.`;

// ── Exported functions ────────────────────────────────────────────────────────

/**
 * Generate a full structured lesson plan for a given curriculum indicator.
 *
 * @param {object} params
 * @param {string} params.level - e.g. "Basic 7"
 * @param {string} params.subject - e.g. "Integrated Science"
 * @param {string} params.strand - strand title
 * @param {string} params.subStrand - sub-strand title
 * @param {string} params.contentStandard - content standard code + description
 * @param {string} params.indicator - indicator code + description
 * @param {number} [params.duration=60] - lesson duration in minutes
 * @returns {Promise<string>}
 */
export async function generateLessonPlan({ level, subject, strand, subStrand, contentStandard, indicator, duration = 60 }) {
  const context = buildCurriculumContext({ level, subject, strand, subStrand, contentStandard, indicator });
  return chat([
    { role: 'system', content: SYSTEM_TEACHER },
    {
      role: 'user',
      content: `Create a ${duration}-minute lesson plan for the following NaCCA curriculum indicator.

${context}

Structure your response with these clearly labelled sections:
**STARTER ACTIVITY** (5–10 min): An engaging hook or prior knowledge activator.
**MAIN LEARNING** (30–35 min): Step-by-step teaching approach, key explanations, student activities, and questions.
**PLENARY** (5–10 min): How to consolidate and check understanding.
**KEY QUESTIONS**: 3–5 questions to probe understanding during the lesson.
**SUGGESTED RESOURCES**: Practical, low-cost materials available in Ghanaian schools.
**HOMEWORK**: A meaningful take-home task linked to the indicator.

Keep the plan practical and relevant to Ghanaian classroom conditions.`,
    },
  ]);
}

/**
 * Generate classroom activities for a curriculum indicator.
 */
export async function generateActivities({ level, subject, strand, subStrand, contentStandard, indicator }) {
  const context = buildCurriculumContext({ level, subject, strand, subStrand, contentStandard, indicator });
  return chat([
    { role: 'system', content: SYSTEM_TEACHER },
    {
      role: 'user',
      content: `Generate 3–5 varied classroom activities for the following NaCCA curriculum indicator.

${context}

For each activity provide:
- **Activity name**
- **Duration** (approximate)
- **What students do**
- **What the teacher does**
- **Materials needed** (low-cost, available in Ghana)

Include a mix of individual, pair, and group activities. Make them practical and suitable for Ghanaian JHS classrooms.`,
    },
  ]);
}

/**
 * Generate a formative assessment for a curriculum indicator.
 */
export async function generateAssessment({ level, subject, strand, subStrand, contentStandard, indicator }) {
  const context = buildCurriculumContext({ level, subject, strand, subStrand, contentStandard, indicator });
  return chat([
    { role: 'system', content: SYSTEM_TEACHER },
    {
      role: 'user',
      content: `Create a short formative assessment for the following NaCCA curriculum indicator.

${context}

Include:
1. **5 multiple-choice questions** (with 4 options each, mark the correct answer)
2. **2 short-answer questions**
3. **1 problem-solving or application question**

Questions should be clearly worded and appropriate for Ghanaian JHS students. Answers/marking guide at the end.`,
    },
  ]);
}

/**
 * Explain a curriculum indicator in plain language for a teacher.
 */
export async function explainIndicator({ level, subject, strand, subStrand, contentStandard, indicator }) {
  const context = buildCurriculumContext({ level, subject, strand, subStrand, contentStandard, indicator });
  return chat([
    { role: 'system', content: SYSTEM_TEACHER },
    {
      role: 'user',
      content: `Explain the following NaCCA curriculum indicator clearly for a teacher preparing to teach it.

${context}

Provide:
1. **What this indicator means** — plain language explanation of the concept.
2. **Why it matters** — why this is important for students to learn.
3. **Common misconceptions** — mistakes students typically make.
4. **Key vocabulary** — important terms with brief definitions.
5. **Real-world connections** — 2–3 examples relevant to Ghanaian students' everyday lives.`,
    },
  ]);
}

/**
 * Resolve a teacher's "what am I teaching tomorrow?" question using the scheme
 * and a lightweight in-app timetable template. This follows the planning rule in
 * src/data/ai/README.txt while keeping the app usable without a real timetable file.
 */
function resolveTomorrowTeachingQuestion(text, scheduleData, scheduleSource) {
  const normalized = (text ?? '').toLowerCase();
  const mentionsTomorrow = /(what am i teaching tomorrow|teaching tomorrow|tomorrow.*teach|what.*tomorrow)/i.test(normalized);
  if (!mentionsTomorrow) return null;

  const classMatch = /(basic\s*[789]|b[789])/.exec(text || '');
  const classLevel = classMatch ? `Basic ${classMatch[0].match(/[789]/)?.[0] ?? '7'}` : 'Basic 7';
  const schedule = getTomorrowSchedule(classLevel, new Date(), scheduleData);
  const schemeLabel = schedule.scheme
    ? `Term ${schedule.scheme.term}, Week ${schedule.scheme.week}`
    : `Term ${schedule.term}, Week ${schedule.week}`;

  if (!schedule.lessons.length) {
    return `Tomorrow (${schedule.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}) is ${schedule.dayName}, but there is no timetable entry for ${classLevel}. The saved sample scheme covers ${schemeLabel}.`;
  }

  const lessonNames = schedule.lessons.map(item => `${item.subject} (Period ${item.period})`).join('; ');
  const schemeInfo = schedule.scheme?.lessons ? Object.entries(schedule.scheme.lessons)
    .filter(([subject]) => schedule.lessons.some(item => item.subject === subject))
    .map(([subject, detail]) => `${subject}: ${detail.strand} → ${detail.subStrand} (${detail.indicators.join(', ')})`)
    .join('; ') : 'No scheme information loaded.';

  const sourceLabel = scheduleSource === 'cloud'
    ? 'your saved schedule'
    : scheduleSource === 'offline' || scheduleSource === 'local'
      ? 'your locally cached sample schedule'
      : 'the bundled sample schedule';
  return `Tomorrow is ${schedule.date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}. For ${classLevel}, ${sourceLabel} shows: ${lessonNames}.\n\nThe scheme-of-learning loaded is ${schemeLabel}. Relevant topics are: ${schemeInfo}.`;
}

/**
 * General-purpose curriculum assistant chat.
 * Maintains conversation history.
 *
 * @param {Array<{role: string, content: string}>} history - Full message history
 * @returns {Promise<string>}
 */
export async function curriculumChat(history, { persona = 'teacher', classLevel = 'Basic 7', scheduleData, scheduleSource } = {}) {
  const latestUserText = [...(history ?? [])].reverse().find(msg => msg.role === 'user')?.content ?? '';
  const tomorrowAnswer = persona === 'teacher'
    ? resolveTomorrowTeachingQuestion(latestUserText, scheduleData, scheduleSource)
    : null;
  if (tomorrowAnswer) {
    return tomorrowAnswer;
  }

  const systemPrompt = persona === 'student'
    ? `You are a patient Ghanaian JHS learning tutor helping a ${classLevel} student.
Use simple, age-appropriate language and examples from everyday life in Ghana.
Break difficult ideas into small steps, ask one guiding question at a time, and encourage the learner to try before revealing a full solution.
Never shame the learner. If the question is outside the NaCCA JHS curriculum, say so clearly and still offer a helpful, safe explanation.
Format responses clearly and keep them focused on the learner's question.`
    : `You are a curriculum assistant for Ghanaian JHS teachers using the NaCCA Common Core Programme.
Help teachers understand curriculum requirements, plan lessons, generate activities, explain concepts,
and create assessments. Keep responses practical and relevant to Ghanaian classroom contexts.
When discussing specific curriculum codes (like B7.1.1.1.1), explain what they mean in full.
Format your responses clearly with headings where appropriate.
If asked about tomorrow's teaching, check the timetable and the scheme of learning, then answer using the date, class, and week context.`;

  return chat([
    {
      role: 'system',
      content: systemPrompt,
    },
    ...(history ?? []),
  ]);
}

// ── Streaming ─────────────────────────────────────────────────────────────────

/**
 * Stream a chat completion from OpenRouter (SSE pass-through via /api/generate).
 *
 * @param {object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {object} [opts.extra] - extra OpenRouter params (plugins, …)
 * @param {(delta: string) => void} [opts.onToken] - called per text delta
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{ text: string, sources: Array<{url: string, title: string}> }>}
 */
export async function chatStream({ messages, extra = {}, onToken, signal }) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: true, ...extra }),
    signal,
  });

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({}));
    const errObj = err.error;
    const detail = typeof errObj === 'string'
      ? errObj
      : errObj?.message ?? JSON.stringify(errObj) ?? `AI request failed (${res.status})`;
    throw new Error(`${res.status}: ${detail}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';
  const sources = [];
  const seenUrls = new Set();

  const collectCitations = (message) => {
    const annotations = message?.annotations ?? message?.citations ?? [];
    for (const ann of annotations) {
      const cite = ann?.url_citation ?? ann;
      const url = cite?.url;
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        sources.push({ url, title: cite?.title ?? url });
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      let parsed;
      try { parsed = JSON.parse(data); } catch { continue; }
      const choice = parsed.choices?.[0];
      const delta = choice?.delta?.content ?? '';
      if (delta) { text += delta; onToken?.(delta); }
      if (choice?.message) collectCitations(choice.message);
    }
  }

  return { text, sources };
}

// ── Persona prompts ───────────────────────────────────────────────────────────

const TEACHER_SYSTEM = `You are a curriculum assistant for Ghanaian JHS teachers using the NaCCA Common Core Programme.
Help teachers understand curriculum requirements, plan lessons, generate activities, explain concepts,
and create assessments. Keep responses practical and relevant to Ghanaian classroom contexts.
When discussing specific curriculum codes (like B7.1.1.1.1), explain what they mean in full.
Format your responses clearly with headings where appropriate.
If asked about tomorrow's teaching, check the timetable and the scheme of learning, then answer using the date, class, and week context.`;

const STUDENT_SYSTEM = (classLevel) => `You are a patient Ghanaian JHS learning tutor helping a ${classLevel} student.
Use simple, age-appropriate language and examples from everyday life in Ghana.
Break difficult ideas into small steps, ask one guiding question at a time, and encourage the learner to try before revealing a full solution.
Never shame the learner. If the question is outside the NaCCA JHS curriculum, say so clearly and still offer a helpful, safe explanation.
Format responses clearly and keep them focused on the learner's question.`;

const RESEARCH_SYSTEM = `You are a research assistant for Ghanaian JHS teachers using the NaCCA Common Core Programme.
The user wants authoritative information about curriculum content standards and indicators.
You have web search results available. Use them: base your answer on the search results, and cite sources with URLs where they back a claim.
If the search results contradict what you know, trust the search results.
Structure your answer clearly: summary, key details, and sources at the end.
Keep language practical for a Ghanaian classroom.`;

// Curated educational domains for the research mode's web search.
const RESEARCH_DOMAINS = [
  'nacca.gov.gh',
  'mgb.gov.gh',
  'ghanaeducation.org',
  'khanacademy.org',
  'bbc.co.uk',
  'openstax.org',
  'geeksforgeeks.org',
  'byjus.com',
  'wikipedia.org',
  'edu.gov.gh',
];

/**
 * Streaming curriculum chat with local curriculum grounding.
 * Indicator codes found in the latest message are looked up in the embedded
 * curriculum tree and injected into the system prompt.
 */
export async function curriculumChatStream(history, {
  persona = 'teacher',
  classLevel = 'Basic 7',
  scheduleData,
  scheduleSource,
  onToken,
  signal,
} = {}) {
  const latestUserText = [...(history ?? [])].reverse().find(msg => msg.role === 'user')?.content ?? '';
  const tomorrowAnswer = persona === 'teacher'
    ? resolveTomorrowTeachingQuestion(latestUserText, scheduleData, scheduleSource)
    : null;
  if (tomorrowAnswer) {
    onToken?.(tomorrowAnswer);
    return { text: tomorrowAnswer, sources: [] };
  }

  const { findCurriculumEntries, formatEntriesContext, findLocalResources, formatLocalContext } =
    await import('./curriculumSearch');
  const entries = await findCurriculumEntries(latestUserText);
  const local = await findLocalResources(latestUserText);
  const grounding = [
    formatEntriesContext(entries),
    formatLocalContext(local),
  ].filter(Boolean).join('\n\n');

  const systemPrompt = persona === 'student'
    ? STUDENT_SYSTEM(classLevel)
    : TEACHER_SYSTEM;

  return chatStream({
    messages: [
      { role: 'system', content: grounding ? `${systemPrompt}\n\n${grounding}` : systemPrompt },
      ...(history ?? []),
    ],
    onToken,
    signal,
  });
}

/**
 * Streaming research chat with OpenRouter web search.
 * Returns source citations alongside the text.
 */
export async function researchChatStream(history, { onToken, signal } = {}) {
  const latestUserText = [...(history ?? [])].reverse().find(msg => msg.role === 'user')?.content ?? '';
  const { findCurriculumEntries, formatEntriesContext, findLocalResources, formatLocalContext } =
    await import('./curriculumSearch');
  const entries = await findCurriculumEntries(latestUserText);
  const local = await findLocalResources(latestUserText);
  const grounding = [
    formatEntriesContext(entries),
    formatLocalContext(local),
  ].filter(Boolean).join('\n\n');

  const systemPrompt = grounding
    ? `${RESEARCH_SYSTEM}\n\n${grounding}`
    : RESEARCH_SYSTEM;

  return chatStream({
    messages: [
      { role: 'system', content: systemPrompt },
      ...(history ?? []),
    ],
    extra: {
      plugins: [{
        id: 'web',
        include_domains: RESEARCH_DOMAINS,
        max_results: 5,
      }],
    },
    onToken,
    signal,
  });
}

// ── Structured generation ─────────────────────────────────────────────────────

/** Extract a JSON object from a model response that may contain markdown fences. */
export function parseJsonObject(text) {
  const cleaned = (text ?? '').replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) {
    throw new Error('The model did not return a JSON object.');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

/**
 * Generate a weekly timetable as structured JSON:
 * { "<Class>": { "Monday": [{ subject, period }], … }, … }
 */
export async function generateTimetable({ classLevels, subjects, periodsPerDay }) {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const text = await chat([
    { role: 'system', content: 'You generate school timetables as strict JSON. Output ONLY the JSON object, no markdown, no commentary.' },
    {
      role: 'user',
      content: `Create a weekly school timetable JSON for a Ghanaian JHS.

Classes: ${classLevels.join(', ')}
Subjects: ${subjects.join(', ')}
Periods per day: ${periodsPerDay}
Days: ${dayNames.join(', ')}

Return a JSON object keyed by class name (exactly ${classLevels.map(c => `"${c}"`).join(', ')}). Each class maps to an object keyed by day name (${dayNames.map(d => `"${d}"`).join(', ')}). Each day is an array of ${periodsPerDay} objects: { "subject": "<subject name>", "period": <1..${periodsPerDay}> }, covering every period exactly once.
Distribute subjects evenly across the week, avoid the same subject in consecutive periods where possible, and give Mathematics and English more frequent slots than others.`,
    },
  ], { response_format: { type: 'json_object' } });

  const parsed = parseJsonObject(text);
  for (const classLevel of classLevels) {
    if (!parsed[classLevel]) throw new Error('Timetable JSON is missing a class.');
  }
  return parsed;
}

/**
 * Split a generated full lesson plan into the fields the lesson note stores.
 * Returns { starter, mainLearning, plenary, evaluation, homework }.
 */
export function extractLessonPlanSections(text) {
  const aliases = {
    starter:      ['STARTER ACTIVITY', 'STARTER'],
    mainLearning: ['MAIN LEARNING', 'MAIN ACTIVITY', 'MAIN TEACHING'],
    plenary:      ['PLENARY'],
    evaluation:   ['EVALUATION', 'ASSESSMENT', 'FORMATIVE ASSESSMENT'],
    homework:     ['HOMEWORK', 'TAKE-HOME', 'HOME ACTIVITY'],
  };
  const result = {};
  for (const [field, keys] of Object.entries(aliases)) {
    let found = null;
    for (const key of keys) {
      const re = new RegExp(`\\*\\*${key}[^*]*\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`, 'i');
      const m = (text ?? '').match(re);
      if (m) { found = m[1].trim(); break; }
    }
    result[field] = found ?? '';
  }
  return result;
}

// ── Teaching-method lesson plans ───────────────────────────────────────────────

const truncateWords = (text, limit) => {
  const words = (text ?? '').split(/\s+/);
  return words.length <= limit ? (text ?? '') : words.slice(0, limit).join(' ') + ' …';
};

const stripBlockquotes = (text) => (text ?? '')
  .split(/\r?\n/)
  .filter(line => !line.startsWith('>'))
  .join('\n')
  .trim();

/**
 * Build grounding material for a lesson plan from the embedded content:
 * the exact curriculum entry text plus the indicator's Course Library notes
 * plus the textbook chapter that teaches the indicator.
 */
async function buildGroundedSource({ subjectId, classId, codes }) {
  const parts = [];
  const normalized = (code) => (code ?? '').replace(/\/JHS\d+/g, '').toUpperCase();

  try {
    const { loadEntries } = await import('../data/courseLibrary');
    const entries = await loadEntries(subjectId, classId);
    for (const code of codes ?? []) {
      const entry = entries.find(e => normalized(e.code) === normalized(code));
      if (!entry?.notes) continue;
      const objectives = (entry.notes.objectives ?? []).map(o => `- ${o}`).join('\n');
      parts.push(`The app's own lesson notes for ${code}:\n${objectives}\n\n${entry.notes.explanation ?? ''}`);
      break; // one indicator's notes is enough context
    }
  } catch { /* content modules are optional */ }

  try {
    const { chapterRefs, loadBook } = await import('../data/courseLibrary/bookIndex');
    for (const code of codes ?? []) {
      const refs = (chapterRefs[normalized(code)] ?? [])
        .filter(r => r.subjectId === subjectId && r.classId === classId);
      if (!refs.length) continue;
      const book = await loadBook(refs[0].bookId);
      const chapter = book?.chapters?.find(c => c.number === refs[0].chapterNumber);
      if (chapter) {
        parts.push(
          `Excerpt from the textbook chapter that teaches this indicator (` +
          `${refs[0].bookKindLabel}, Chapter ${chapter.number} "${chapter.title}"):\n` +
          truncateWords(stripBlockquotes(chapter.body), 1200),
        );
      }
      break;
    }
  } catch { /* book modules are optional */ }

  return parts.join('\n\n');
}

/**
 * Generate a full lesson plan following one of the teaching-method
 * templates (see src/data/teachingMethods.js), grounded in the embedded
 * curriculum text and content.
 */
export async function generateMethodLessonPlan({
  level, subject, strand, subStrand, contentStandard, indicator,
  subjectId, classId, indicatorCodes = [], method,
}) {
  const steps = method?.steps ?? [];
  const headings = steps.map(s => `**${s.aiHeading}**`).join('\n');

  const context = buildCurriculumContext({ level, subject, strand, subStrand, contentStandard, indicator });
  const source = await buildGroundedSource({ subjectId, classId, codes: indicatorCodes });

  const prompt = `Create a lesson plan for the following NaCCA curriculum indicator.

${context}

${source ? `Use this source material from the app's own content as the basis for the plan:\n\n${source}\n\n` : ''}Follow this teaching method structure exactly, with one section per heading and no other top-level sections:

${headings}

For each step:
- **${steps[0]?.aiHeading}**: concrete questions or terms for the whole class (or a short mental drill for mathematics).
- **${steps[1]?.aiHeading}**: how to correct and give feedback.
- **${steps[2]?.aiHeading}**: 3–5 measurable objectives, phrased "By the end of the lesson, learners will be able to…".
- **${steps[3]?.aiHeading}**: which image, video or diagram to show and what learners should look for.
- **${steps[4]?.aiHeading}**: the reading passage or demonstration, with teacher-led, guided and independent elements where applicable.
- **${steps[5]?.aiHeading}**: discussion questions or a step-by-step demonstration.
- **${steps[6]?.aiHeading}**: a meaningful take-home task.

Keep the plan practical for Ghanaian JHS classroom conditions.`;

  return chat([
    { role: 'system', content: SYSTEM_TEACHER },
    { role: 'user', content: prompt },
  ]);
}

/**
 * Parse a generated method plan back into the method's steps.
 * Returns [{ key, label, content }] with empty strings where a section
 * was not produced.
 */
export function extractMethodSections(text, method) {
  const steps = method?.steps ?? [];
  return steps.map(step => {
    const keys = [step.aiHeading, step.aiHeading.replace(/\s*\/\s*/g, ' OR ')];
    let found = null;
    for (const key of keys) {
      const re = new RegExp(`\\*\\*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^*]*\\*\\*[:\\s]*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`, 'i');
      const m = (text ?? '').match(re);
      if (m) { found = m[1].trim(); break; }
    }
    return { key: step.key, label: step.label, content: found ?? '' };
  });
}
