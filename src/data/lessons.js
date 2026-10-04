export const lessons = [
  {
    id: "u1-s1-l1",
    unitId: "unit-1",
    sectionId: "u1-s1",
    title: "Error versus misconception",
    order: 1,
    objectives: [
      "Identify the difference between an error and a misconception",
      "Give a short example of each",
      "Explain why the difference changes what you do next",
    ],
    sections: [
      {
        type: "think-back",
        title: "Think back",
        prompt:
          "Think of the last time a maths answer of yours was marked wrong. Which description feels closest?",
        options: [
          "I knew the idea, but I rushed or copied a number incorrectly.",
          "I used a rule I believed was true — and that rule was not true.",
          "I am not sure yet. Noticing that uncertainty is a useful start.",
        ],
        note: "Any of these can happen. This lesson helps you tell them apart instead of treating every mistake as the same event.",
      },
      {
        type: "observe",
        title: "Observe",
        component: "classify",
        intro:
          "Read each situation. Decide whether it is mainly an error (including a slip or a broken method) or a misconception (a belief that still feels true).",
        items: [
          {
            id: "obs-1",
            statement:
              "A learner writes 8 × 7 = 54, then immediately says, ‘Wait — that is 56.’",
            answer: "error",
          },
          {
            id: "obs-2",
            statement:
              "A learner insists that 0.25 is larger than 0.8 ‘because 25 is larger than 8’.",
            answer: "misconception",
          },
          {
            id: "obs-3",
            statement:
              "A learner carries 1 instead of 2 when adding 47 + 38, then checks and corrects it.",
            answer: "error",
          },
          {
            id: "obs-4",
            statement:
              "A learner says ‘you cannot subtract a larger number from a smaller number’ and refuses to write −2.",
            answer: "misconception",
          },
        ],
      },
      {
        type: "explanation",
        title: "What is an error?",
        content:
          "An error is a mismatch between the intended mathematics and the result that appeared. It might be a slip (a known fact written wrongly), a misread instruction, or a broken procedure. The key test: if you slow the learner down, do they already have a way to notice and repair it?",
      },
      {
        type: "explanation",
        title: "What is a misconception?",
        content:
          "A misconception is a stable, incorrect idea that the learner still treats as true. It is not random. It often comes from over-generalising a rule that used to work (for example, ‘subtraction makes smaller’ when only counting numbers were in view). Correcting the answer without touching the idea leaves the misconception in place.",
      },
      {
        type: "explanation",
        title: "Why the difference matters",
        content:
          "If you treat a slip as a misconception, you reteach an idea the learner already holds. If you treat a misconception as carelessness, you ask them to ‘try harder’ at a rule that is false. This course tries to name the kind of mix-up so the next step can match it.",
      },
      {
        type: "example",
        title: "Two students, one written answer",
        question: "Both Ama and Kojo write −3 + 5 = −8. Are they making the same kind of mistake?",
        steps: [
          "Ama, when asked to show the move on a number line, starts at −3 and moves five steps right to 2. She says, ‘I added the signs without thinking.’ That is an error she can catch.",
          "Kojo says, ‘Adding a negative and a positive always gives a more negative number, like combining debts.’ He defends −8. That is a misconception about what addition of integers means.",
          "The written answer was identical. The thinking was not. Feedback that only says ‘Wrong — the answer is 2’ helps Ama a little and Kojo almost not at all.",
        ],
      },
      {
        type: "try",
        title: "Try it",
        questionId: "u1-s1-q001",
      },
      {
        type: "practise",
        title: "Practise",
        questionIds: ["u1-s1-q002", "u1-s1-q003"],
      },
      {
        type: "reflect",
        title: "Reflect",
        prompt:
          "In your own words: what is the difference between an error and a misconception? Which one do you think you meet more often?",
      },
    ],
    practice: ["u1-s1-q002", "u1-s1-q003"],
    quizId: null,
  },
  {
    id: "u1-s1-l2",
    unitId: "unit-1",
    sectionId: "u1-s1",
    title: "Types of mathematical error",
    order: 2,
    objectives: [
      "Distinguish slips, procedural errors and conceptual errors",
      "Match a short classroom story to an error type",
      "Choose a repair that fits the type",
    ],
    sections: [
      {
        type: "think-back",
        title: "Think back",
        prompt: "Which of these have you seen (in yourself or in someone else)?",
        options: [
          "Knowing 7 × 8 = 56 but writing 54.",
          "Using a method that looks neat but lines decimals up wrongly.",
          "Holding a rule such as ‘multiplication always makes bigger’.",
        ],
        note: "Those three stories are not the same kind of error. Naming the type is already part of the mathematics.",
      },
      {
        type: "observe",
        title: "Observe",
        component: "classify",
        intro:
          "Here, classify each story as an error (slip or method) or a misconception (a believed false idea). We will split error types more finely in the reading.",
        items: [
          {
            id: "obs-5",
            statement:
              "A learner copies 403 − 178 as 430 − 178, then obtains a fluent but wrong difference.",
            answer: "error",
          },
          {
            id: "obs-6",
            statement:
              "A learner always multiplies to ‘make the number bigger’ and so rejects 0.5 × 8 = 4.",
            answer: "misconception",
          },
          {
            id: "obs-7",
            statement:
              "A learner adds the numerators and the denominators: 1/2 + 1/3 = 2/5.",
            answer: "misconception",
          },
        ],
      },
      {
        type: "explanation",
        title: "Slips",
        content:
          "A slip is a lapse in attention or working memory: a known fact or step goes wrong, and the learner often recognises it when asked to look again. Repair: slow down, estimate, check a known fact, or redo one step.",
      },
      {
        type: "explanation",
        title: "Procedural errors",
        content:
          "A procedural error is a method that is incomplete or wrongly sequenced. The learner may be careful and still be wrong, because the steps themselves are the problem — for example, lining up decimal points from the left. Repair: make the method visible, compare it with a correct model, and practise the corrected steps.",
      },
      {
        type: "explanation",
        title: "Conceptual errors",
        content:
          "A conceptual error comes from a false or incomplete meaning. Adding numerators and denominators often grows from seeing a fraction as two unrelated whole numbers. That sits close to a misconception: the idea feels reasonable until a new model (area, number line, or sharing) challenges it.",
      },
      {
        type: "example",
        title: "Choosing a repair",
        question: "Three wrong answers, three different next steps.",
        steps: [
          "Slip: 7 × 8 = 54. Ask for a neighbouring fact (7 × 8 is 8 less than 7 × 9) rather than a lecture on arrays.",
          "Procedure: decimals aligned from the left. Show place-value columns and ask the learner to place 2.3 and 4.15 so tenths meet tenths.",
          "Concept: ‘multiplication always makes bigger.’ Test 1/2 × 8 with folding paper or a bar model until the old rule no longer covers the cases.",
        ],
      },
      {
        type: "try",
        title: "Try it",
        questionId: "u1-s1-q004",
      },
      {
        type: "practise",
        title: "Practise",
        questionIds: ["u1-s1-q005", "u1-s1-q006"],
      },
      {
        type: "reflect",
        title: "Reflect",
        prompt:
          "Which type of error do you find hardest to notice in your own work: a slip, a broken method, or a false idea? Why?",
      },
    ],
    practice: ["u1-s1-q005", "u1-s1-q006"],
    quizId: null,
  },
  {
    id: "u1-s1-l3",
    unitId: "unit-1",
    sectionId: "u1-s1",
    title: "Diagnosing your thinking",
    order: 3,
    objectives: [
      "Explain how this course uses wrong answers as evidence",
      "Read instructional feedback without treating it as a final label",
      "Retry a question after using the feedback",
    ],
    sections: [
      {
        type: "think-back",
        title: "Think back",
        prompt: "When feedback says only ‘Wrong’, what do you usually do?",
        options: [
          "Guess again until something is marked right.",
          "Stop and try to see what idea might have caused the answer.",
          "Move on and hope the next topic is easier.",
        ],
        note: "This lesson is about the middle path: use the answer as a clue, then try again with a clearer idea.",
      },
      {
        type: "observe",
        title: "Observe",
        component: "classify",
        intro:
          "Classify the teacher’s move as helpful diagnosis (treat as ‘misconception’ if it names a false idea) or as a blunt error mark (treat as ‘error’ if it only rejects the answer).",
        items: [
          {
            id: "obs-8",
            statement:
              "‘Incorrect. The answer is 2.’ No further comment after −3 + 5 = −8.",
            answer: "error",
          },
          {
            id: "obs-9",
            statement:
              "‘Your answer suggests you added the numbers and kept a negative sign. Adding 5 means moving right from −3.’",
            answer: "misconception",
          },
        ],
      },
      {
        type: "explanation",
        title: "Wrong answers as evidence",
        content:
          "A wrong option is not only a miss. It is often a popular mix-up. This app stores those mix-ups as named misconceptions. When your answer matches one, you get a short explanation of the likely idea — not a claim that we have read your mind forever.",
      },
      {
        type: "explanation",
        title: "What the feedback is not",
        content:
          "Feedback here is not a personality test and not a final grade. One attempt can be a slip. Repeated patterns across a topic are more interesting. Mastery on the dashboard is a running picture, not a single tick.",
      },
      {
        type: "example",
        title: "A feedback loop",
        question: "Calculate −3 + 5.",
        steps: [
          "Suppose you answer −8. The system does not stop at ‘Wrong’.",
          "It may say you treated both numbers as negative, and remind you that +5 is a move to the right from −3.",
          "You try again. A later quiz still asks related questions so the idea can be checked when the hint is no longer on the screen.",
        ],
      },
      {
        type: "try",
        title: "Try it",
        questionId: "u1-s1-q007",
      },
      {
        type: "practise",
        title: "Practise",
        questionIds: ["u1-s1-q008", "u1-s1-q009", "u1-s1-q010"],
      },
      {
        type: "reflect",
        title: "Reflect",
        prompt:
          "What will you do next time a question is marked wrong: change the answer at random, or name the idea you used and test it?",
      },
    ],
    practice: ["u1-s1-q008", "u1-s1-q009", "u1-s1-q010"],
    quizId: "quiz-u1-s1",
  },
];

export function getLesson(id) {
  return lessons.find((lesson) => lesson.id === id);
}

export function getLessonsBySection(sectionId) {
  return lessons
    .filter((lesson) => lesson.sectionId === sectionId)
    .sort((a, b) => a.order - b.order);
}

export function getLessonsByUnit(unitId) {
  return lessons
    .filter((lesson) => lesson.unitId === unitId)
    .sort((a, b) => a.order - b.order);
}

export function getAdjacentLessons(lessonId) {
  const lesson = getLesson(lessonId);
  if (!lesson) return { prev: null, next: null };
  const list = getLessonsBySection(lesson.sectionId);
  const index = list.findIndex((item) => item.id === lessonId);
  return {
    prev: list[index - 1] ?? null,
    next: list[index + 1] ?? null,
  };
}
