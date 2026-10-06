/**
 * seed-course-notes.mjs — one-time converter
 *
 * Converts the scheme-joined "enriched" markdown files (mathematics + science,
 * B7 + B8) into per-indicator lesson-notes files for the course-content
 * pipeline:
 *
 *   src/data/courses-data/<subject>/<class>/notes/<indicator-code>.md
 *
 * Each note carries the indicator wording (objectives), the content-standard
 * context + core competencies (explanation), the worked examples (worked
 * example), and the week's scheme resources (practice pointers).
 *
 * Run: node scripts/seed-course-notes.mjs
 * Idempotent: existing note files are overwritten.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { curriculumMap } from '../src/data/curriculumData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_ROOT = path.join(ROOT, 'src', 'data', 'courses-data');

const SOURCES = [
  { file: 'src/data/ai/MATHEMATICS_ENRICHED_B7_B8.md', subjectId: 'mathematics', classHeader: /^# MATHEMATICS — BASIC ([789])/ },
  { file: 'src/data/ai/SCIENCE_ENRICHED_B7_B8.md', subjectId: 'science', classHeader: /^# SCIENCE — BASIC ([789])/ },
];

const normalizeCode = (code) => (code ?? '').replace(/\/JHS\d+/g, '').toUpperCase();
const CODE_RE = /B[7-9](?:\/JHS\d+)?(?:\.\d+)+/gi;

// Valid indicator codes from the embedded curriculum (normalized).
const indicatorCodes = new Set();
for (const subject of Object.values(curriculumMap)) {
  for (const classData of Object.values(subject)) {
    for (const strand of classData) {
      for (const subStrand of strand.subStrands) {
        for (const standard of subStrand.contentStandards) {
          for (const indicator of standard.indicators) {
            indicatorCodes.add(normalizeCode(indicator.code));
          }
        }
      }
    }
  }
}

/** First sentence of the indicator wording (title + objective). */
function firstSentence(text) {
  const trimmed = (text ?? '').trim();
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  return (match ? match[1] : trimmed.slice(0, 80)).replace(/\s+/g, ' ').trim();
}

/** Split indicator wording from its worked examples ("E.g." tail). */
function splitExamples(text) {
  const idx = (text ?? '').search(/\sE\.?g\.?(?:,|\s|\.)/i);
  if (idx < 0) return { wording: (text ?? '').trim(), examples: '' };
  return {
    wording: text.slice(0, idx).trim(),
    examples: text.slice(idx).trim().replace(/^E\.?g\.?(?:,|\s|\.)\s*/i, ''),
  };
}

const skipped = [];
const written = [];
const seen = new Set();

for (const source of SOURCES) {
  const raw = fs.readFileSync(path.join(ROOT, source.file), 'utf8');
  const lines = raw.split(/\r?\n/);

  let classId = null;
  let term = null;
  let week = null;
  let weekResources = '';
  let currentStandard = null;
  let current = null; // { code, wording, examples, competencies: [] }

  const flush = () => {
    if (!current || !classId) return;
    const code = current.code;
    const seenKey = `${source.subjectId}:${classId}:${code}`;

    if (!indicatorCodes.has(normalizeCode(code))) {
      skipped.push(`${seenKey} — not in embedded curriculum`);
      current = null;
      return;
    }
    if (seen.has(seenKey)) {
      skipped.push(`${seenKey} — duplicate (kept first occurrence)`);
      current = null;
      return;
    }
    seen.add(seenKey);

    const title = firstSentence(current.wording) || code;
    const standardLine = currentStandard
      ? `\n*Content standard ${currentStandard.code}* — ${currentStandard.description}\n`
      : '';
    const competencies = current.competencies.length
      ? `\n\n**Core competencies:** ${current.competencies.join(' ')}\n`
      : '';

    const body = `---
title: ${title.replace(/["']/g, '')}
---

# ${title}

## Objectives
- ${firstSentence(current.wording) || code}

## Explanation
${standardLine}${current.wording}${competencies}

## Worked Example
${current.examples || 'See the NaCCA curriculum document for worked examples.'}

## Practice
- Week ${week ?? '?'} (Term ${term ?? '?'}) scheme resources: ${weekResources || '—'}
`;
    const dir = path.join(OUT_ROOT, source.subjectId, classId, 'notes');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${code}.md`), body, 'utf8');
    written.push(`${seenKey} — ${title.slice(0, 50)}`);
    current = null;
  };

  for (const line of lines) {
    const classMatch = line.match(source.classHeader);
    if (classMatch) {
      flush();
      classId = `B${classMatch[1]}`;
      continue;
    }
    const termMatch = line.match(/^## Term\s+([123])/i);
    if (termMatch) { term = termMatch[1]; continue; }
    const weekMatch = line.match(/^####\s+Week\s+(\d+)/i);
    if (weekMatch) {
      flush();
      week = weekMatch[1];
      weekResources = '';
      currentStandard = null;
      continue;
    }
    const resourcesMatch = line.match(/^\*\*Scheme resources:\*\*\s*(.*)$/i);
    if (resourcesMatch) { weekResources = resourcesMatch[1].trim(); continue; }
    // Flagged bogus codes from the source ("cited by the scheme but not present")
    if (/^>\s*\*\*B[7-9]/.test(line)) { continue; }

    const standardMatch = line.match(/^\*\*Content standard\s+(B[7-9](?:\/JHS\d+)?(?:\.\d+)+)\*\*\s*—\s*(.*)$/i);
    if (standardMatch) {
      flush();
      currentStandard = { code: standardMatch[1], description: standardMatch[2].trim() };
      continue;
    }

    const indicatorMatch = line.match(/^\*\*(B[7-9](?:\/JHS\d+)?(?:\.\d+)+)\*\*\s*—\s*(.*)$/i);
    if (indicatorMatch) {
      flush();
      const { wording, examples } = splitExamples(indicatorMatch[2]);
      current = { code: indicatorMatch[1], wording, examples, competencies: [] };
      continue;
    }

    if (current && /^\*Core competencies:\*\*/i.test(line)) {
      current.competencies.push(line.replace(/^\*Core competencies:\*\*\s*/i, '').trim());
    }
  }
  flush();
}

console.log(`\nWrote ${written.length} note files:`);
for (const w of written.slice(0, 12)) console.log(`  • ${w}`);
if (written.length > 12) console.log(`  … and ${written.length - 12} more`);
if (skipped.length) {
  console.log(`\nSkipped ${skipped.length}:`);
  for (const s of skipped.slice(0, 10)) console.log(`  • ${s}`);
  if (skipped.length > 10) console.log(`  … and ${skipped.length - 10} more`);
}
