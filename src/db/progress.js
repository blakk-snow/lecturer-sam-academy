import { db, LOCAL_STUDENT_ID } from "./database";
import { combineMastery } from "../utils/scoring";
import { clampPercentage } from "../utils/mastery";
import { getLessonsBySection, lessons } from "../data/lessons";

export async function getStudentProgress(studentId = LOCAL_STUDENT_ID) {
  return db.progress.where("studentId").equals(studentId).toArray();
}

export async function getLessonProgress(lessonId, studentId = LOCAL_STUDENT_ID) {
  return db.progress.get([studentId, lessonId]);
}

export async function touchLesson(lessonId, extra = {}, studentId = LOCAL_STUDENT_ID) {
  const now = Date.now();
  const existing = await db.progress.get([studentId, lessonId]);
  const record = {
    studentId,
    lessonId,
    status: extra.status ?? existing?.status ?? "started",
    percentage: extra.percentage ?? existing?.percentage ?? 0,
    mastery: extra.mastery ?? existing?.mastery ?? 0,
    lastAccessed: now,
    completedAt: extra.completedAt ?? existing?.completedAt ?? null,
    startedAt: existing?.startedAt ?? now,
  };
  await db.progress.put(record);
  await db.students.update(studentId, { lastActive: now });
  return record;
}

export async function completeLesson(lessonId, percentage, studentId = LOCAL_STUDENT_ID) {
  const score = clampPercentage(percentage);
  return touchLesson(
    lessonId,
    {
      status: "completed",
      percentage: score,
      mastery: score,
      completedAt: Date.now(),
    },
    studentId,
  );
}

export async function sectionMastery(sectionId, studentId = LOCAL_STUDENT_ID) {
  const sectionLessons = getLessonsBySection(sectionId);
  const rows = await getStudentProgress(studentId);
  const scores = sectionLessons.map((lesson) => {
    const row = rows.find((item) => item.lessonId === lesson.id);
    return row?.mastery ?? 0;
  });
  return combineMastery(scores);
}

export async function courseCompletion(studentId = LOCAL_STUDENT_ID) {
  const rows = await getStudentProgress(studentId);
  const completed = rows.filter((row) => row.status === "completed").length;
  const total = Math.max(lessons.length, 1);
  return clampPercentage((completed / total) * 100);
}

export async function lastAccessedLesson(studentId = LOCAL_STUDENT_ID) {
  const rows = await getStudentProgress(studentId);
  if (!rows.length) return null;
  return rows.sort((a, b) => b.lastAccessed - a.lastAccessed)[0];
}
