# NaCCA JHS books — Markdown conversions

All 19 PDFs from `uploads/` converted to Markdown: English and Mathematics,
Basic 7–9, covering the Learner's Books (*Print Ready*), Workbooks, Workbook Answer
Books and the Maths B7 Chapter 1 draft.

| Markdown file | Pages | Words | Figures | Source PDF |
| --- | --- | --- | --- | --- |
| `ENGLISH - B7 - PRINT READY.md` | 165 | 71,333 | 0 | `ENGLISH - B7 - PRINT READY.pdf` |
| `ENGLISH - B7 - WORKBOOK ANSWER BOOK.md` | 40 | 10,561 | 0 | `ENGLISH - B7 - WORKBOOK ANSWER BOOK.pdf` |
| `ENGLISH - B7 - WORKBOOK.md` | 145 | 23,345 | 0 | `ENGLISH - B7 - WORKBOOK.pdf` |
| `ENGLISH - B8 - PRINT READY.md` | 152 | 67,281 | 0 | `ENGLISH - B8 - PRINT READY.pdf` |
| `ENGLISH - B8 - WORKBOOK ANSWER BOOK.md` | 38 | 9,110 | 0 | `ENGLISH - B8 - WORKBOOK ANSWER BOOK.pdf` |
| `ENGLISH - B8 - WORKBOOK.md` | 147 | 22,236 | 0 | `ENGLISH - B8 - WORKBOOK.pdf` |
| `ENGLISH - B9 - PRINT READY.md` | 142 | 61,124 | 0 | `ENGLISH - B9 - PRINT READY.pdf` |
| `ENGLISH - B9 - WORKBOOK ANSWER BOOK.md` | 39 | 8,919 | 0 | `ENGLISH - B9 - WORKBOOK ANSWER BOOK.pdf` |
| `ENGLISH - B9 - WORKBOOK.md` | 157 | 22,735 | 0 | `ENGLISH - B9 - WORKBOOK.pdf` |
| `MATHS - B7 - CHAPTER 1 DRAFT v2.md` | 11 | 4,770 | 2 | `MATHS - B7 - CHAPTER 1 DRAFT v2.pdf` |
| `MATHS - B7 - PRINT READY.md` | 150 | 64,178 | 25 | `MATHS - B7 - PRINT READY.pdf` |
| `MATHS - B7 - WORKBOOK ANSWER BOOK.md` | 37 | 10,274 | 0 | `MATHS - B7 - WORKBOOK ANSWER BOOK.pdf` |
| `MATHS - B7 - WORKBOOK.md` | 124 | 21,456 | 0 | `MATHS - B7 - WORKBOOK.pdf` |
| `MATHS - B8 - PRINT READY.md` | 164 | 55,758 | 28 | `MATHS - B8 - PRINT READY.pdf` |
| `MATHS - B8 - WORKBOOK ANSWER BOOK.md` | 33 | 8,253 | 0 | `MATHS - B8 - WORKBOOK ANSWER BOOK.pdf` |
| `MATHS - B8 - WORKBOOK.md` | 116 | 18,354 | 0 | `MATHS - B8 - WORKBOOK.pdf` |
| `MATHS - B9 - PRINT READY.md` | 129 | 56,402 | 17 | `MATHS - B9 - PRINT READY.pdf` |
| `MATHS - B9 - WORKBOOK ANSWER BOOK.md` | 34 | 8,460 | 0 | `MATHS - B9 - WORKBOOK ANSWER BOOK.pdf` |
| `MATHS - B9 - WORKBOOK.md` | 117 | 18,840 | 0 | `MATHS - B9 - WORKBOOK.pdf` |

Figures for the Maths books are in `images/` (72 PNGs, rendered from the PDF at 200 dpi).
`conversion-report.json` holds the same table in machine-readable form.

## Conventions used in every file

- **Page markers** — each original page begins with an invisible `<!-- page N -->`
  comment. Where a paragraph runs across a page break the marker sits inline, in the
  middle of the sentence, so the prose stays joined and the break stays traceable.
- **Boxes become quotes** — the coloured callout boxes (Worked example, Practice,
  Common misconception, Dialogue, Exam tip, Activity, Curriculum alignment, Key words,
  chapter banners such as `Recall` / `Core practice` / `Writing task`) are rendered as
  Markdown blockquotes. The box title is the first bold line inside.
- **Tables** — ruled tables (any number of columns) become pipe tables. Where a table
  continues across a page break, the header row is repeated.
- **Write-in areas** — ruled writing lines are summarised as
  `_[answer space — 5 lines]_`, and large empty answer frames as
  `_[answer space — box]_`. Nothing else of the workbook's writing space is kept.
- **Figures** — extracted as separate PNGs and embedded as
  `![Figure 1.2 — caption](images/…)`, with the printed caption as the alt text.
- **Headings** — book `#` → chapter `###` → numbered section `####` → sub-section
  `#####`, mapped from the printed type sizes; `Contents` entries become bullet lists
  with the printed page number appended (`— 36`).
- **Emphasis** — bold / italic follow the print (including bold key terms inside
  sentences and italic model sentences).

## Fidelity notes

- Text is complete: every file's word count matches the source PDF (differences are
  only Markdown syntax). Per-page word counts were checked page by page — no page
  loses text.
- Symbols that the PDFs set in fallback fonts (`√`, `∪`, `∩`, `′`, `✓`, `✗`) are kept;
  where the PDF emitted such a glyph separately from its sentence, it has been spliced
  back into place.
- The PDFs use the literal `*` character as content in a few places (for example to
  mark incorrect sentences); these are escaped as `\*` so they do not turn into
  emphasis.
- Display formulas that are printed in bold and centred (e.g. `**F = {1, 2, 3, 6, 7, 14, 21, 42}**`)
  are kept as paragraphs, not headings.

## Re-running the conversion

`pdf2md.py` (workspace root) performs the conversion:

```bash
python3 pdf2md.py                 # convert every PDF in uploads/
python3 pdf2md.py "MATHS - B9"    # convert files matching a substring
```

It writes `md/<name>.md`, extracts figures into `md/images/`, and refreshes
`md/conversion-report.json`. Requires `pymupdf`.
