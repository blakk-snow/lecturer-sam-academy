import { db } from "./database";

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
  return db.terms.update(id, changes);
}

export async function deleteTerm(id) {
  // Cascade: classGroups → subjects → weekPlans → weekTopics
  const classGroups = await db.classGroups.where("termId").equals(id).toArray();
  for (const cg of classGroups) {
    await removeClassGroup(cg.id);
  }
  return db.terms.delete(id);
}

export async function getTerms() {
  return db.terms.orderBy("createdAt").reverse().toArray();
}

// ─── Class Groups ─────────────────────────────────────────────────────────────

export async function addClassGroup(termId, classLevel) {
  return db.classGroups.add({ termId, classLevel });
}

export async function removeClassGroup(id) {
  // Cascade: subjects → weekPlans → weekTopics
  const subjects = await db.subjects.where("classGroupId").equals(id).toArray();
  for (const subject of subjects) {
    await removeSubject(subject.id);
  }
  return db.classGroups.delete(id);
}

export async function getClassGroups(termId) {
  return db.classGroups.where("termId").equals(termId).toArray();
}

// ─── Subjects ─────────────────────────────────────────────────────────────────

export async function addSubject(classGroupId, name, curriculumSubjectId, curriculumClassId) {
  return db.subjects.add({
    classGroupId,
    name,
    curriculumSubjectId: curriculumSubjectId || null,
    curriculumClassId: curriculumClassId || null,
  });
}

export async function updateSubject(id, changes) {
  return db.subjects.update(id, changes);
}

export async function removeSubject(id) {
  // Cascade: weekPlans → weekTopics
  const weekPlans = await db.weekPlans.where("subjectId").equals(id).toArray();
  for (const wp of weekPlans) {
    await db.weekTopics.where("weekPlanId").equals(wp.id).delete();
  }
  await db.weekPlans.where("subjectId").equals(id).delete();
  return db.subjects.delete(id);
}

export async function getSubjects(classGroupId) {
  return db.subjects.where("classGroupId").equals(classGroupId).toArray();
}

// ─── Week Plans ───────────────────────────────────────────────────────────────

export async function upsertWeekPlan(subjectId, weekNumber, fields, expectedRevision) {
  return db.transaction('rw', db.weekPlans, async () => {
    const existing = await db.weekPlans
      .where("subjectId")
      .equals(subjectId)
      .filter((wp) => wp.weekNumber === weekNumber)
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
    return db.weekPlans.add({ subjectId, weekNumber, ...updated });
  });
}

export async function getWeekPlans(subjectId) {
  return db.weekPlans.where("subjectId").equals(subjectId).toArray();
}

// ─── Week Topics ──────────────────────────────────────────────────────────────

export async function addWeekTopic(weekPlanId, topicData) {
  return db.weekTopics.add({
    weekPlanId,
    ...topicData,
    revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });
}

export async function updateWeekTopic(id, changes, expectedRevision) {
  return db.transaction('rw', db.weekTopics, async () => {
    const current = await db.weekTopics.get(id);
    if (expectedRevision !== undefined && (current?.revision ?? null) !== expectedRevision) {
      const error = new Error('This topic changed elsewhere. Refresh it before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = current ?? null;
      throw error;
    }
    return db.weekTopics.update(id, {
      ...changes,
      revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  });
}

export async function removeWeekTopic(id) {
  return db.weekTopics.delete(id);
}

export async function getWeekTopics(weekPlanId) {
  return db.weekTopics.where("weekPlanId").equals(weekPlanId).toArray();
}

// ─── Lesson Notes ─────────────────────────────────────────────────────────────

export async function upsertLessonNote(topicId, data, expectedRevision) {
  return db.transaction('rw', db.lessonNotes, async () => {
    const existing = await db.lessonNotes.where('topicId').equals(topicId).first();
    if (expectedRevision !== undefined && (existing?.revision ?? null) !== expectedRevision) {
      const error = new Error('This lesson note changed elsewhere. Review the latest version before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = existing ?? null;
      throw error;
    }

    const updated = {
      ...data,
      topicId,
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
  return db.lessonNotes.where('topicId').equals(topicId).first();
}
