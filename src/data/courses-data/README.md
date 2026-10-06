# Course upload conventions

This folder is the landing zone for teacher and student markdown uploads that map directly to the embedded NaCCA curriculum. One parser (`scripts/parse-course-content.mjs`) handles everything and generates:

- `src/data/courseUploads.js` — metadata index of every `.md` file
- `src/data/courseLibrary/` — content modules (notes + questions per indicator), lazy-loaded by the Course Library UI

The `curriculum` subfolder is excluded (the curriculum is already embedded in `curriculumData.js`).

## Lesson notes — one file per indicator

Put a file at `<subject>/<class>/notes/<indicator-code>.md`. The **filename is the NaCCA indicator code** — that is what links the note to the curriculum.

```
src/data/courses-data/mathematics/B7/notes/B7.1.2.2.1.md
src/data/courses-data/science/B8/notes/B8.1.2.2.2.md
```

Format:

```md
---
title: Add and subtract up to four-digit numbers
---

# Add and subtract up to four-digit numbers

## Objectives
- Add numbers up to four digits
- Subtract numbers up to four digits
- Solve real-life word problems

## Explanation
Free markdown prose. Explain the concept the way you would teach it.

## Worked Example
Work through one or two examples step by step.

## Practice
Optional practice pointers or extension tasks.
```

- `title` frontmatter is required; `subject`/`class` are optional (the folders define them).
- `## Objectives` becomes a bullet list; `## Explanation` and `## Worked Example` are rendered as markdown.
- The code must exist in the embedded curriculum — the checker reports it as an error otherwise.

## Practice questions — one file per indicator

Put a file at `<subject>/<class>/questions/<indicator-code>.md`:

```
src/data/courses-data/mathematics/B7/questions/B7.1.2.2.md
```

```md
---
title: Four-digit operations practice
---

### Q1
type: mcq
question: What is 3,426 + 2,315?
- [ ] 5,731
- [x] 5,741
- [ ] 5,840
- [ ] 6,741
explanation: Add the thousands first, then the hundreds, tens and units.
difficulty: easy

### Q2
type: trueFalse
question: 8,205 − 3,417 = 4,788
- [x] True
- [ ] False
explanation: 8,205 − 3,417 = 4,788.
difficulty: easy

### Q3
type: fillBlank
question: 1,536 divided by 12 is ____
answer: 128
accepted: one hundred and twenty eight
explanation: 12 × 128 = 1,536.
difficulty: medium
```

Rules:

- `type` is `mcq`, `trueFalse`, or `fillBlank`.
- **mcq**: options are `- [ ] …` / `- [x] …` lines — exactly one `[x]` marks the answer.
- **trueFalse**: check one of `- [x] True` / `- [x] False` (or use `answer: true`).
- **fillBlank**: `answer:` is the expected text; `accepted:` lists alternative answers separated by commas.
- Missing question text, a wrong number of checked options, or an unknown type is reported as an error with the file name and question number.

## Legacy packs (mock papers etc.)

Any `.md` file outside a `notes/` or `questions/` folder (for example the BECE mock packs in `complete-science-questions/`) is indexed as metadata only, exactly as before. Keep the class level in the filename (`BECE_Mock_Basic8_…`) — the checker now errors if the filename's class disagrees with the indexed class.

## Commands

- `npm run parse:course-data` — refresh `courseUploads.js` and the `courseLibrary/` modules
- `npm run check:course-data` — validate everything against the embedded NaCCA curriculum (also writes the output)

Files are safe to re-parse any time; ids are derived from filenames, so renaming a file changes its id.
