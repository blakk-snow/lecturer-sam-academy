export const quizzes = [
  {
    id: "quiz-u1-s1",
    sectionId: "u1-s1",
    unitId: "unit-1",
    title: "Section 1 mastery check",
    questionIds: [
      "u1-s1-q002",
      "u1-s1-q004",
      "u1-s1-q006",
      "u1-s1-q007",
      "u1-s1-q009",
      "u1-s1-q010",
    ],
  },
];

export function getQuiz(id) {
  return quizzes.find((quiz) => quiz.id === id);
}
