/**
 * parse-curriculum.mjs
 *
 * Parses NaCCA curriculum Markdown files and generates src/data/curriculumData.js.
 * Preserves the existing hardcoded Mathematics B7 data verbatim.
 *
 * Run: node scripts/parse-curriculum.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CURRICULUM_DIR = path.join(ROOT, 'src', 'data', 'curriculum');
const OUTPUT = path.join(ROOT, 'src', 'data', 'curriculumData.js');

// ── Subject definitions ───────────────────────────────────────────────────────

const SUBJECTS = [
  { id: 'mathematics',      label: 'Mathematics' },
  { id: 'science',          label: 'Science' },
  { id: 'english',          label: 'English Language' },
  { id: 'socialStudies',    label: 'Social Studies' },
  { id: 'computing',        label: 'Computing' },
  { id: 'rme',              label: 'Religious & Moral Education' },
  { id: 'careerTech',       label: 'Career Technology' },
  { id: 'creativeArts',     label: 'Creative Arts & Design' },
  { id: 'french',           label: 'French Language' },
  { id: 'ghanaianLanguage', label: 'Ghanaian Language' },
];

const CLASSES = [
  { id: 'B7', label: 'Basic 7' },
  { id: 'B8', label: 'Basic 8' },
  { id: 'B9', label: 'Basic 9' },
];

// ── File mapping ──────────────────────────────────────────────────────────────

const FILE_MAP = [
  { subject: 'science',          class: 'B7', file: 'CCP_SCIENCE_JHS_2023_Basic7_Full.md' },
  { subject: 'science',          class: 'B8', file: 'CCP_SCIENCE_JHS_2023_Basic8_Full.md' },
  { subject: 'science',          class: 'B9', file: 'CCP_SCIENCE_JHS_2023_Basic9_Full.md' },
  { subject: 'english',          class: 'B7', file: 'ENGLISH_LANGUAGE_Basic7_Full.md' },
  { subject: 'english',          class: 'B8', file: 'ENGLISH_LANGUAGE_Basic8_Full.md' },
  { subject: 'english',          class: 'B9', file: 'ENGLISH_LANGUAGE_Basic9_Full.md' },
  { subject: 'socialStudies',    class: 'B7', file: 'Social_Studies_Basic7_Full.md' },
  { subject: 'socialStudies',    class: 'B8', file: 'Social_Studies_Basic8_Full.md' },
  { subject: 'socialStudies',    class: 'B9', file: 'Social_Studies_Basic9_Full.md' },
  { subject: 'computing',        class: 'B7', file: 'COMPUTING_Basic7_Full.md' },
  { subject: 'computing',        class: 'B8', file: 'COMPUTING_Basic8_Full.md' },
  { subject: 'computing',        class: 'B9', file: 'COMPUTING_Basic9_Full.md' },
  { subject: 'rme',              class: 'B7', file: 'Religious_and_Moral_Education_Basic7_Full.md' },
  { subject: 'rme',              class: 'B8', file: 'Religious_and_Moral_Education_Basic8_Full.md' },
  { subject: 'rme',              class: 'B9', file: 'Religious_and_Moral_Education_Basic9_Full.md' },
  { subject: 'careerTech',       class: 'B7', file: 'Career_Technology_k_9_3rd_Aug_08_2021_Basic7_Full.md' },
  { subject: 'careerTech',       class: 'B8', file: 'Career_Technology_k_9_3rd_Aug_08_2021_Basic8_Full.md' },
  { subject: 'careerTech',       class: 'B9', file: 'Career_Technology_k_9_3rd_Aug_08_2021_Basic9_Full.md' },
  { subject: 'creativeArts',     class: 'B7', file: 'CREATIVE_ARTS_AND_DESIGN_Basic7_Full.md' },
  { subject: 'creativeArts',     class: 'B8', file: 'CREATIVE_ARTS_AND_DESIGN_Basic8_Full.md' },
  { subject: 'creativeArts',     class: 'B9', file: 'CREATIVE_ARTS_AND_DESIGN_Basic9_Full.md' },
  { subject: 'french',           class: 'B7', file: 'FRENCH_LANGUAGE_Basic7_Full.md' },
  { subject: 'french',           class: 'B8', file: 'FRENCH_LANGUAGE_Basic8_Full.md' },
  { subject: 'french',           class: 'B9', file: 'FRENCH_LANGUAGE_Basic9_Full.md' },
  { subject: 'ghanaianLanguage', class: 'B7', file: 'GHANAIAN_LANGUAGE_Basic7_Full.md' },
  { subject: 'ghanaianLanguage', class: 'B8', file: 'GHANAIAN_LANGUAGE_Basic8_Full.md' },
  { subject: 'ghanaianLanguage', class: 'B9', file: 'GHANAIAN_LANGUAGE_Basic9_Full.md' },
];

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Strips markdown bold markers and inline `*(printed in the curriculum as "...")* ` notes.
 */
