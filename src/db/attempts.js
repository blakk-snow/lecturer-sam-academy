import { db, LOCAL_STUDENT_ID } from "./database";

export async function recordAttempt({
  questionId,
  answer,
  correct,
  score,
  misconceptionId,
  topicId,
  studentId = LOCAL_STUDENT_ID,
}) {
  const timestamp = Date.now();
  await db.attempts.add({
    studentId,
    questionId,
    answer: String(answer),
    correct,
    score,
    timestamp,
  });

  if (!correct && misconceptionId) {
    const key = [studentId, misconceptionId];
    const existing = await db.misconceptions.get(key);
    await db.misconceptions.put({
      studentId,
      misconceptionId,
      topicId: topicId ?? existing?.topicId ?? null,
      frequency: (existing?.frequency ?? 0) + 1,
      lastDetected: timestamp,
    });
  }
}

export async function recentQuizResults(limit = 5, studentId = LOCAL_STUDENT_ID) {
  return db.quizResults
    .where("studentId")
    .equals(studentId)
    .reverse()
    .sortBy("completedAt")
    .then((rows) => rows.slice(-limit).reverse());
}

export async function saveQuizResult({
  quizId,
  score,
  percentage,
  studentId = LOCAL_STUDENT_ID,
}) {
  const id = await db.quizResults.add({
    studentId,
    quizId,
    score,
    percentage,
    completedAt: Date.now(),
  });
  return id;
}
