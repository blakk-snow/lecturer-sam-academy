import Dexie from "dexie";

export const db = new Dexie("lecturerSamAcademy");

db.version(1).stores({
  students: "id, name, createdAt, lastActive",
  progress: "[studentId+lessonId], studentId, lessonId, status, lastAccessed",
  attempts: "++id, studentId, questionId, timestamp",
  quizResults: "++id, studentId, quizId, completedAt",
  misconceptions: "[studentId+misconceptionId], studentId, topicId, lastDetected",
  settings: "id",
});

db.version(2).stores({
  // Planner tables
  terms: "++id, name, year, termNumber, startDate, endDate, createdAt",
  classGroups: "++id, termId, classLevel",
  subjects: "++id, classGroupId, name, curriculumSubjectId, curriculumClassId",
  weekPlans: "++id, subjectId, weekNumber, weekType, status, updatedAt",
  weekTopics: "++id, weekPlanId, strandId, subStrandId, contentStandardId",
});

db.version(3).stores({
  lessonNotes: "++id, topicId, day, date, weekNumber, starter, mainLearning, plenary, resourceUrl, resourceType, evaluation, homework, status, updatedAt",
});

db.version(4).stores({
  teacherSchedules: "id, scheduleId, updatedAt",
});

export const LOCAL_STUDENT_ID = "local-student";
