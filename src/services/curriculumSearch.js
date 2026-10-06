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
