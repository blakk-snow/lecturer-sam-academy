/**
 * parse-question-bank.mjs
 *
 * Parses the BECE-style science mock papers in
 * src/data/courses-data/complete-science-questions/ into a structured
 * question bank: per (subject, class) generated module + a lazy-load index.
 *
 * Each paper → { id, fileName, title, classLevel, mcqs[], theory[], markingScheme }
 *   mcq:   { number, question, options: [{ key, text }], answer }
 *   theory: { number, marks, text }
 *
 * Run:  node scripts/parse-question-bank.mjs          (write)
 *       node scripts/parse-question-bank.mjs --check  (report only)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_DIR = path.join(ROOT, 'src', 'data', 'courses-data', 'complete-science-questions');
const OUTPUT_DIR = path.join(ROOT, 'src', 'data', 'questionBank');
const CHECK_ONLY = process.argv.includes('--check');

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(name) {
  return name.toLowerCase()
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function detectClass(fileName, text) {
  const m = (fileName + ' ' + (text ?? '')).match(/basic[\s_-]*([789])/i);
  return m ? `Basic ${m[1]}` : null;
}

function between(lines, startRe, endRe) {
  const blocks = [];
  let current = null;
  for (const line of lines) {
    if (startRe.test(line)) { current = []; continue; }
    if (current !== null && endRe.test(line)) { blocks.push(current.join('\n').trim()); current = null; }
    if (current !== null && current.length >= 0) current.push(line);
  }
  if (current !== null) blocks.push(current.join('\n').trim());
  return blocks;
}

/** Split section A into MCQ objects. */
function parseMcqs(sectionText) {
  const lines = sectionText.split('\n');
  const mcqs = [];
  let current = null;
  let optionCount = 0;

  const flush = () => {
    if (current && current.options.length === 4) mcqs.push(current);
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const qMatch = line.match(/^\*\*(\d+)\.\*\*\s*(.*)$/);
    if (qMatch) {
      flush();
      current = { number: Number(qMatch[1]), question: qMatch[2].trim(), options: [], answer: null };
      optionCount = 0;
      continue;
    }
    if (!current) continue;

    const optMatch = line.match(/^([A-D])[\.\)]\s+(.*)$/);
    if (optMatch && optionCount < 4) {
      current.options.push({ key: optMatch[1], text: optMatch[2].trim() });
      optionCount += 1;
      if (optionCount === 4) {
        // stop accumulating; next numbered item flushes
      }
      continue;
    }

    // Continuation text (multi-line question stem or option continuation)
    if (line.trim() && !/^#/.test(line) && optionCount < 4) {
      if (current.options.length > 0) {
        current.options[current.options.length - 1].text += ' ' + line.trim();
      } else {
        current.question += ' ' + line.trim();
      }
    }
  }
  flush();
  return mcqs;
}

