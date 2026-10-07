/**
 * teachingMethods.js — the teacher's lesson-plan structures
 *
 * Each method is a fixed sequence of steps. The AI lesson-plan generator
 * produces one section per step (using the step's aiHeading), and lesson
 * notes store the result as `sections: [{ key, label, content }]`.
 *
 * Edit the labels here to change the wording of every future plan.
 */

export const TEACHING_METHODS = {
  // The teacher's standard method for reading subjects.
  'eopt-reading': {
    id: 'eopt-reading',
    label: 'EOPT / Reading method',
    steps: [
      { key: 'eopt', label: 'EOPT or keyword dictation', aiHeading: 'EOPT / DICTATION' },
      { key: 'correction', label: 'Correction of EOPT or dictation', aiHeading: 'CORRECTION OF EOPT / DICTATION' },
      { key: 'objectives', label: 'Lesson objectives', aiHeading: 'LESSON OBJECTIVES' },
      { key: 'media', label: 'Image or video — learners observe', aiHeading: 'IMAGE / VIDEO OBSERVATION' },
      { key: 'reading', label: 'Reading time (teacher-led / guided / group)', aiHeading: 'READING TIME' },
      { key: 'discussion', label: 'Class discussion / demonstration', aiHeading: 'CLASS DISCUSSION / DEMONSTRATION' },
      { key: 'assignment', label: 'Assignment', aiHeading: 'ASSIGNMENT' },
    ],
  },
  // Adaptation for Mathematics: mental drill instead of dictation, and
  // demonstration / guided practice instead of reading time.
  'maths-eopt': {
    id: 'maths-eopt',
    label: 'Mathematics variant',
    steps: [
      { key: 'eopt', label: 'Mental-maths drill', aiHeading: 'MENTAL-MATHS DRILL' },
      { key: 'correction', label: 'Correction of the drill', aiHeading: 'CORRECTION OF THE DRILL' },
      { key: 'objectives', label: 'Lesson objectives', aiHeading: 'LESSON OBJECTIVES' },
      { key: 'media', label: 'Image or diagram — learners observe', aiHeading: 'IMAGE / DIAGRAM OBSERVATION' },
      { key: 'reading', label: 'Demonstration and guided practice', aiHeading: 'DEMONSTRATION AND GUIDED PRACTICE' },
      { key: 'discussion', label: 'Class discussion / problem solving', aiHeading: 'CLASS DISCUSSION / PROBLEM SOLVING' },
      { key: 'assignment', label: 'Assignment', aiHeading: 'ASSIGNMENT' },
    ],
  },
};

export function getMethod(methodId) {
  return TEACHING_METHODS[methodId] ?? TEACHING_METHODS['eopt-reading'];
}

/** Pick the method for a curriculum subject id. */
export function getMethodForSubject(subjectId) {
  return subjectId === 'mathematics' ? TEACHING_METHODS['maths-eopt'] : TEACHING_METHODS['eopt-reading'];
}

/** Map a method plan's steps onto the classic lesson-note fields. */
export function methodSectionsToFields(sections) {
  const byKey = Object.fromEntries((sections ?? []).map(s => [s.key, s.content ?? '']));
  return {
    starter: [byKey.eopt, byKey.correction].filter(Boolean).join('\n\n'),
    mainLearning: [byKey.reading, byKey.discussion].filter(Boolean).join('\n\n'),
    plenary: '',
    evaluation: '',
    homework: byKey.assignment ?? '',
    resourceUrl: byKey.media ?? '',
    resourceType: byKey.media ? 'link' : null,
  };
}
