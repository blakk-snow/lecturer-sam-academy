---
name: planned-work-oct-2026
description: Oct 2026 retooling — ALL DONE (auth fixes, assistant chatbot,
  timetable, research mode, embedded curriculum/sample plans/question bank,
  course-content pipeline + Course Library + 19-book textbook reader).
  Remaining: Science book conversions, notes/questions for B9 + other subjects
metadata:
  type: project
---

The user's Oct 2026 retooling roadmap — all items are BUILT (commits df38eef, 15d48af, c81990c, 75acfb0 on main):

1. **Auth fixes** — shared authError state, redirect-flow errors, mobile account UI.
2. **Greeting chatbot** — floating panel + full page, guided flows (timetable + lesson plan creation), research mode with web citations.
3. **Embedded content** — curriculum complete except Creative Arts (stub sources); 66 BECE science papers as a question bank; 4 sample lesson notes.
4. **Course-content pipeline + Course Library** — `<subject>/<class>/{notes,questions}/<indicator-code>.md` uploads compile to lazy `src/data/courseLibrary/` modules; `/course` is now a curriculum-driven library with per-indicator Notes/Practice/Quiz; legacy Number & Algebra course at `/course/legacy`. Seeded with 197 per-indicator note files converted from the enriched maths/science markdown + 3 example question sets.

5. **Textbook reader (done 2026-10-07, commit 6c6b072)** — 19 NaCCA books (English + Maths, B7–9: Learner's Books, Workbooks, Answer Books + maths draft) converted by the user to markdown under `src/data/courses-data/textbooks-and-references/md/` (figures in `md/images/`, ~8.5 MB). Parse-course-content.mjs splits them into 262 chapters with per-chapter curriculum codes (345 linked); BookReader page browses chapter-by-chapter with figures resolved via a Vite image glob (excluded from PWA precache, runtime-cached). Cross-links: chapter → indicator pages and indicator pages → "Taught in … Chapter N". Science book conversions NOT yet present but auto-ingest when dropped in `md/`.

6. **Teaching-method lesson plans (done 2026-10-07, commit 3b9c0c2)** — the user's 7-step method (EOPT/dictation → correction → objectives → image/video → reading time → discussion/demonstration → assignment, with a mental-maths adaptation for Mathematics that the user approved) is now the app's lesson-plan template: data in `src/data/teachingMethods.js`; AI generation grounded in curriculum text + indicator notes + the textbook chapter teaching the indicator; notes store `methodId` + `sections[]`; "Plan this lesson" buttons on library indicator pages and book chapters deep-link into the chat flow pre-filled; PlannerLesson renders the 7 steps and has a "Generate with method" button.

7. **Download PDF (done 2026-10-07, commit 30ed97e)** — lesson pages get a "Download PDF" button (print-to-PDF, same layout as the overview); `PrintLessonPlan.jsx` + print CSS in `index.css`. Chose print-to-PDF over a PDF library because HTML→PDF libs break on Tailwind v4 colors.

8. **How-To guide (done 2026-10-07, commit 584d35e)** — `/help` page (`src/pages/Help.jsx`) with expandable per-feature sections and entry points from Home (card), desktop nav ("Help"), and Profile (link).

9. **Onboarding + grouped navigation (done 2026-10-07, commit 02342ac)** — first-run `Onboarding.jsx` (Welcome/About/optional sign-in) gated by a Dexie `onboarded` flag; nav regrouped into 4 sections (Teacher/Library/Student/Settings) via `src/components/layout/navGroups.js`, mobile bottom-tab sub-menu sheet + desktop dropdowns.

**Gitignore (done 2026-10-07, commit 8064a5a):** the user chose to gitignore the textbook upstream sources rather than commit them — `src/data/courses-data/textbooks-and-references/*.docx`, `*.xlsx`, and `uploads/` are now ignored. `pdf2md.py` in that folder is already tracked (user's commit 96aaaf4).

**Still open (next steps for the user, told to them 2026-10-07):** (1) drop real notes/questions `.md` files into `src/data/courses-data/<subject>/<class>/{notes,questions}/<indicator-code>.md` and run `npm run parse:course-data` — notes/questions are seeded only for Mathematics + Science B7/B8 (197 notes, 3 question sets); B9 and the other 8 subjects (english, social-studies, computing, rme, career-tech, creative-arts, french, ghanaian-language) are empty. English content is instead covered by the 9 textbooks. Science textbook conversions still to be uploaded. (2) Spot-check the 197 seeded notes — they came from PDF-flattened enriched files, so some worked examples may be jumbled. (3) Decide on the uncommitted curriculum .md files (B7/B8/B9 Curriculum Index/Science/Mathematics) — commit them or wire into parse-curriculum.mjs; Creative Arts sources are stubs (0 strands). (4) For deploy: set OPENROUTER_API_KEY/SITE_URL/SITE_NAME/VITE_FIREBASE_* in Vercel, authorize the prod domain in Firebase → Authentication → Authorized domains. Operational facts: research queries cost ~$0.02 each; the ~300 parser warnings from indicator codes inside mock-paper blueprint sections are benign. `seed:course-notes` re-runs the converter; README was fully rewritten. See [[project-overview]].