/** Split section B into theory question objects. */
function parseTheory(sectionText) {
  const blocks = sectionText.split(/\n(?=###\s+Question\s)/);
  const theory = [];
  for (const block of blocks) {
    const head = block.split('\n')[0] ?? '';
    const m = head.match(/^###\s+Question\s+(\d+)\s*\[?([0-9]+)\s*marks?\]?/i);
    if (!m) continue;
    const text = block.slice(head.length).trim()
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')   // drop broken figure links
      .trim();
    theory.push({ number: Number(m[1]), marks: Number(m[2]) || null, text });
  }
  return theory;
}

/** Parse the answer-key markdown table into { questionNumber: letter }. */
function parseAnswerKey(sectionText) {
  const answers = {};
  for (const line of sectionText.split('\n')) {
    const m = line.match(/^\|\s*(\d+)\s*\|\s*([A-D])\s*\|/);
    if (m) answers[Number(m[1])] = m[2];
  }
  return answers;
}

function parsePaper(filePath) {
  const fileName = path.basename(filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');

  const title = (raw.match(/^#\s+(.+)$/m) ?? [])[1]?.trim() ?? fileName;

  const sectionA = between(lines, /^##\s*SECTION\s*A/i, /^##\s*SECTION\s*B/i)[0] ?? '';
  const sectionB = between(lines, /^##\s*SECTION\s*B/i, /^##\s*ANSWER\s*KEY/i)[0] ?? '';
  const answerKeyText = between(lines, /^##\s*ANSWER\s*KEY/i, /^##\s*MARKING/i)[0] ?? '';
  const markingScheme = between(lines, /^##\s*MARKING/i, /^##\s*CURRICULUM/i)[0] ?? '';

  const mcqs = parseMcqs(sectionA);
  const answers = parseAnswerKey(answerKeyText);
  for (const mcq of mcqs) mcq.answer = answers[mcq.number] ?? null;

  const theory = parseTheory(sectionB);
  const classLevel = detectClass(fileName, raw);

  return {
    id: slugify(fileName),
    fileName,
    title,
    subject: 'Integrated Science',
    classLevel,
    mcqCount: mcqs.length,
    theoryCount: theory.length,
    mcqs,
    theory,
    markingScheme: markingScheme.slice(0, 4000),
  };
}

// ── Main ───────────────────────────────────────────────────────────────────────

const files = fs.readdirSync(SOURCE_DIR)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(SOURCE_DIR, f))
  .sort();

const papers = files.map(parsePaper);

// Group by class
const groups = new Map(); // classId -> papers[]
for (const paper of papers) {
  if (!paper.classLevel) {
    console.warn(`⚠ ${paper.fileName}: could not detect class level`);
    continue;
  }
  const key = paper.classLevel.replace(/^Basic\s*/i, 'B');
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(paper);
}

let issues = 0;
for (const paper of papers) {
  const missing = paper.mcqs.filter(q => !q.answer);
  const badOptions = paper.mcqs.filter(q => q.options.length !== 4);
  if (missing.length || badOptions.length || paper.mcqs.length < 30) {
    issues += 1;
    console.warn(`⚠ ${paper.fileName}: mcqs=${paper.mcqs.length} missingAnswers=${missing.length} badOptions=${badOptions.length}`);
  }
}

console.log(`Parsed ${papers.length} papers → ${groups.size} class groups`);
for (const [cls, list] of [...groups.entries()].sort()) {
  const mcqs = list.reduce((n, p) => n + p.mcqs.length, 0);
  console.log(`  ${cls}: ${list.length} papers, ${mcqs} MCQs, ${list.reduce((n, p) => n + p.theory.length, 0)} theory questions`);
}

if (CHECK_ONLY) {
  console.log(issues === 0 ? '\n✓ No issues found' : `\n⚠ ${issues} papers have issues (see above)`);
  process.exit(issues === 0 ? 0 : 1);
}

// ── Write generated modules ────────────────────────────────────────────────────

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(path.join(OUTPUT_DIR, 'science'))) fs.mkdirSync(path.join(OUTPUT_DIR, 'science'));

const manifest = [];
for (const [classId, list] of [...groups.entries()].sort()) {
  const file = path.join(OUTPUT_DIR, 'science', classId.toLowerCase() + '.js');
  const header = `// AUTO-GENERATED by scripts/parse-question-bank.mjs
// Do not edit directly — re-run the script to regenerate.

export const papers = ${JSON.stringify(list, null, 2)};
`;
  fs.writeFileSync(file, header, 'utf8');
  manifest.push({
    subjectId: 'science',
    classId,
    label: `Basic ${classId.slice(1)}`,
    paperCount: list.length,
    loader: `() => import('./science/${classId.toLowerCase()}.js')`,
  });
}

const indexJs = `// AUTO-GENERATED by scripts/parse-question-bank.mjs
// Do not edit directly — re-run the script to regenerate.

export const bankManifest = [
${manifest.map(m => `  { subjectId: '${m.subjectId}', classId: '${m.classId}', label: '${m.label}', paperCount: ${m.paperCount}, loader: ${m.loader} },`).join('\n')}
];

// Lightweight title index (no question content) for search and chat grounding.
export const bankIndex = [
${manifest.map(m => `  { subjectId: '${m.subjectId}', classId: '${m.classId}', label: '${m.label}', papers: ${JSON.stringify(groups.get(m.classId).map(p => ({ id: p.id, title: p.title })))} },`).join('\n')}
];

/** Dynamically load the papers for a subject + class (keeps the big bundles out of the main chunk). */
export async function loadPapers(subjectId, classId) {
  const entry = bankManifest.find(m => m.subjectId === subjectId && m.classId === classId);
  if (!entry) return [];
  const mod = await entry.loader();
  return mod.papers;
}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.js'), indexJs, 'utf8');
console.log(`\n✓ Written ${manifest.length} class modules + index → ${OUTPUT_DIR}`);
