import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { curriculumMap } from '../src/data/curriculumData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COURSES_DIR = path.join(ROOT, 'src', 'data', 'courses-data');
const OUTPUT_FILE = path.join(ROOT, 'src', 'data', 'courseUploads.js');

function toTitle(value) {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

function detectClass(fileName) {
  const match = fileName.match(/Basic\s*([789])|B([789])/i);
  if (!match) return 'Basic 7';
  const index = Number(match[1] || match[2]);
  return `Basic ${index}`;
}

function normalizeClass(value, fileName) {
  const match = String(value ?? fileName).match(/(?:Basic\s*|B)([789])\b/i);
  return match ? `Basic ${match[1]}` : String(value ?? 'Basic 7').trim();
}

function readFrontmatter(content) {
  const match = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/);
  if (!match) return { fields: {}, body: content };

  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z][\w-]*):\s*(.*?)\s*$/i);
    if (field) {
      fields[field[1].toLowerCase()] = field[2].replace(/^["']|["']$/g, '');
    }
  }
  return { fields, body: content.slice(match[0].length) };
}

function detectTopic(fileName) {
  const withoutExt = fileName.replace(/\.md$/i, '');
  const cleaned = withoutExt
    .replace(/^BECE_Mock_/, '')
    .replace(/^Beacon_/, '')
    .replace(/^Basic[789]_?/i, '')
    .replace(/_Basic[789]/i, '')
    .replace(/^Integrated_?Science_?/i, '')
    .replace(/_Integrated_?Science/i, '')
    .replace(/_Science/i, '')
    .replace(/_Mock_Pack_.+$/i, '')
    .replace(/_20\d{2}(?:_\d{2})?$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Untitled topic';
}

function extractIndicators(content) {
  const matches = [...content.matchAll(/B[7-9](?:\/JHS\d+)?(?:\.\d+)+/gi)];
  return [...new Set(matches.map((match) => match[0]))];
}

function estimateQuestionCount(content) {
  const matches = content.match(/\*\*(?:\d+)\.|\b\d+\.\s+/g) || [];
  const sectionMatches = content.match(/\b(?:Q|Question)\s*\d+/gi) || [];
  return Math.max(matches.length, sectionMatches.length, 0);
}

function parseMarkdownFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const folderName = path.basename(path.dirname(filePath));
  const { fields, body } = readFrontmatter(content);
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const titleLine = fields.title ||
    (heading && !/^BEACON EDUCATIONAL CONSULT$/i.test(heading) ? heading : detectTopic(fileName));
  const classLevel = normalizeClass(fields.class || fields.classlevel, fileName);
  const subject = fields.subject || normalizeSubject(fileName.replace(/\.md$/i, ''));
  const topic = fields.topic || detectTopic(fileName);
  const declaredIndicators = [fields.indicator, fields.indicators]
    .filter(Boolean)
    .flatMap(value => value.split(/[,;|]/).map(code => code.trim()).filter(Boolean));
  const indicators = [...new Set([...declaredIndicators, ...extractIndicators(body)])];

  return {
    id: fileName.replace(/\.md$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    fileName,
    title: titleLine,
    subject,
    classLevel,
    topic,
    path: path.relative(ROOT, filePath).replace(/\\/g, '/'),
    indicators,
    questionCount: estimateQuestionCount(content),
    source: folderName,
    hasFrontmatter: Object.keys(fields).length > 0,
    hasTitle: Boolean(fields.title),
    hasClass: Boolean(fields.class || fields.classlevel),
    hasHeading: Boolean(body.match(/^#\s+.+/m)),
    declaredIndicators,
  };
}

function walkMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name.toLowerCase() !== 'curriculum') {
      files.push(...walkMarkdownFiles(fullPath));
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

const files = walkMarkdownFiles(COURSES_DIR).sort();
const records = files.map(parseMarkdownFile);
const curriculumCodes = new Set();
for (const subject of Object.values(curriculumMap)) {
  for (const classData of Object.values(subject)) {
    for (const strand of classData) {
      for (const subStrand of strand.subStrands) {
        for (const standard of subStrand.contentStandards) {
          curriculumCodes.add(standard.code.toUpperCase().replace(/\/JHS\d+/g, ''));
          for (const indicator of standard.indicators) {
            curriculumCodes.add(indicator.code.toUpperCase().replace(/\/JHS\d+/g, ''));
          }
        }
      }
    }
  }
}

const errors = [];
const warnings = [];
const ids = new Set();
for (const record of records) {
  if (ids.has(record.id)) errors.push(`${record.path}: duplicate upload id "${record.id}"`);
  ids.add(record.id);
  if (!/^Basic [789]$/.test(record.classLevel)) {
    errors.push(`${record.path}: class must be Basic 7, Basic 8, or Basic 9 (got "${record.classLevel}")`);
  }
  if (record.hasFrontmatter && !record.hasTitle) {
    errors.push(`${record.path}: frontmatter must include a title`);
  }
  if (record.hasFrontmatter && !record.hasClass) {
    errors.push(`${record.path}: frontmatter must include class: Basic 7, Basic 8, or Basic 9`);
  }
  if (!record.hasHeading) {
    errors.push(`${record.path}: markdown must include a top-level heading`);
  }
  for (const code of record.indicators) {
    const valid = curriculumCodes.has(code.toUpperCase().replace(/\/JHS\d+/g, ''));
    if (!valid && record.declaredIndicators.includes(code)) {
      errors.push(`${record.path}: declared curriculum code "${code}" does not match an embedded standard or indicator`);
    } else if (!valid) {
      warnings.push(`${record.path}: inferred curriculum code "${code}" does not match the embedded curriculum`);
    }
  }
}

const isCheck = process.argv.includes('--check');
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
}

const publicRecords = records.map(({ hasFrontmatter, hasTitle, hasClass, hasHeading, declaredIndicators, ...record }) => record);
const payload = `export const courseUploads = ${JSON.stringify(publicRecords, null, 2)};

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
console.log(`Indexed ${records.length} course markdown files into ${path.relative(ROOT, OUTPUT_FILE)}.`);
console.log(`Validated ${records.length} files; ${warnings.length} warning(s), ${errors.length} error(s).`);
if (isCheck && errors.length) process.exitCode = 1;
