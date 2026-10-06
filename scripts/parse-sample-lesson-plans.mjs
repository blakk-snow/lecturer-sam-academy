/**
 * parse-sample-lesson-plans.mjs
 *
 * Parses src/data/lesson-plans/Week_5_Lesson_Notes_Basic_7_and_8.md into
 * structured sample lesson plans (src/data/sampleLessonPlans.js), mapping each
 * note's phases onto the lessonNote fields the planner uses.
 *
 * Run: node scripts/parse-sample-lesson-plans.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE = path.join(ROOT, 'src', 'data', 'lesson-plans', 'Week_5_Lesson_Notes_Basic_7_and_8.md');
const OUTPUT = path.join(ROOT, 'src', 'data', 'sampleLessonPlans.js');

const SUBJECT_IDS = {
  mathematics: 'mathematics',
  'integrated science': 'science',
  science: 'science',
};

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Extract the body of the `### Section` starting at line `start`. */
function sectionBody(lines, start) {
  const out = [];
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (/^###\s/.test(line)) break;
    if (/^####\s/.test(line)) break;
    out.push(line);
  }
  return out.join('\n').trim();
}

/** Extract a `#### Phase n — Name` block until the next #### or ### heading. */
function phaseBody(lines, start) {
  const out = [];
  for (let i = start; i < lines.length; i++) {
    if (i !== start && (/^(###|####)\s/.test(lines[i]))) break;
    out.push(lines[i]);
  }
  return out.join('\n').trim();
}

function parseIndicators(text) {
  const indicators = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*[-*]\s*\*\*([B][789][^:*]*):\*\*\s*(.*)$/);
    if (m) indicators.push({ code: m[1].trim(), description: m[2].trim() });
  }
  return indicators;
}

function parsePlans() {
  const lines = fs.readFileSync(SOURCE, 'utf8').split('\n');
  const plans = [];
  let current = null;

  const flush = () => {
    if (current) plans.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const planMatch = line.match(/^##\s+\d+\.\s+(.+)$/);
    if (planMatch) {
      flush();
      current = { title: planMatch[1].trim(), week: null, classId: null, subjectId: null };
      continue;
    }

    if (!current) continue;

    // "## Source Alignment Note" is not a numbered plan — it starts with "##"
    // but without the "N. " pattern, so current is already flushed. Skip notes.
    const metaMatch = line.match(/^\*\*([^:]+):\*\*\s*(.*)$/);
    if (metaMatch) {
      const key = metaMatch[1].trim().toLowerCase();
      const value = metaMatch[2].trim();
      if (key === 'subject') current.subjectId = SUBJECT_IDS[value.toLowerCase()] ?? slugify(value);
      if (key === 'class') current.classId = value.replace(/^basic\s*/i, 'B');
      if (key === 'week') current.week = Number(value);
      if (key === 'term') current.term = value;
      if (key === 'strand') current.strand = value;
      if (key === 'sub-strand') current.subStrand = value;
      if (key === 'content standard') current.contentStandard = value;
      continue;
    }

    if (/^###\s+Indicators/i.test(line)) {
      current.indicators = parseIndicators(sectionBody(lines, i + 1));
    } else if (/^###\s+Resources/i.test(line)) {
      current.resources = sectionBody(lines, i + 1);
    } else if (/^###\s+Core Competencies/i.test(line)) {
      current.coreCompetencies = sectionBody(lines, i + 1);
    } else if (/^###\s+Key Vocabulary/i.test(line)) {
      current.keyVocabulary = sectionBody(lines, i + 1);
    } else if (/^###\s+Learning Objectives/i.test(line)) {
      current.learningObjectives = sectionBody(lines, i + 1);
    } else if (/^###\s+Lesson Development/i.test(line)) {
      current.starter = '';
      current.mainLearning = '';
      current.plenary = '';
      current.lessonDevelopmentIndex = i + 1;
    } else if (/^####\s+Phase 1/i.test(line)) {
      current.starter = phaseBody(lines, i);
    } else if (/^####\s+Phase 2/i.test(line)) {
      current.mainLearning = phaseBody(lines, i);
    } else if (/^####\s+Phase 3/i.test(line)) {
      current.plenary = phaseBody(lines, i);
    } else if (/^###\s+Evaluation/i.test(line)) {
      current.evaluation = sectionBody(lines, i + 1);
    } else if (/^###\s+Homework/i.test(line)) {
      current.homework = sectionBody(lines, i + 1);
    }
  }
  flush();

  return plans.map((p, i) => ({
    id: `sample-week5-${slugify(p.title)}`,
    title: p.title,
    subjectId: p.subjectId,
    classId: p.classId,
    week: p.week,
    term: p.term ?? 'First Term',
    strand: p.strand ?? '',
    subStrand: p.subStrand ?? '',
    contentStandard: p.contentStandard ?? '',
    indicators: p.indicators ?? [],
    resources: p.resources ?? '',
    coreCompetencies: p.coreCompetencies ?? '',
    keyVocabulary: p.keyVocabulary ?? '',
    learningObjectives: p.learningObjectives ?? '',
    starter: p.starter ?? '',
    mainLearning: p.mainLearning ?? '',
    plenary: p.plenary ?? '',
    evaluation: p.evaluation ?? '',
    homework: p.homework ?? '',
  }));
}

const plans = parsePlans();
if (plans.length === 0) {
  console.error('No lesson plans parsed — aborting.');
  process.exit(1);
}

const output = `// AUTO-GENERATED by scripts/parse-sample-lesson-plans.mjs
// Do not edit directly — re-run the script to regenerate.
// Source: src/data/lesson-plans/Week_5_Lesson_Notes_Basic_7_and_8.md

export const sampleLessonPlans = ${JSON.stringify(plans, null, 2)};

/** Find sample plans matching a planner subject (curriculumSubjectId + class id). */
export function findSamplePlans(subjectId, classId) {
  return sampleLessonPlans.filter(p =>
    (!subjectId || p.subjectId === subjectId) &&
    (!classId || p.classId === classId),
  );
}
`;

fs.writeFileSync(OUTPUT, output, 'utf8');
console.log(`✓ Parsed ${plans.length} sample lesson plans → ${OUTPUT}`);
for (const p of plans) {
  console.log(`  • ${p.title} — ${p.indicators.length} indicators, phases: ${[p.starter, p.mainLearning, p.plenary].filter(Boolean).length}/3`);
}
