import { db } from "./database";

// Planner ids arrive from URL params as strings, while Dexie auto-increment
// keys are numbers. Normalize on write and match both spellings on read, so
// rows written before this fix stay visible.
const toNum = (value) => Number(value);
const idKeys = (value) => {
  const keys = [Number(value), String(value)];
  return keys.filter((key, index) => keys.indexOf(key) === index);
};

// ─── Terms ────────────────────────────────────────────────────────────────────

export async function createTerm(data) {
  return db.terms.add({
    name: data.name,
    year: data.year,
    termNumber: data.termNumber,
    startDate: data.startDate,
    endDate: data.endDate,
    createdAt: Date.now(),
  });
}

export async function updateTerm(id, changes) {
  return db.terms.update(toNum(id), changes);
}

export async function deleteTerm(id) {
  // Cascade: classGroups → subjects → weekPlans → weekTopics
  const termNum = toNum(id);
  const classGroups = await db.classGroups.where("termId").anyOf(idKeys(termNum)).toArray();
  for (const cg of classGroups) {
    await removeClassGroup(cg.id);
  }
  return db.terms.delete(termNum);
}

export async function getTerms() {
  return db.terms.orderBy("createdAt").reverse().toArray();
}

// ─── Class Groups ─────────────────────────────────────────────────────────────

export async function addClassGroup(termId, classLevel) {
  return db.classGroups.add({ termId: toNum(termId), classLevel });
}

export async function removeClassGroup(id) {
  // Cascade: subjects → weekPlans → weekTopics
  const cgNum = toNum(id);
  const subjects = await db.subjects.where("classGroupId").anyOf(idKeys(cgNum)).toArray();
  for (const subject of subjects) {
    await removeSubject(subject.id);
  }
  return db.classGroups.delete(cgNum);
}

export async function getClassGroups(termId) {
  return db.classGroups.where("termId").anyOf(idKeys(termId)).toArray();
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export async function addSubject(classGroupId, name, curriculumSubjectId, curriculumClassId) {
  return db.subjects.add({
    classGroupId: toNum(classGroupId),
    name,
    curriculumSubjectId: curriculumSubjectId || null,
    curriculumClassId: curriculumClassId || null,
  });
}

export async function updateSubject(id, changes) {
  return db.subjects.update(toNum(id), changes);
}

export async function removeSubject(id) {
  // Cascade: weekPlans → weekTopics
  const subNum = toNum(id);
  const weekPlans = await db.weekPlans.where("subjectId").anyOf(idKeys(subNum)).toArray();
  for (const wp of weekPlans) {
    await db.weekTopics.where("weekPlanId").anyOf(idKeys(wp.id)).delete();
  }
  await db.weekPlans.where("subjectId").anyOf(idKeys(subNum)).delete();
  return db.subjects.delete(subNum);
}

export async function getSubjects(classGroupId) {
  return db.subjects.where("classGroupId").anyOf(idKeys(classGroupId)).toArray();
}

// ─── Week Plans ───────────────────────────────────────────────────────────────

export async function upsertWeekPlan(subjectId, weekNumber, fields, expectedRevision) {
  const subjectNum = toNum(subjectId);
  const weekNum = toNum(weekNumber);
  return db.transaction('rw', db.weekPlans, async () => {
    const existing = await db.weekPlans
      .where("subjectId")
      .anyOf(idKeys(subjectId))
      .filter((wp) => wp.weekNumber === weekNum)
      .first();

    if (expectedRevision !== undefined && (existing?.revision ?? null) !== expectedRevision) {
      const error = new Error('This week plan changed elsewhere. Refresh it before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = existing ?? null;
      throw error;
    }

    const updated = {
      ...fields,
      revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      updatedAt: Date.now(),
    };
    if (existing) {
      await db.weekPlans.update(existing.id, updated);
      return existing.id;
    }
    return db.weekPlans.add({ subjectId: subjectNum, weekNumber: weekNum, ...updated });
  });
}

export async function getWeekPlans(subjectId) {
  return db.weekPlans.where("subjectId").anyOf(idKeys(subjectId)).toArray();
}

// ─── Week Topics ──────────────────────────────────────────────────────────────

export async function addWeekTopic(weekPlanId, topicData) {
  return db.weekTopics.add({
    weekPlanId: toNum(weekPlanId),
    ...topicData,
    revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });
}

export async function updateWeekTopic(id, changes, expectedRevision) {
  const topicNum = toNum(id);
  return db.transaction('rw', db.weekTopics, async () => {
    const current = await db.weekTopics.get(topicNum);
    if (expectedRevision !== undefined && (current?.revision ?? null) !== expectedRevision) {
      const error = new Error('This topic changed elsewhere. Refresh it before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = current ?? null;
      throw error;
    }
    return db.weekTopics.update(topicNum, {
      ...changes,
      revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  });
}

export async function removeWeekTopic(id) {
  return db.weekTopics.delete(toNum(id));
}

export async function getWeekTopics(weekPlanId) {
  return db.weekTopics.where("weekPlanId").anyOf(idKeys(weekPlanId)).toArray();
}

// ─── Lesson Notes ─────────────────────────────────────────────────────────────

// topicId arrives from the URL as a string; the read hook (useLessonNote)
// queries by Number(topicId), so normalize here or notes save but never reload.
const numericTopicId = (topicId) => Number(topicId);

export async function upsertLessonNote(topicId, data, expectedRevision) {
  const topicNum = numericTopicId(topicId);
  return db.transaction('rw', db.lessonNotes, async () => {
    const existing = await db.lessonNotes.where('topicId').equals(topicNum).first();
    if (expectedRevision !== undefined && (existing?.revision ?? null) !== expectedRevision) {
      const error = new Error('This lesson note changed elsewhere. Review the latest version before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = existing ?? null;
      throw error;
    }

    const updated = {
      ...data,
      topicId: topicNum,
      revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      updatedAt: Date.now(),
    };
    if (existing) {
      await db.lessonNotes.update(existing.id, updated);
      return { ...existing, ...updated };
    }
    const id = await db.lessonNotes.add(updated);
    return { id, ...updated };
  });
}

export async function getLessonNote(topicId) {
  return db.lessonNotes.where('topicId').equals(numericTopicId(topicId)).first();
}
