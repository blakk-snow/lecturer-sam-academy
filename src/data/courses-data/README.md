# Course upload conventions

This folder is the landing zone for teacher and student markdown uploads that should map directly to the embedded NaCCA curriculum.

## Recommended structure

Use one file per lesson, unit, topic, or assessment. Keep the file name informative and include the class level so the parser can index it automatically.

Examples:

- `BECE_Mock_Basic7_IntegratedScience_Agricultural_Tools.md`
- `B7_NUMBER_OPERATIONS_Week_3.md`
- `Basic8_English_Language_Adjectives.md`

For new uploads, use frontmatter with a title, class, subject, and exact NaCCA indicator code(s). Keep the class level in the filename too, which makes files easy to identify outside the app.

```md
---
title: Agricultural Tools
class: Basic 7
subject: Integrated Science
indicators: B7.1.2.2.1
---

# Agricultural Tools

## Objectives
- Identify common farm tools
- Explain how each tool is used

## Explanation
A simple agricultural tool is one that is operated by hand and needs no engine.

## Practice
1. Which tool is used to clear weeds?
2. Which tool is used to carry farm produce?
```

The parser scans markdown packs in this folder and generates `src/data/courseUploads.js`; the `curriculum` subfolder is excluded because the curriculum is already embedded separately. Run `npm run parse:course-data` to refresh the index, or `npm run check:course-data` to validate uploads against the embedded NaCCA curriculum. It reports unmatched codes inferred from legacy papers as warnings; explicitly declared frontmatter codes must match an embedded standard or indicator.
