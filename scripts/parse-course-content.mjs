import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

function detectTopic(fileName) {
  const withoutExt = fileName.replace(/\.md$/i, '');
  const cleaned = withoutExt
    .replace(/^BECE_Mock_/, '')
    .replace(/^Beacon_/, '')
    .replace(/_Basic[789]/i, '')
    .replace(/_IntegratedScience/i, '')
    .replace(/_Integrated_Science/i, '')
    .replace(/_Science/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || 'Untitled topic';
}

function extractIndicators(content) {
  const matches = [...content.matchAll(/B[7-9](?:\/JHS\d+)?(?:\.\d+)+/g)];
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
  const titleLine = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || fileName.replace(/\.md$/i, '');
  const classLevel = detectClass(fileName);
  const subject = normalizeSubject((folderName + ' ' + fileName).replace(/\.[^/.]+$/, ''));
  const topic = detectTopic(fileName);
  const indicators = extractIndicators(content);

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
  };
}

function walkMarkdownFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
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

const payload = `export const courseUploads = ${JSON.stringify(records, null, 2)};

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
console.log(`Indexed ${records.length} course markdown files into ${path.relative(ROOT, OUTPUT_FILE)}`);
