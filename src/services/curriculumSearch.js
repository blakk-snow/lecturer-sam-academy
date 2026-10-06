/**
 * curriculumSearch.js — local lookup of NaCCA curriculum entries
 *
 * Cheap "RAG without infrastructure": when a chat message contains an
 * indicator or content-standard code, we find the exact entry in the
 * embedded curriculum tree and hand it to the model, so answers are
 * grounded in the real curriculum text instead of the model's memory.
 *
 * curriculumData is ~600 KB, so it is imported lazily here.
 */

let curriculumPromise = null;
function loadCurriculum() {
  curriculumPromise ??= import('../data/curriculumData');
  return curriculumPromise;
}

const CODE_PATTERN = /B[7-9](\/JHS[123])?\.\d+(\.\d+)+/g;

/** Normalize the two code spellings to one: "B7/JHS1.4.5.1" → "B7.4.5.1". */
export function normalizeCode(code) {
  return (code ?? '').replace(/\/JHS[123]/g, '');
}

/** Extract every NaCCA indicator/content-standard code from free text. */
export function extractCodes(text) {
  const matches = (text ?? '').match(CODE_PATTERN) ?? [];
  return [...new Set(matches.map(normalizeCode))];
}

/**
 * Find curriculum entries (strand → sub-strand → content standard →
 * indicator) that match any codes found in the text.
 *
 * @param {string} text
 * @returns {Promise<Array<{ code, type, description, subjectId, classId,
 *   strand, subStrand, contentStandardCode, contentStandardDescription }>>}
 */
export async function findCurriculumEntries(text) {
  const codes = extractCodes(text);
  if (codes.length === 0) return [];

  const { curriculumMap } = await loadCurriculum();
  const results = [];

  for (const [subjectId, byClass] of Object.entries(curriculumMap)) {
    for (const [classId, strands] of Object.entries(byClass)) {
      for (const strand of strands ?? []) {
        for (const ss of strand.subStrands ?? []) {
          for (const cs of ss.contentStandards ?? []) {
            const csCode = normalizeCode(cs.code);
            if (codes.includes(csCode)) {
              results.push({
                code: cs.code,
                type: 'content-standard',
                description: cs.description,
                subjectId, classId,
                strand: strand.title,
                subStrand: `${ss.code} ${ss.title}`,
                contentStandardCode: cs.code,
                contentStandardDescription: cs.description,
              });
            }
            for (const ind of cs.indicators ?? []) {
              const indCode = normalizeCode(ind.code);
              if (codes.includes(indCode)) {
                results.push({
                  code: ind.code,
                  type: 'indicator',
                  description: ind.description,
                  subjectId, classId,
                  strand: strand.title,
                  subStrand: `${ss.code} ${ss.title}`,
                  contentStandardCode: cs.code,
                  contentStandardDescription: cs.description,
                });
              }
            }
          }
        }
      }
    }
  }

  return results;
}

/** Build the context text injected into a chat system prompt. */
export function formatEntriesContext(entries) {
  if (!entries?.length) return '';
  const lines = entries.map(e =>
    e.type === 'indicator'
      ? `- Indicator ${e.code}: ${e.description} (Strand: ${e.strand}; Sub-strand: ${e.subStrand}; Content Standard ${e.contentStandardCode}: ${e.contentStandardDescription})`
      : `- Content Standard ${e.code}: ${e.description} (Strand: ${e.strand}; Sub-strand: ${e.subStrand})`,
  );
  return [
    'Here is the exact NaCCA curriculum text for the codes mentioned. Ground your answer in this:',
    ...lines,
  ].join('\n');
}

// ── Bundled content grounding (sample lesson plans + question bank) ───────────

const SUBJECT_WORDS = {
  mathematics: ['math', 'maths', 'mathematics'],
  science: ['science', 'integrated science'],
};

/**
 * Find bundled sample lesson plans and question-bank papers relevant to a
 * chat message. Cheap keyword matching over small metadata — the heavy
 * modules are never loaded for chat context.
 *
 * @returns {Promise<{ plans: Array, papers: Array }>}
 */
export async function findLocalResources(text) {
  const normalized = (text ?? '').toLowerCase();
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  const out = { plans: [], papers: [] };

  const mentionsPlans = /sample|lesson plan|lesson note|template/i.test(normalized);
  if (mentionsPlans) {
    const { sampleLessonPlans } = await import('../data/sampleLessonPlans');
    const matchedSubject = Object.entries(SUBJECT_WORDS).find(([, ws]) => ws.some(w => words.includes(w)))?.[0] ?? null;
    out.plans = sampleLessonPlans
      .filter(p => (matchedSubject ? p.subjectId === matchedSubject : true))
      .slice(0, 4)
      .map(p => ({
        id: p.id,
        title: p.title,
        contentStandard: p.contentStandard,
        indicators: p.indicators.map(i => i.code).join(', '),
      }));
  }

  const mentionsBank = /question|mock|past|bece|exam|test|practice paper/i.test(normalized);
  if (mentionsBank) {
    const { bankIndex } = await import('../data/questionBank');
    const hits = [];
    for (const entry of bankIndex) {
      for (const paper of entry.papers) {
        const title = paper.title.toLowerCase();
        if (words.some(w => w.length > 3 && title.includes(w))) hits.push({ ...paper, classLabel: entry.label });
      }
    }
    out.papers = hits.slice(0, 4);
  }

  return out;
}

/** Format bundled-content matches as extra system-prompt context. */
export function formatLocalContext({ plans, papers }) {
  const lines = [];
  if (plans?.length) {
    lines.push('Bundled sample lesson plans in this app (mention them when relevant):');
    for (const p of plans) lines.push(`- ${p.title} (Content Standard ${p.contentStandard}${p.indicators ? `; indicators ${p.indicators}` : ''})`);
  }
  if (papers?.length) {
    lines.push('Bundled BECE-style question papers in this app (mention them when relevant):');
    for (const p of papers) lines.push(`- ${p.title} (${p.classLabel})`);
  }
  return lines.join('\n');
}
