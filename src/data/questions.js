export const questions = [
  {
    id: "u1-s1-q001",
    type: "mcq",
    topicId: "u1-s1",
    question:
      "A student writes 9 × 6 = 56, pauses, and changes it to 54. What is the best description?",
    options: [
      { id: "a", text: "A misconception about multiplication" },
      { id: "b", text: "An error — likely a slip they could catch" },
      { id: "c", text: "Proof that they know no multiplication facts" },
    ],
    answer: "b",
    explanation:
      "They already hold the correct fact and notice the mismatch. That is an error (a slip), not a stable false belief about multiplication.",
    difficulty: "easy",
    misconceptions: {
      a: "error-is-misconception",
      c: "all-mistakes-are-ignorance",
    },
  },
  {
    id: "u1-s1-q002",
    type: "trueFalse",
    topicId: "u1-s1",
    question:
      "True or false: If a learner believes that ‘subtraction always makes a number smaller’, that is a misconception rather than a slip.",
    answer: true,
    explanation:
      "That is a stable, incorrect idea about what subtraction means. It will keep producing wrong answers until the idea itself is rebuilt.",
    difficulty: "easy",
    misconceptions: {
      false: "misconception-is-careless",
    },
  },
  {
    id: "u1-s1-q003",
    type: "mcq",
    topicId: "u1-s1",
    question: "Why does this course separate errors from misconceptions?",
    options: [
      { id: "a", text: "So every wrong answer can be marked with the same comment" },
      { id: "b", text: "Because the helpful next step is different in each case" },
      { id: "c", text: "Because slips mean the learner should restart the whole topic" },
    ],
    answer: "b",
    explanation:
      "A slip needs checking and attention. A misconception needs a new way of seeing the idea. Treating them the same often leaves the real problem untouched.",
    difficulty: "easy",
    misconceptions: {
      a: "feedback-is-only-a-tick",
      c: "slips-need-reteaching",
    },
  },
  {
    id: "u1-s1-q004",
    type: "mcq",
    topicId: "u1-s1",
    question:
      "A learner always lines up decimals from the left (treating 2.3 + 4.15 like 23 + 415). This is mainly:",
    options: [
      { id: "a", text: "A slip caused by writing too quickly" },
      { id: "b", text: "A procedural error — a broken method for place value" },
      { id: "c", text: "Proof they have never seen a decimal" },
    ],
    answer: "b",
    explanation:
      "They are following a method, but the method is wrong. That is a procedural error. It may also rest on a conceptual gap about place value, which later lessons will address.",
    difficulty: "medium",
    misconceptions: {
      a: "misconception-is-careless",
      c: "all-mistakes-are-ignorance",
    },
  },
  {
    id: "u1-s1-q005",
    type: "mcq",
    topicId: "u1-s1",
    question: "Which response best repairs a slip such as 7 × 8 = 54?",
    options: [
      { id: "a", text: "Reteach the meaning of multiplication from the start" },
      { id: "b", text: "Ask the learner to check the fact and notice the mismatch" },
      { id: "c", text: "Mark it wrong and move on with no comment" },
    ],
    answer: "b",
    explanation:
      "If the fact is known, the useful move is to slow down and check. Full reteaching is for when the idea itself is missing or false.",
    difficulty: "easy",
    misconceptions: {
      a: "slips-need-reteaching",
      c: "feedback-is-only-a-tick",
    },
  },
  {
    id: "u1-s1-q006",
    type: "trueFalse",
    topicId: "u1-s1",
    question:
      "True or false: A conceptual error and a procedural error should always be treated as the same kind of problem.",
    answer: false,
    explanation:
      "A broken method and a broken meaning need different repairs. Practising the same steps will not fix an idea that is false.",
    difficulty: "medium",
    misconceptions: {
      true: "procedural-equals-conceptual",
    },
  },
  {
    id: "u1-s1-q007",
    type: "mcq",
    topicId: "u1-s1",
    question:
      "This app maps some wrong answers to named misconceptions. What is that for?",
    options: [
      { id: "a", text: "To replace a tick/cross with a guess about your thinking" },
      { id: "b", text: "To explain what the answer may be revealing, then invite another try" },
      { id: "c", text: "To decide after one question that you have failed the topic" },
    ],
    answer: "b",
    explanation:
      "The aim is instructional: name a likely mix-up, explain it, and let you try again. One answer is evidence, not a final label.",
    difficulty: "medium",
    misconceptions: {
      a: "feedback-is-only-a-tick",
      c: "one-wrong-means-mastered-nothing",
    },
  },
  {
    id: "u1-s1-q008",
    type: "numeric",
    topicId: "u1-s1",
    question:
      "A quiz has 10 questions. A student answers 7 correctly. What percentage score is that?",
    answer: 70,
    explanation:
      "7 out of 10 is 70%. In this course, 70% sits in the ‘Secure’ band — useful, but not yet ‘Mastered’.",
    difficulty: "easy",
    misconceptions: {
      7: "feedback-is-only-a-tick",
    },
  },
  {
    id: "u1-s1-q009",
    type: "fillBlank",
    topicId: "u1-s1",
    question:
      "A stable, incorrect belief about a mathematical idea is called a ________.",
    answer: "misconception",
    accepted: ["misconception", "misconceptions"],
    explanation:
      "A misconception is a belief the learner still thinks is true. An error can be a slip, a broken method, or a conceptual mix-up.",
    difficulty: "easy",
    misconceptions: {
      error: "error-is-misconception",
      slip: "error-is-misconception",
      mistake: "error-is-misconception",
    },
  },
  {
    id: "u1-s1-q010",
    type: "mcq",
    topicId: "u1-s1",
    question: "Which statement is the most accurate?",
    options: [
      { id: "a", text: "Finishing a lesson always means the idea is mastered" },
      { id: "b", text: "Mastery is a pattern of understanding over attempts, not completion alone" },
      { id: "c", text: "If you get one question wrong, start the unit again from zero" },
    ],
    answer: "b",
    explanation:
      "This course tracks mastery separately from completion. You can finish a page and still need more practice on the idea.",
    difficulty: "easy",
    misconceptions: {
      a: "one-wrong-means-mastered-nothing",
      c: "one-wrong-means-mastered-nothing",
    },
  },
];

export function getQuestion(id) {
  return questions.find((question) => question.id === id);
}

export function getQuestions(ids) {
  return ids.map((id) => getQuestion(id)).filter(Boolean);
}
