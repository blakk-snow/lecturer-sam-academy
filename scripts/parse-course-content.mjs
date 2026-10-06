/**
 * parse-course-content.mjs
 *
 * Single pipeline for the course-content landing zone (src/data/courses-data):
 *
 *   1. <subject>/<class>/notes/<indicator-code>.md    → per-indicator lesson notes
 *   2. <subject>/<class>/questions/<indicator-code>.md → structured practice questions
 *   3. any other .md file (e.g. complete-science-questions/) → metadata index only
 *
 * Outputs:
 *   • src/data/courseUploads.js              — metadata index (all files)
 *   • src/data/courseLibrary/<subject>/<classId>.js — content modules
 *   • src/data/courseLibrary/index.js        — lazy-load manifest + loadEntries()
 *
 * Notes convention (frontmatter: title, subject, class optional):
 *   ## Objectives / ## Explanation / ## Worked Example / ## Practice
 *
 * Questions convention:
 *   ### Q1
 *   type: mcq | trueFalse | fillBlank
 *   question: …
 *   - [ ] option a        (mcq: exactly one option marked [x])
 *   - [x] option b
 *   explanation: …
 *   difficulty: easy | medium | hard
 *
 * Run:  node scripts/parse-course-content.mjs          (write)
 *       node scripts/parse-course-content.mjs --check  (validate + write)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { curriculumMap, subjects as curriculumSubjects } from '../src/data/curriculumData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COURSES_DIR = path.join(ROOT, 'src', 'data', 'courses-data');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'courseUploads.js');
const LIBRARY_DIR = path.join(ROOT, 'src', 'data', 'courseLibrary');

const SUBJECT_FOLDER_IDS = Object.fromEntries(curriculumSubjects.map(s => [s.id, s.id]));
// Accept common spellings for the <subject> folder name.
const SUBJECT_FOLDER_ALIASES = {
  mathematics: 'mathematics', maths: 'mathematics', math: 'mathematics',
  science: 'science', 'integrated-science': 'science', integratedscience: 'science',
  english: 'english', 'english-language': 'english',
  'social-studies': 'socialStudies', socialstudies: 'socialStudies',
  computing: 'computing',
  rme: 'rme',
  'career-technology': 'careerTech', careertech: 'careerTech',
  'creative-arts': 'creativeArts', creativearts: 'creativeArts',
  french: 'french',
  'ghanaian-language': 'ghanaianLanguage', ghanaianlanguage: 'ghanaianLanguage',
};

const normalizeCode = (code) => (code ?? '').replace(/\/JHS\d+/g, '').toUpperCase();

// ── Shared helpers ─────────────────────────────────────────────────────────────

function toTitle(value) {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeSubject(raw) {
  const value = raw.toLowerCase();
  if (value.includes('integrated science') || value.includes('science')) return 'Integrated Science';
  if (value.includes('math')) return 'Mathematics';
  if (value.includes('english')) return 'English Language';
  if (value.includes('social')) return 'Social Studies';
  if (value.includes('comput')) return 'Computing';
  if (value.includes('career')) return 'Career Technology';
  if (value.includes('creative')) return 'Creative Arts & Design';
  if (value.includes('french')) return 'French Language';
  if (value.includes('rme') || value.includes('moral')) return 'Religious & Moral Education';
  if (value.includes('language')) return 'Ghanaian Language';
  return toTitle(raw);
}

function detectClass(text) {
  // \b fails after "Basic8_" (underscore is a word char) — match on
  // explicit separators / lookahead instead.
  const match = String(text).match(/Basic[\s_-]*([789])|(?:^|[^A-Za-z0-9])B([789])(?![A-Za-z0-9])/i);
  if (!match) return null;
  return `Basic ${match[1] || match[2]}`;
}

function readFrontmatter(content) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { fields: {}, body: content };
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][\w-]*):\s*(.*?)\s*$/i);
    if (field) fields[field[1].toLowerCase()] = field[2].replace(/^["']|["']$/g, '');
  }
  return { fields, body: content.slice(match[0].length) };
}

function detectTopic(fileName) {
  const withoutExt = fileName.replace(/\.md$/i, '');
  const cleaned = withoutExt
    .replace(/^BECE_Mock_/, '').replace(/^Beacon_/, '')
    .replace(/^Basic[789]_?/i, '').replace(/_Basic[789]/i, '')
    .replace(/^Integrated_?Science_?/i, '').replace(/_Integrated_?Science/i, '')
    .replace(/_Science/i, '').replace(/_Mock_Pack_.+$/i, '')
    .replace(/_20\d{2}(?:_\d{2})?$/i, '').replace(/_/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return cleaned || 'Untitled topic';
}

function extractIndicators(content) {
  const matches = [...content.matchAll(/B[7-9](?:\/JHS\d+)?(?:\.\d+)+/gi)];
  return [...new Set(matches.map(match => match[0]))];
}

function estimateQuestionCount(content) {
  const matches = content.match(/\*\*(?:\d+)\.|\b\d+\.\s+/g) || [];
  const sectionMatches = content.match(/\b(?:Q|Question)\s*\d+/gi) || [];
  return Math.max(matches.length, sectionMatches.length, 0);
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ── Structured content parsers ─────────────────────────────────────────────────

/** Split body into named `## Section` chunks. */
function splitSections(body) {
  const sections = {};
  let current = null;
  for (const line of body.split(/\r?\n/)) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      current = match[1].trim();
      sections[current] = [];
    } else if (current) {
      sections[current].push(line);
    }
  }
  const result = {};
  for (const [name, lines] of Object.entries(sections)) {
    result[name] = lines.join('\n').trim();
  }
  return result;
}

