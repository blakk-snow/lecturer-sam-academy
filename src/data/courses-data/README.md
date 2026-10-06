# Course upload conventions

This folder is the landing zone for teacher and student markdown uploads that should map directly to the embedded NaCCA curriculum.

## Recommended structure

Use one file per lesson, unit, topic, or assessment. Keep the file name informative and include the class level so the parser can index it automatically.

Examples:

- `BECE_Mock_Basic7_IntegratedScience_Agricultural_Tools.md`
- `B7_NUMBER_OPERATIONS_Week_3.md`
- `Basic8_English_Language_Adjectives.md`

## Required conventions

1. Start each file with a top-level heading (`# Title`)
2. Include the class level in the filename (Basic 7, Basic 8, Basic 9)
3. Where available, include the exact NaCCA indicator code using a format like `B7.1.2.2.1`
4. Keep a single topic per file so the app can later map it to the correct curriculum strand/sub-strand
5. Prefer plain Markdown with clear sections for objectives, explanation, worked examples, and practice questions

## Suggested markdown format

```md
# Agricultural Tools

## Class
Basic 7

## Curriculum code
B7.1.1.1.1

## Objectives
- Identify common farm tools
- Explain how each tool is used

## Explanation
A simple agricultural tool is one that is operated by hand and needs no engine.

## Worked Example
...

## Practice
1. Which tool is used to clear weeds?
2. Which tool is used to carry farm produce?
```

## Parsing and indexing

A build script (`scripts/parse-course-content.mjs`) scans this folder and generates a searchable index file at `src/data/courseUploads.js` for future app features.

This is intentionally lightweight and upload-friendly: the app can grow from raw markdown files to a richer course library without forcing a rigid database schema up front.
