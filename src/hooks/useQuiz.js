import { useMemo } from "react";
import { getQuiz } from "../data/quizzes";
import { getQuestions } from "../data/questions";

export function useQuiz(quizId) {
  return useMemo(() => {
    const quiz = getQuiz(quizId);
    const items = quiz ? getQuestions(quiz.questionIds) : [];
    return { quiz, questions: items };
  }, [quizId]);
}
