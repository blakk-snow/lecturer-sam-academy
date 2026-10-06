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
 * @returns {Promise<string>} The assistant's text response
 */
async function chat(messages) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages }),
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
