import { useLiveQuery } from "dexie-react-hooks";
import { db, LOCAL_STUDENT_ID } from "../db/database";
import { lessons } from "../data/lessons";
import { getUnit } from "../data/units";
import { quizzes } from "../data/quizzes";
import { combineMastery } from "../utils/scoring";
import { clampPercentage, masteryStatus } from "../utils/mastery";

export function useProgress(studentId = LOCAL_STUDENT_ID) {
  const progress = useLiveQuery(
    () => db.progress.where("studentId").equals(studentId).toArray(),
    [studentId],
    [],
  );
  const quizResults = useLiveQuery(
    () => db.quizResults.where("studentId").equals(studentId).toArray(),
    [studentId],
    [],
  );

  const byLesson = Object.fromEntries((progress ?? []).map((row) => [row.lessonId, row]));
  const completedCount = (progress ?? []).filter((row) => row.status === "completed").length;
  const coursePercent = clampPercentage((completedCount / Math.max(lessons.length, 1)) * 100);

  const continueRow = [...(progress ?? [])].sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
  const continueLesson = continueRow ? lessons.find((item) => item.id === continueRow.lessonId) : lessons[0];

  const topicMastery = ["u1-s1"].map((sectionId) => {
    const sectionLessons = lessons.filter((item) => item.sectionId === sectionId);
    const scores = sectionLessons.map((item) => byLesson[item.id]?.mastery ?? 0);
    const quiz = quizzes.find((item) => item.sectionId === sectionId);
    const latestQuiz = [...(quizResults ?? [])]
      .filter((item) => item.quizId === quiz?.id)
      .sort((a, b) => b.completedAt - a.completedAt)[0];
    const mastery = combineMastery([
      ...scores,
      latestQuiz?.percentage,
    ].filter((value) => value !== undefined));
    const unit = getUnit(sectionLessons[0]?.unitId);
    const section = unit?.sections.find((item) => item.id === sectionId);
    return {
      sectionId,
      title: section?.title ?? sectionId,
      mastery,
      status: masteryStatus(mastery),
    };
  });

  const recentResults = [...(quizResults ?? [])]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 5)
    .map((item) => {
      const quiz = quizzes.find((entry) => entry.id === item.quizId);
      return { ...item, title: quiz?.title ?? "Quiz" };
    });

  return {
    progress: progress ?? [],
    byLesson,
    coursePercent,
    continueLesson,
    continueRow,
    topicMastery,
    recentResults,
  };
}