function cleanText(text) {
  return text
    .replace(/\*\(printed in the curriculum as "[^"]*"\)\s*\*/gi, '')
    .replace(/\*\(On this page[^)]*\)\s*\*/gi, '')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract an indicator code from a #### heading line.
 * Examples:
 *   "#### Indicator B7/JHS1.1.1.1.1  *(printed...)*"
 *   "#### Indicator B7.1.1.1.1"
 *   "#### B7/JHS1.1.1.1.1"
 */
function extractIndicatorCode(line) {
  // Remove the #### prefix and optional "Indicator" keyword
  let s = line.replace(/^#{4}\s*/,'').replace(/^Indicator\s*/i,'').trim();
  // Strip the *(printed...)* suffix
  s = s.replace(/\s*\*\(printed[^)]*\)\s*\*?/gi,'').trim();
  // Take the first whitespace-delimited token as the code
  const code = s.split(/\s+/)[0];
  // Remaining text after the code is an inline description (common in English/Computing files)
  const rest = s.slice(code.length).replace(/^[\s•–\-:]+/, '').trim();
  return { code, inlineDesc: rest };
}

/**
 * Parse a markdown curriculum file into an array of strand objects.
 * Returns [] if the file is a stub (no strands found).
 */
function parseFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const strands = [];
  let currentStrand = null;
  let currentSubStrand = null;
  let currentStandard = null;
  let currentIndicator = null;
  let capturingStandardDesc = false;
  let capturingIndicatorDesc = false;
  let inPreamble = true; // skip everything before first # STRAND

  for (let raw of lines) {
    const line = raw.trimEnd();

    // Detect start of curriculum body (first # STRAND heading)
    if (inPreamble) {
      if (/^#\s+STRAND\s+/i.test(line)) {
        inPreamble = false;
        // fall through to process this line
      } else {
        continue;
      }
    }

    // Skip table rows and horizontal rules
    if (line.startsWith('|') || line.match(/^---+\s*$/)) {
      capturingIndicatorDesc = false;
      capturingStandardDesc = false;
      continue;
    }

    // ── # STRAND ──────────────────────────────────────────────────────────────
    if (/^#\s+STRAND\s+/i.test(line)) {
      currentSubStrand = null;
      currentStandard = null;
      currentIndicator = null;
      capturingStandardDesc = false;
      capturingIndicatorDesc = false;

      // Extract title: everything after the first ":"
      const colonIdx = line.indexOf(':');
      const title = colonIdx >= 0
        ? line.slice(colonIdx + 1).trim()
        : line.replace(/^#\s+STRAND\s+\d+\s*/i, '').trim();

      // Extract strand number
      const numMatch = line.match(/STRAND\s+(\d+)/i);
      const num = numMatch ? numMatch[1] : String(strands.length + 1);

      currentStrand = {
        id: `strand-${num}`,
        code: num,
        title: cleanText(title),
        subStrands: [],
      };
      strands.push(currentStrand);
      continue;
    }

    // ── ## SUB-STRAND ─────────────────────────────────────────────────────────
    if (/^##\s+SUB-STRAND\s+/i.test(line) || /^##\s+SUB-STRAND\s*\d/i.test(line)) {
      if (!currentStrand) continue;
      currentStandard = null;
      currentIndicator = null;
      capturingStandardDesc = false;
      capturingIndicatorDesc = false;

      const colonIdx = line.indexOf(':');
      const title = colonIdx >= 0
        ? line.slice(colonIdx + 1).trim()
        : line.replace(/^##\s+SUB-STRAND\s+[\d.]+\s*/i, '').trim();

      // Extract sub-strand code
      const numMatch = line.match(/SUB-STRAND\s+([\d.]+)/i);
      const ssNum = numMatch ? numMatch[1] : String(currentStrand.subStrands.length + 1);
      const strandCode = currentStrand.code;

      currentSubStrand = {
        id: `ss-${strandCode}-${ssNum.replace(/\./g, '-')}`,
        code: `${strandCode}.${ssNum}`,
        title: cleanText(title),
        contentStandards: [],
      };
      currentStrand.subStrands.push(currentSubStrand);
      continue;
    }

    // ── ### Content Standard ──────────────────────────────────────────────────
    if (/^###\s+/.test(line) && !/^####/.test(line)) {
      if (!currentSubStrand) continue;
      currentIndicator = null;
      capturingStandardDesc = false;
      capturingIndicatorDesc = false;

      // The code is usually the last whitespace-delimited token on the line
      const noHash = line.replace(/^###\s+/, '').trim();
      // Match things like "Content Standard B7/JHS1.1.1.1" or just the code
      const codeMatch = noHash.match(/([A-Z][A-Za-z0-9/.\s]*[0-9])\s*$/);
      let code = codeMatch ? codeMatch[1].trim() : noHash.split(/\s+/).pop();
      // Sometimes it's "### Content Standard B7.1.1.1" — extract last token
      const parts = noHash.split(/\s+/);
      // Use the last token that looks like a standard code
      const codeToken = parts.find(p => /^B\d/.test(p)) || parts[parts.length - 1];
      code = cleanText(codeToken);

      currentStandard = {
        id: code,
        code: code,
        description: '',
        indicators: [],
      };
      currentSubStrand.contentStandards.push(currentStandard);
      capturingStandardDesc = true;
      continue;
    }

    // ── #### Indicator ────────────────────────────────────────────────────────
    if (/^####\s+/.test(line)) {
      if (!currentStandard) continue;
      capturingStandardDesc = false;
      capturingIndicatorDesc = false;

      const { code, inlineDesc } = extractIndicatorCode(line);
      if (!code) continue;

      currentIndicator = {
        id: code,
        code: code,
        description: inlineDesc,
      };
      currentStandard.indicators.push(currentIndicator);
      if (inlineDesc.length > 20) {
        capturingIndicatorDesc = false; // inline desc is already substantial
      } else {
        capturingIndicatorDesc = true;
      }
      continue;
    }

    // ── Bold line after ### → content standard description ───────────────────
    if (capturingStandardDesc && currentStandard) {
      const boldMatch = line.match(/^\*\*(.+)\*\*\s*$/);
      if (boldMatch) {
        currentStandard.description = cleanText(boldMatch[1]);
        capturingStandardDesc = false;
        continue;
      }
      // Plain paragraph right after ### (some files don't bold)
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('*') && !trimmed.startsWith('|')) {
        currentStandard.description = cleanText(trimmed);
        capturingStandardDesc = false;
        continue;
      }
    }

    // ── Paragraph text for indicator description ──────────────────────────────
    if (capturingIndicatorDesc && currentIndicator) {
      const trimmed = line.trim();

      // Stop conditions: exemplars, core competencies, bullet competency lines, empty after content
      if (
        /^\*\*Exemplars/i.test(trimmed) ||
        /^\*\*Core competencies/i.test(trimmed) ||
        /^\*\*Learning indicators/i.test(trimmed) ||
        /^-\s+(CC|CP|CI|DL|PL|CG|PL|NB)\s+\d/i.test(trimmed) ||
        /^\d+\.\s+/.test(trimmed) // numbered exemplar items
      ) {
        capturingIndicatorDesc = false;
        continue;
      }

      if (!trimmed) {
        // blank line ends description capture
        if (currentIndicator.description.length > 0) {
          capturingIndicatorDesc = false;
        }
        continue;
      }

      if (trimmed.startsWith('#') || trimmed.startsWith('|')) {
        capturingIndicatorDesc = false;
        continue;
      }

      // Append to description
      if (currentIndicator.description) {
        currentIndicator.description += ' ' + cleanText(trimmed);
      } else {
        currentIndicator.description = cleanText(trimmed);
      }
    }
  }

  return strands;
}

// ── Build the curriculum map ──────────────────────────────────────────────────

console.log('Parsing curriculum markdown files…\n');

const parsed = {};

for (const { subject, class: cls, file } of FILE_MAP) {
  const filePath = path.join(CURRICULUM_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  Missing file: ${file} — skipping`);
    continue;
  }

  let strands = [];
  try {
    strands = parseFile(filePath);
  } catch (err) {
    console.warn(`  ⚠  Error parsing ${file}: ${err.message} — treating as empty`);
  }

  if (!parsed[subject]) parsed[subject] = {};
  parsed[subject][cls] = strands;

  const totalIndicators = strands.reduce((n, st) =>
    n + st.subStrands.reduce((m, ss) =>
      m + ss.contentStandards.reduce((k, cs) => k + cs.indicators.length, 0), 0), 0);

  console.log(`  ✓  ${subject} / ${cls} — ${strands.length} strands, ${totalIndicators} indicators`);
}

// ── Hardcoded Mathematics B7 (preserved from original curriculumData.js) ──────
// Mathematics B8/B9 are stub files — leave as empty arrays

const mathB7 = [
  {
    id: 'strand-1', code: '1', title: 'NUMBER',
    subStrands: [
      {
        id: 'ss-1-1', code: '1.1', title: 'Number and Numeration Systems',
        contentStandards: [
          {
            id: 'B7.1.1.1', code: 'B7.1.1.1',
            description: 'Demonstrate understanding and the use of place value for expressing quantities recorded as base ten numerals as well as rounding these to given decimal places and significant figures.',
            indicators: [
              { id: 'B7.1.1.1.1', code: 'B7.1.1.1.1', description: 'Model number quantities more than 1,000,000,000 using graph sheets, isometric papers and multi-base blocks' },
              { id: 'B7.1.1.1.3', code: 'B7.1.1.1.3', description: 'Round (off, up, down) whole numbers more than 1,000,000,000 to the nearest hundred-thousand, ten-thousands, thousands, hundreds and tens' },
              { id: 'B7.1.1.1.4', code: 'B7.1.1.1.4', description: 'Round decimals to the nearest tenth, hundredth, thousandths, etc.' },
              { id: 'B7.1.1.1.5', code: 'B7.1.1.1.5', description: 'Express decimal numerals to given significant and decimal places' },
            ],
          },
          {
            id: 'B7.1.1.2', code: 'B7.1.1.2',
            description: 'Compare and order whole numbers more than 1,000,000,000 and represent the comparison using ">, <, or ="',
            indicators: [],
          },
        ],
      },
      {
        id: 'ss-1-2', code: '1.2', title: 'Number Operations',
        contentStandards: [
          {
            id: 'B7.1.2.1', code: 'B7.1.2.1',
            description: 'Apply mental mathematics strategies and number properties used to solve problems',
            indicators: [
              { id: 'B7.1.2.1.1', code: 'B7.1.2.1.1', description: 'Multiply and divide given numbers by powers of 10 including decimals and benchmark fractions' },
              { id: 'B7.1.2.1.2', code: 'B7.1.2.1.2', description: 'Apply mental mathematics strategies and number properties used to perform calculations.' },
              { id: 'B7.1.2.1.3', code: 'B7.1.2.1.3', description: 'Apply mental mathematics strategies to solve word problems.' },
            ],
          },
          {
            id: 'B7.1.2.2', code: 'B7.1.2.2',
            description: 'Demonstrate an understanding of addition, subtraction, multiplication and division of whole numbers and decimal numbers to solve problems.',
            indicators: [
              { id: 'B7.1.2.2.1', code: 'B7.1.2.2.1', description: 'Add and subtract up to four-digit numbers.' },
              { id: 'B7.1.2.2.3', code: 'B7.1.2.2.3', description: 'Create and solve story problems involving decimals.' },
            ],
          },
          {
            id: 'B7.1.2.3', code: 'B7.1.2.3',
            description: 'Demonstrate understanding and the use of powers of natural numbers in solving problems.',
            indicators: [
              { id: 'B7.1.2.3.1', code: 'B7.1.2.3.1', description: 'Illustrate with examples the meaning of repeated factors using counting objects such as bottle tops or bundles.' },
              { id: 'B7.1.2.3.2', code: 'B7.1.2.3.2', description: 'Express a given number as a product of a given number or numbers, as well as, in the form of a power or two such numbers as product of powers.' },
              { id: 'B7.1.2.3.3', code: 'B7.1.2.3.3', description: 'Show that the value of any natural number with zero as its exponent or index is 1 and use it to solve problems.' },
              { id: 'B7.1.2.3.4', code: 'B7.1.2.3.4', description: 'Find the value of a number written in index form.' },
              { id: 'B7.1.2.3.5', code: 'B7.1.2.3.5', description: 'Apply the concept of powers of numbers (product of prime) to find Highest Common Factor (HCF).' },
            ],
          },
        ],
      },
      {
        id: 'ss-1-3', code: '1.3', title: 'Fractions, Decimals and Percentages',
        contentStandards: [
          {
            id: 'B7.1.3.1', code: 'B7.1.3.1',
            description: 'Simplify, compare and order a mixture of positive fractions (i.e. common, percent and decimal) by changing all to equivalent fractions, decimals, or percentages.',
            indicators: [
              { id: 'B7.1.3.1.1', code: 'B7.1.3.1.1', description: 'Determine and recall the percentages and decimals of given benchmark fractions (i.e. tenths, fifths, fourths, thirds and halves) and use these to compare quantities.' },
              { id: 'B7.1.3.1.2', code: 'B7.1.3.1.2', description: 'Compare and order fractions (i.e. common, percent and decimal fractions up to thousandths) limited to the benchmark fractions.' },
            ],
          },
          {
            id: 'B7.1.3.2', code: 'B7.1.3.2',
            description: 'Demonstrate an understanding of the process of addition and/or subtraction of fractions and apply this in solving problems.',
            indicators: [
              { id: 'B7.1.3.2.1', code: 'B7.1.3.2.1', description: 'Explain the process of addition and subtraction of two or three unlike and mixed fractions.' },
              { id: 'B7.1.3.2.2', code: 'B7.1.3.2.2', description: 'Solve problems involving addition or subtraction of fractions.' },
            ],
          },
          {
            id: 'B7.1.3.3', code: 'B7.1.3.3',
            description: 'Demonstrate an understanding of the process of multiplying and dividing positive fractions and apply this in solving problems.',
            indicators: [
              { id: 'B7.1.3.3.1', code: 'B7.1.3.3.1', description: 'Explain the process of multiplying a fraction (i.e. common, percent and decimal fractions up to thousandths) by a whole number and by a fraction.' },
              { id: 'B7.1.3.3.2', code: 'B7.1.3.3.2', description: 'Find a fraction of given quantity (i.e. money or given quantity of objects).' },
              { id: 'B7.1.3.3.3', code: 'B7.1.3.3.3', description: 'Explain the process of dividing a fraction (i.e. common, percent and decimal fractions up to thousandths) by a 1-digit whole number and by a fraction.' },
              { id: 'B7.1.3.3.4', code: 'B7.1.3.3.4', description: 'Determine the result of dividing a quantity (i.e. money or objects) or a fraction by a fraction.' },
            ],
          },
        ],
      },
      {
        id: 'ss-1-4', code: '1.4', title: 'Ratios and Proportion',
        contentStandards: [
          {
            id: 'B7.1.4.1', code: 'B7.1.4.1',
            description: 'Demonstrate an understanding of the concept of ratios and its relationship to fractions and use it to solve problems that involve rates, ratios, and proportional reasoning.',
            indicators: [
              { id: 'B7.1.4.1.1', code: 'B7.1.4.1.1', description: 'Find ratio and use ratio language to describe relationship between two quantities.' },
              { id: 'B7.1.4.1.2', code: 'B7.1.4.1.2', description: 'Use the concept of a unit rate associated with a ratio a:b with b ≠ 0, and use rate language in the context of a ratio relationship.' },
              { id: 'B7.1.4.1.3', code: 'B7.1.4.1.3', description: 'Make tables of equivalent ratios (written as common fractions) relating quantities that are proportional.' },
              { id: 'B7.1.4.1.4', code: 'B7.1.4.1.4', description: 'Use proportional reasoning to find missing values in the tables, and plot pairs of values on the coordinate plane.' },
              { id: 'B7.1.4.1.5', code: 'B7.1.4.1.5', description: 'Find a percent of a quantity as a rate per 100 (e.g. 30% of a quantity means 30/100 times the quantity).' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'strand-2', code: '2', title: 'ALGEBRA',
    subStrands: [
      {
        id: 'ss-2-1', code: '2.1', title: 'Patterns and Relations',
        contentStandards: [
          {
            id: 'B7.2.1.1', code: 'B7.2.1.1',
            description: 'Derive the rule for a set of points of a relation, draw a table of values to graph the relation in a number plane and make predictions about subsequent elements of the relation.',
            indicators: [
              { id: 'B7.2.1.1.1', code: 'B7.2.1.1.1', description: 'Extend a given relation presented with and without symbolic materials and explain how each element differs from the preceding one.' },
              { id: 'B7.2.1.1.2', code: 'B7.2.1.1.2', description: 'Describe the rule for a given relation using mathematical language such as one more, one less, one more than twice, etc.' },
              { id: 'B7.2.1.1.3', code: 'B7.2.1.1.3', description: 'Identify the relation or rule in a pattern/mapping presented numerically or symbolically and predict subsequent elements.' },
              { id: 'B7.2.1.1.4', code: 'B7.2.1.1.4', description: 'Locate points on the number plane, draw a table of values of a given relation, draw graphs for given relations and use them to solve problems.' },
            ],
          },
        ],
      },
      {
        id: 'ss-2-2', code: '2.2', title: 'Algebraic Expressions',
        contentStandards: [
          {
            id: 'B7.2.2.1', code: 'B7.2.2.1',
            description: 'Simplify algebraic expressions involving the four basic operations and substituting values to evaluate algebraic expressions.',
            indicators: [
              { id: 'B7.2.2.1.1', code: 'B7.2.2.1.1', description: 'Create simple algebraic expressions using simple logic to translate a set of instructions into an algebraic expression.' },
              { id: 'B7.2.2.1.2', code: 'B7.2.2.1.2', description: 'Perform addition and subtraction of algebraic expressions with rational coefficients.' },
              { id: 'B7.2.2.1.3', code: 'B7.2.2.1.3', description: 'Perform multiplication and division of algebraic expressions with rational coefficients.' },
              { id: 'B7.2.2.1.4', code: 'B7.2.2.1.4', description: 'Substitute values to evaluate algebraic expressions.' },
              { id: 'B7.2.2.1.5', code: 'B7.2.2.1.5', description: 'Use properties of the four operations to simplify algebraic expressions with rational coefficients.' },
            ],
          },
        ],
      },
      {
        id: 'ss-2-3', code: '2.3', title: 'Variables and Equations',
        contentStandards: [
          {
            id: 'B7.2.3.1', code: 'B7.2.3.1',
            description: 'Demonstrate an understanding of linear equations of the form x + a = b (where a and b are integers) by modelling problems as a linear equation and solving the problems concretely, pictorially, and symbolically.',
            indicators: [
              { id: 'B7.2.3.1.1', code: 'B7.2.3.1.1', description: 'Translate word problems to linear equations in one variable and vice versa.' },
              { id: 'B7.2.3.1.2', code: 'B7.2.3.1.2', description: 'Model and solve linear equations using concrete materials (e.g., counters and integer tiles) and describe the process orally and symbolically.' },
              { id: 'B7.2.3.1.3', code: 'B7.2.3.1.3', description: 'Model linear equations, then write mathematical expressions and describe the process of solving the equation using algebraic tiles.' },
              { id: 'B7.2.3.1.4', code: 'B7.2.3.1.4', description: 'Solve linear equations in one variable.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'strand-3', code: '3', title: 'GEOMETRY AND MEASUREMENT',
    subStrands: [
      {
        id: 'ss-3-1', code: '3.1', title: 'Shape and Space',
        contentStandards: [
          {
            id: 'B7.3.1.1', code: 'B7.3.1.1',
            description: 'Demonstrate understanding of angles including adjacent, vertically opposite, complementary, supplementary and use them to solve problems.',
            indicators: [
              { id: 'B7.3.1.1.1', code: 'B7.3.1.1.1', description: 'Measure and classify angles according to their measured sizes - right, acute, obtuse and reflex.' },
              { id: 'B7.3.1.1.2', code: 'B7.3.1.1.2', description: 'Apply the fact that complementary angles sum to 90° and supplementary angles sum to 180° to solve problems.' },
              { id: 'B7.3.1.1.3', code: 'B7.3.1.1.3', description: 'Use adjacent, supplementary and vertically opposite angles to solve problems.' },
            ],
          },
          {
            id: 'B7.3.1.2', code: 'B7.3.1.2',
            description: 'Demonstrate how to construct a perpendicular to a line from a given point, bisect a line, bisect angles, and construct angles of the following sizes: 30°, 45°, 60°, 75° and 90°.',
            indicators: [
              { id: 'B7.3.1.2.1', code: 'B7.3.1.2.1', description: 'Construct a line segment perpendicular to another line segment.' },
              { id: 'B7.3.1.2.2', code: 'B7.3.1.2.2', description: 'Construct the perpendicular bisector of a line segment.' },
              { id: 'B7.3.1.2.3', code: 'B7.3.1.2.3', description: 'Copy and bisect angles.' },
              { id: 'B7.3.1.2.7', code: 'B7.3.1.2.7', description: 'Describe examples of perpendicular line segments, perpendicular bisectors and angle bisectors in the environment.' },
            ],
          },
        ],
      },
      {
        id: 'ss-3-2', code: '3.2', title: 'Measurement',
        contentStandards: [
          {
            id: 'B7.3.2.1', code: 'B7.3.2.1',
            description: 'Demonstrate the ability to find the perimeter of plane shapes including circles using the concept of pi (π) to find the circumference of a circle.',
            indicators: [
              { id: 'B7.3.2.1.1', code: 'B7.3.2.1.1', description: 'Calculate the perimeter of given shapes whose dimensions are in two units (i.e. cm and mm, m and cm, or km and m).' },
              { id: 'B7.3.2.1.2', code: 'B7.3.2.1.2', description: 'Use the relationships between the diameter and the circumference to deduce the formula for finding the circumference of a circle and use it to solve problems.' },
              { id: 'B7.3.2.1.3', code: 'B7.3.2.1.3', description: 'Draw in a square grid rectangles and triangles with given dimensions.' },
            ],
          },
          {
            id: 'B7.3.2.2', code: 'B7.3.2.2',
            description: 'Derive the formula for determining the area of a triangle and use it to solve problems.',
            indicators: [
              { id: 'B7.3.2.2.1', code: 'B7.3.2.2.1', description: 'Use the relationships between a triangle and a rectangle (or parallelogram) to deduce the formula for determining the area of a triangle.' },
              { id: 'B7.3.2.2.2', code: 'B7.3.2.2.2', description: 'Determine the area of a triangle.' },
            ],
          },
          {
            id: 'B7.3.2.3', code: 'B7.3.2.3',
            description: 'Demonstrate understanding of bearings, vector and its components using real life cases.',
            indicators: [
              { id: 'B7.3.2.3.1', code: 'B7.3.2.3.1', description: 'Describe the bearing of a point from another point.' },
              { id: 'B7.3.2.3.2', code: 'B7.3.2.3.2', description: 'Explain how to find the back bearing when the direction of travel has a bearing which is less than 180° and/or greater than 180°.' },
              { id: 'B7.3.2.3.3', code: 'B7.3.2.3.3', description: 'Distinguish between scalar and vector quantities.' },
              { id: 'B7.3.2.3.4', code: 'B7.3.2.3.4', description: 'Represent vector in the column (component) form and determine its magnitude and direction.' },
              { id: 'B7.3.2.3.5', code: 'B7.3.2.3.5', description: 'Convert vectors in the column (component) form to the Magnitude-Bearing form and vice versa.' },
            ],
          },
        ],
      },
      {
        id: 'ss-3-3', code: '3.3', title: 'Position and Transformation',
        contentStandards: [
          {
            id: 'B7.3.3.1', code: 'B7.3.3.1',
            description: 'Perform a single transformation (i.e. reflection and translation) on a 2D shape using graph paper and describe the properties of the image under the transformation (i.e. congruence, similarity, etc.).',
            indicators: [
              { id: 'B7.3.3.1.1', code: 'B7.3.3.1.1', description: 'Determine shapes in real life that have reflectional (or fold) symmetries.' },
              { id: 'B7.3.3.1.2', code: 'B7.3.3.1.2', description: 'Plot points and shapes (i.e. plane figures) on a coordinate plane and draw their images under reflection in given lines.' },
              { id: 'B7.3.3.1.3', code: 'B7.3.3.1.3', description: 'Plot points and shapes (i.e. plane figures) on a coordinate plane and draw their images under translation by a given vector.' },
              { id: 'B7.3.3.1.4', code: 'B7.3.3.1.4', description: 'Verify the concept of congruent and similar shapes in coordinate plane using properties of both the object(s) and image(s); and in real life situations.' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'strand-4', code: '4', title: 'HANDLING DATA',
    subStrands: [
      {
        id: 'ss-4-1', code: '4.1', title: 'Data',
        contentStandards: [
          {
            id: 'B7.4.1.1', code: 'B7.4.1.1',
            description: 'Select, justify, and use appropriate methods to collect data (quantitative and qualitative), display and analyse the data presented in frequency tables, line graphs, pie graphs, bar graphs or pictographs.',
            indicators: [
              { id: 'B7.4.1.1.1', code: 'B7.4.1.1.1', description: 'Select and justify a method to collect data (quantitative and qualitative) to answer a given question.' },
              { id: 'B7.4.1.1.2', code: 'B7.4.1.1.2', description: 'Design and administer a questionnaire for collecting data to answer questions and record the results.' },
              { id: 'B7.4.1.1.3', code: 'B7.4.1.1.3', description: 'Organise and present data from a survey into a table and/or chart, and analyse it to solve and/or pose problems.' },
            ],
          },
          {
            id: 'B7.4.1.2', code: 'B7.4.1.2',
            description: 'Determine the measures of central tendency (mean, median, mode) for a given ungrouped data and use it to solve problems.',
            indicators: [
              { id: 'B7.4.1.2.1', code: 'B7.4.1.2.1', description: 'Calculate the mean for a given ungrouped data and use it to solve problems.' },
              { id: 'B7.4.1.2.2', code: 'B7.4.1.2.2', description: 'Calculate the median for a given ungrouped data and use it to solve problems.' },
            ],
          },
        ],
      },
      {
        id: 'ss-4-2', code: '4.2', title: 'Chance or Probability',
        contentStandards: [
          {
            id: 'B7.4.2.1', code: 'B7.4.2.1',
            description: 'Identify the sample space for a probability experiment involving single events and express the probabilities of given events as fractions, decimals, percentages and/or ratios to solve problems.',
            indicators: [
              { id: 'B7.4.2.1.1', code: 'B7.4.2.1.1', description: 'Demonstrate understanding of likelihood of a single outcome occurring by providing examples of events that are impossible, possible, or certain from personal contexts.' },
              { id: 'B7.4.2.1.2', code: 'B7.4.2.1.2', description: 'Classify the likelihood of a single outcome occurring in a probability experiment as impossible, possible, or certain.' },
              { id: 'B7.4.2.1.3', code: 'B7.4.2.1.3', description: 'Calculate the probability of the event and express the probability as fractions, decimals, percentages and/or ratios.' },
            ],
          },
        ],
      },
    ],
  },
];

// ── Mathematics B8/B9 from the structured JSON ────────────────────────────────
// Source: src/data/curriculum/nacca_maths_ccp_structured_b8_b9.json
// Per class level ("8" | "9"): { "<CS code>": { description, indicators:
// { code: text }, strand: [number, TITLE], sub: [number, Title] } }

const MATHS_JSON_PATH = path.join(CURRICULUM_DIR, 'nacca_maths_ccp_structured_b8_b9.json');

function buildMathFromJson(levelNumber) {
  const raw = JSON.parse(fs.readFileSync(MATHS_JSON_PATH, 'utf8'))[String(levelNumber)] ?? {};
  const strands = [];
  const strandByNum = new Map();
  const subByKey = new Map();

  for (const [csCode, csData] of Object.entries(raw)) {
    const [strandNum, strandTitle] = csData.strand;
    const [subNum, subTitle] = csData.sub;

    if (!strandByNum.has(strandNum)) {
      strandByNum.set(strandNum, {
        id: `strand-${strandNum}`,
        code: String(strandNum),
        title: strandTitle,
        subStrands: [],
      });
      strands.push(strandByNum.get(strandNum));
    }
    const strand = strandByNum.get(strandNum);

    const subKey = `${strandNum}:${subNum}`;
    if (!subByKey.has(subKey)) {
      subByKey.set(subKey, {
        id: `ss-${strandNum}-${subNum}`,
        code: `${strandNum}.${subNum}`,
        title: subTitle,
        contentStandards: [],
      });
      strand.subStrands.push(subByKey.get(subKey));
    }
    const subStrand = subByKey.get(subKey);

    const indicators = Object.entries(csData.indicators ?? {}).map(([code, description]) => ({
      id: code,
      code,
      description,
    }));
    subStrand.contentStandards.push({
      id: csCode,
      code: csCode,
      description: csData.description,
      indicators,
    });
  }
  return strands;
}

let mathB8 = [];
let mathB9 = [];
try {
  mathB8 = buildMathFromJson(8);
  mathB9 = buildMathFromJson(9);
  console.log(`  ✓  mathematics B8/B9 — ${mathB8.length} / ${mathB9.length} strands from structured JSON`);
} catch (err) {
  console.warn(`  ⚠  Could not parse mathematics B8/B9 JSON: ${err.message}`);
}

if (!parsed.mathematics) parsed.mathematics = {};
parsed.mathematics.B7 = mathB7;
parsed.mathematics.B8 = mathB8;
parsed.mathematics.B9 = mathB9;

// ── Build output ──────────────────────────────────────────────────────────────

// Ensure every subject has all three classes (even if empty)
for (const { id } of SUBJECTS) {
  if (!parsed[id]) parsed[id] = {};
  for (const { id: cls } of CLASSES) {
    if (!parsed[id][cls]) parsed[id][cls] = [];
  }
}

const subjectsJS = JSON.stringify(SUBJECTS, null, 2);
const classesJS = JSON.stringify(CLASSES, null, 2);
const mapJS = JSON.stringify(parsed, null, 2);

const output = `// AUTO-GENERATED by scripts/parse-curriculum.mjs
// Do not edit directly — re-run the script to regenerate.

export const subjects = ${subjectsJS};

export const classes = ${classesJS};

export const curriculumMap = ${mapJS};
`;

fs.writeFileSync(OUTPUT, output, 'utf8');
console.log(`\n✓ Written to ${OUTPUT}`);
console.log(`  Total subjects: ${SUBJECTS.length}`);