/** Bullet-list lines (objectives, competencies). */
function bulletList(text) {
  return (text ?? '')
    .split(/\r?\n/)
    .map(line => line.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean);
}

function parseNotes(filePath, code) {
  const { fields, body } = readFrontmatter(fs.readFileSync(filePath, 'utf8'));
  const sections = splitSections(body);
  const objectivesKey = Object.keys(sections).find(k => /^objectives?$/i.test(k));
  const explanationKey = Object.keys(sections).find(k => /^explanation$/i.test(k));
  const workedKey = Object.keys(sections).find(k => /^worked\s*examples?$/i.test(k));
  const practiceKey = Object.keys(sections).find(k => /^practice$/i.test(k));

  return {
    code,
    title: fields.title ?? (bulletList(sections[objectivesKey] ?? '')[0] ?? code),
    subjectId: fields.subject ? slugify(fields.subject) : null,
    objectives: bulletList(sections[objectivesKey] ?? ''),
    explanation: sections[explanationKey] ?? '',
    workedExample: sections[workedKey] ?? '',
    practice: sections[practiceKey] ?? '',
    sourceFile: path.relative(ROOT, filePath).replace(/\\/g, '/'),
  };
}

const QUESTION_FIELDS = /^(type|question|explanation|difficulty|answer|accepted)\s*:\s*(.*)$/i;

function parseQuestions(filePath, code) {
  const { fields, body } = readFrontmatter(fs.readFileSync(filePath, 'utf8'));
  const blocks = body.split(/^###\s*Q\s*\d+/gim).slice(1);
  const questions = [];
  const problems = [];

  for (let i = 0; i < blocks.length; i++) {
    const lines = blocks[i].split(/\r?\n/);
    const meta = { type: 'mcq', question: '', explanation: '', difficulty: 'medium', answer: null, accepted: [] };
    const options = [];
    let questionLines = [];

    for (const raw of lines) {
      const line = raw.trimEnd();
      const fieldMatch = line.match(QUESTION_FIELDS);
      if (fieldMatch) {
        const key = fieldMatch[1].toLowerCase();
        if (key === 'type') meta.type = fieldMatch[2].trim();
        else if (key === 'question') { meta.question = fieldMatch[2].trim(); questionLines = []; }
        else if (key === 'explanation') meta.explanation = fieldMatch[2].trim();
        else if (key === 'difficulty') meta.difficulty = fieldMatch[2].trim();
        else if (key === 'answer') meta.answer = fieldMatch[2].trim();
        else if (key === 'accepted') meta.accepted = fieldMatch[2].split(/[,|]/).map(s => s.trim().toLowerCase()).filter(Boolean);
        continue;
      }
      const optionMatch = line.match(/^\s*[-*]\s*\[([ xX])\]\s+(.+)$/);
      if (optionMatch) {
        options.push({ checked: optionMatch[1].toLowerCase() === 'x', text: optionMatch[2].trim() });
        continue;
      }
      if (!meta.question) meta.question = line.trim();
      else questionLines.push(line.trim());
    }
    if (questionLines.length && meta.question) {
      meta.question += ' ' + questionLines.join(' ').trim();
    }

    const num = i + 1;
    const qid = `${slugify(code)}-q${num}`;
    const base = {
      id: qid,
      topicId: code,
      explanation: meta.explanation || undefined,
      difficulty: meta.difficulty || 'medium',
    };

    if (meta.type === 'mcq') {
      const checked = options.filter(o => o.checked);
      if (!meta.question) problems.push(`${filePath}: Q${num} is missing a question line`);
      if (options.length < 2) problems.push(`${filePath}: Q${num} mcq needs at least 2 options`);
      else if (checked.length !== 1) problems.push(`${filePath}: Q${num} mcq needs exactly one [x] option (got ${checked.length})`);
      if (checked.length === 1 && options.length >= 2) {
        const answerIndex = options.indexOf(checked[0]);
        questions.push({
          ...base,
          type: 'mcq',
          question: meta.question,
          options: options.map((o, idx) => ({ id: String.fromCharCode(97 + idx), text: o.text })),
          answer: String.fromCharCode(97 + answerIndex),
        });
      }
    } else if (meta.type === 'trueFalse') {
      const checked = options.filter(o => o.checked);
      const answer = checked.length === 1
        ? /^t/i.test(checked[0].text)
        : meta.answer != null
          ? /^t/i.test(meta.answer)
          : null;
      if (!meta.question) problems.push(`${filePath}: Q${num} is missing a question line`);
      if (answer === null) problems.push(`${filePath}: Q${num} trueFalse needs a checked True/False option or answer: true/false`);
      if (answer !== null) {
        questions.push({ ...base, type: 'trueFalse', question: meta.question, answer });
      }
    } else if (meta.type === 'fillBlank') {
      if (!meta.question) problems.push(`${filePath}: Q${num} is missing a question line`);
      if (!meta.answer) problems.push(`${filePath}: Q${num} fillBlank needs answer: …`);
      else {
        questions.push({
          ...base,
          type: 'fillBlank',
          question: meta.question,
          answer: meta.answer,
          accepted: meta.accepted.length ? meta.accepted : undefined,
        });
      }
    } else {
      problems.push(`${filePath}: Q${num} has unknown type "${meta.type}" (mcq | trueFalse | fillBlank)`);
    }
  }

  return { questions, problems, title: fields.title ?? null };
}

// ── Curriculum code sets ───────────────────────────────────────────────────────

const curriculumCodes = new Set();
const indicatorCodes = new Set();
for (const subject of Object.values(curriculumMap)) {
  for (const classData of Object.values(subject)) {
    for (const strand of classData) {
      for (const subStrand of strand.subStrands) {
        for (const standard of subStrand.contentStandards) {
          curriculumCodes.add(normalizeCode(standard.code));
          for (const indicator of standard.indicators) {
            indicatorCodes.add(normalizeCode(indicator.code));
          }
        }
      }
    }
  }
}

// ── Walk + classify ────────────────────────────────────────────────────────────

function walkMarkdownFiles(dir, base = COURSES_DIR) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name.toLowerCase() !== 'curriculum') {
      files.push(...walkMarkdownFiles(fullPath, base));
    } else if (
      entry.isFile() &&
      entry.name.toLowerCase().endsWith('.md') &&
      entry.name.toLowerCase() !== 'readme.md'
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function classifyFile(filePath) {
  const relParts = path.relative(COURSES_DIR, filePath).split(path.sep);
  const folder = relParts.length >= 2 ? relParts[relParts.length - 2] : null;
  const kind = ['notes', 'questions'].includes(folder?.toLowerCase()) ? folder.toLowerCase() : 'pack';
  const code = kind === 'pack' ? null : normalizeCode(path.basename(filePath, '.md'));
  return { kind, code, folder };
}

function resolveLibraryContext(filePath) {
  const relParts = path.relative(COURSES_DIR, filePath).split(path.sep);
  // <subject>/<class>/{notes|questions}/<code>.md
  if (relParts.length >= 4 && ['notes', 'questions'].includes(relParts[2]?.toLowerCase())) {
    const subjectId = SUBJECT_FOLDER_ALIASES[relParts[0]?.toLowerCase()] ?? SUBJECT_FOLDER_IDS[relParts[0]?.toLowerCase()] ?? null;
    const classId = String(relParts[1]).toUpperCase();
    return { subjectId, classId };
  }
  return { subjectId: null, classId: null };
}

// ── Parse everything ───────────────────────────────────────────────────────────

const files = walkMarkdownFiles(COURSES_DIR).sort();
const errors = [];
const warnings = [];
const records = [];
const ids = new Set();
const library = new Map(); // `${subjectId}:${classId}` -> Map(code -> { notes, questions[] })

for (const filePath of files) {
  const fileName = path.basename(filePath);
  const folderName = path.basename(path.dirname(filePath));
  const { kind, code } = classifyFile(filePath);
  const { subjectId, classId } = resolveLibraryContext(filePath);

  const content = fs.readFileSync(filePath, 'utf8');
  const { fields, body } = readFrontmatter(content);
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = fields.title ||
    (heading && !/^BEACON EDUCATIONAL CONSULT$/i.test(heading) ? heading : detectTopic(fileName));
  // For notes/questions files the <subject>/<class> folder is authoritative;
  // elsewhere detect from frontmatter or filename.
  const detectedClass = kind !== 'pack' && classId
    ? `Basic ${classId.slice(1)}`
    : (detectClass(`${fields.class || fields.classlevel || ''} ${fileName}`) ?? 'Basic 7');
  const subject = fields.subject
    || (subjectId ? (curriculumSubjects.find(s => s.id === subjectId)?.label ?? subjectId) : normalizeSubject(fileName));
  const declaredIndicators = [fields.indicator, fields.indicators]
    .filter(Boolean)
    .flatMap(value => value.split(/[,;|]/).map(c => c.trim()).filter(Boolean));

  const recordId = kind !== 'pack' && subjectId && classId
    ? `${subjectId}-${classId.toLowerCase()}-${kind}-${slugify(fileName.replace(/\.md$/i, ''))}`
    : slugify(fileName.replace(/\.md$/i, ''));

  const record = {
    id: recordId,
    fileName,
    title,
    subject,
    classLevel: detectedClass,
    topic: fields.topic || (kind === 'pack' ? detectTopic(fileName) : code),
    path: path.relative(ROOT, filePath).replace(/\\/g, '/'),
    indicators: [...new Set([...(kind !== 'pack' && code ? [code] : []), ...declaredIndicators, ...extractIndicators(body)])],
    questionCount: estimateQuestionCount(content),
    source: folderName,
    kind,
    hasFrontmatter: Object.keys(fields).length > 0,
    declaredIndicators,
  };
  records.push(record);

  // ── Validation ──
  if (ids.has(record.id)) errors.push(`${record.path}: duplicate upload id "${record.id}"`);
  ids.add(record.id);
  if (!/^Basic [789]$/.test(record.classLevel)) {
    errors.push(`${record.path}: class must be Basic 7, Basic 8, or Basic 9 (got "${record.classLevel}")`);
  }
  const filenameClass = detectClass(fileName);
  if (filenameClass && filenameClass !== record.classLevel) {
    errors.push(`${record.path}: filename says ${filenameClass} but the file is indexed as ${record.classLevel}`);
  }
  if (record.hasFrontmatter && !fields.title) {
    errors.push(`${record.path}: frontmatter must include a title`);
  }
  if (kind !== 'pack' && !indicatorCodes.has(code)) {
    errors.push(`${record.path}: filename code "${code}" is not an embedded curriculum indicator`);
  }

  if (kind === 'pack') {
    if (!body.match(/^#\s+.+/m)) errors.push(`${record.path}: markdown must include a top-level heading`);
    for (const indicator of record.indicators) {
      const valid = curriculumCodes.has(normalizeCode(indicator));
      if (!valid && record.declaredIndicators.includes(indicator)) {
        errors.push(`${record.path}: declared curriculum code "${indicator}" does not match an embedded standard or indicator`);
      } else if (!valid) {
        warnings.push(`${record.path}: inferred curriculum code "${indicator}" does not match the embedded curriculum`);
      }
    }
  }

  // ── Content parsing (notes / questions) ──
  if (kind !== 'pack' && subjectId && classId) {
    const key = `${subjectId}:${classId}`;
    if (!library.has(key)) library.set(key, new Map());
    const entries = library.get(key);

    if (kind === 'notes') {
      if (entries.has(code) && entries.get(code).notes) {
        errors.push(`${record.path}: duplicate notes file for indicator ${code}`);
      }
      const notes = parseNotes(filePath, code);
      const entry = entries.get(code) ?? { code, notes: null, questions: [] };
      entry.notes = notes;
      entries.set(code, entry);
    } else {
      const { questions, problems, title: qTitle } = parseQuestions(filePath, code);
      errors.push(...problems);
      if (questions.length === 0) {
        warnings.push(`${record.path}: no valid questions parsed`);
      }
      const entry = entries.get(code) ?? { code, notes: null, questions: [] };
      entry.questions.push(...questions);
      entries.set(code, entry);
    }
  }
}

// ── Report + write ─────────────────────────────────────────────────────────────

const isCheck = process.argv.includes('--check');
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);

const publicRecords = records.map(({ hasFrontmatter, declaredIndicators, ...rest }) => rest);

// courseUploads.js — metadata index (unchanged export shape, plus `kind`).
const payload = `// AUTO-GENERATED by scripts/parse-course-content.mjs
// Do not edit directly — re-run the script to regenerate.

export const courseUploads = ${JSON.stringify(publicRecords, null, 2)};

export const courseUploadsByClass = Object.fromEntries(
  Object.entries(
    courseUploads.reduce((acc, item) => {
      const key = item.classLevel;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b))
);

export const courseUploadsBySubject = Object.fromEntries(
  Object.entries(
    courseUploads.reduce((acc, item) => {
      const key = item.subject;
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {})
  ).sort(([a], [b]) => a.localeCompare(b))
);

export default courseUploads;
`;
fs.writeFileSync(OUTPUT_FILE, payload, 'utf8');

// courseLibrary/<subject>/<classId>.js — content modules + manifest
if (!fs.existsSync(LIBRARY_DIR)) fs.mkdirSync(LIBRARY_DIR, { recursive: true });
const manifest = [];
for (const [key, entries] of [...library.entries()].sort()) {
  const [subjectId, classId] = key.split(':');
  const list = [...entries.values()]
    .filter(e => e.notes || e.questions.length > 0)
    .sort((a, b) => a.code.localeCompare(b.code));
  if (list.length === 0) continue;

  const modulePath = path.join(LIBRARY_DIR, `${subjectId}-${classId.toLowerCase()}.js`);
  const moduleBody = `// AUTO-GENERATED by scripts/parse-course-content.mjs
// Do not edit directly — re-run the script to regenerate.

export const subjectId = '${subjectId}';
export const classId = '${classId}';
export const entries = ${JSON.stringify(list, null, 2)};
`;
  fs.writeFileSync(modulePath, moduleBody, 'utf8');
  manifest.push({
    subjectId,
    classId,
    label: `Basic ${classId.slice(1)}`,
    entryCount: list.length,
    loader: `() => import('./${subjectId}-${classId.toLowerCase()}.js')`,
  });
}

const indexBody = `// AUTO-GENERATED by scripts/parse-course-content.mjs
// Do not edit directly — re-run the script to regenerate.

export const libraryManifest = [
${manifest.map(m => `  { subjectId: '${m.subjectId}', classId: '${m.classId}', label: '${m.label}', entryCount: ${m.entryCount}, loader: ${m.loader} },`).join('\n')}
];

/** Dynamically load the content entries for a subject + class. */
export async function loadEntries(subjectId, classId) {
  const entry = libraryManifest.find(m => m.subjectId === subjectId && m.classId === classId);
  if (!entry) return [];
  const mod = await entry.loader();
  return mod.entries;
}
`;
fs.writeFileSync(path.join(LIBRARY_DIR, 'index.js'), indexBody, 'utf8');

console.log(`Indexed ${records.length} course markdown files into ${path.relative(ROOT, OUTPUT_FILE)}.`);
console.log(`Content modules: ${manifest.length} subject-class modules (${manifest.reduce((n, m) => n + m.entryCount, 0)} indicator entries).`);
console.log(`Validated ${records.length} files; ${warnings.length} warning(s), ${errors.length} error(s).`);
if (errors.length) process.exitCode = 1;
