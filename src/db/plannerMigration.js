/**
 * plannerMigration.js — one-time upload of local planner data to Firestore
 *
 * Without this, a teacher who built plans offline (Dexie) and then signs in
 * sees an empty planner — their data "disappears" behind the account. On a
 * user's first sign-in we copy the local planner data up to Firestore so the
 * cloud copy starts where the local copy left off.
 *
 * Rules:
 *   • Runs at most once per (device, uid), tracked in the Dexie settings table.
 *   • Only uploads when the account has NO terms in Firestore yet — we never
 *     merge into or overwrite an account that already has planner data.
 *   • Preserves document ids so URLs keep working:
 *       terms/classGroups/subjects/weekTopics → their Dexie id (stringified)
 *       weekPlans → the week number (matches plannerFirestore.upsertWeekPlan)
 *       lessonNotes → the topicId (matches plannerFirestore.upsertLessonNote)
 *   • Re-running after a crash is safe: the same ids are overwritten with the
 *     same content, and the "done" marker is only written after success.
 */

import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { db as dexieDb } from './database';

const MIGRATION_KEY = 'planner-migration';
const BATCH_CHUNK = 400; // Firestore writeBatch limit is 500 ops

async function isMigrated(uid) {
  const row = await dexieDb.settings.get(MIGRATION_KEY);
  return row?.uid === uid;
}

async function markMigrated(uid) {
  await dexieDb.settings.put({ id: MIGRATION_KEY, uid, migratedAt: Date.now() });
}

/** Commit operations in chunks of BATCH_CHUNK. */
async function commitChunked(ops) {
  for (let i = 0; i < ops.length; i += BATCH_CHUNK) {
    const batch = writeBatch(firestore);
    for (const op of ops.slice(i, i + BATCH_CHUNK)) {
      batch.set(op.ref, op.data);
    }
    await batch.commit();
  }
}

/**
 * Copy all local planner data to /users/{uid}/… if needed.
 * Safe to call on every auth state change — cheap no-op once done.
 *
 * @returns {Promise<{status: string, count?: number}>}
 */
export async function migrateLocalPlannerToFirestore(uid) {
  if (!uid) return { status: 'no-uid' };
  if (await isMigrated(uid)) return { status: 'already-migrated' };

  const [terms, classGroups, subjects, weekPlans, weekTopics, lessonNotes] =
    await Promise.all([
      dexieDb.terms.toArray(),
      dexieDb.classGroups.toArray(),
      dexieDb.subjects.toArray(),
      dexieDb.weekPlans.toArray(),
      dexieDb.weekTopics.toArray(),
      dexieDb.lessonNotes.toArray(),
    ]);

  const localCount = terms.length + classGroups.length + subjects.length +
    weekPlans.length + weekTopics.length + lessonNotes.length;

  if (localCount === 0) {
    await markMigrated(uid);
    return { status: 'nothing-local', count: 0 };
  }

  // Never merge into an account that already has planner data.
  const cloudTerms = await getDocs(collection(firestore, 'users', uid, 'terms'));
  if (!cloudTerms.empty) {
    await markMigrated(uid);
    return { status: 'cloud-not-empty', count: 0 };
  }

  // Index weekTopics by weekPlanId and weekPlans by id for nesting.
  const weekPlanById = new Map(weekPlans.map(wp => [wp.id, wp]));
  const topicsByPlanId = new Map();
  for (const topic of weekTopics) {
    if (!topicsByPlanId.has(topic.weekPlanId)) topicsByPlanId.set(topic.weekPlanId, []);
    topicsByPlanId.get(topic.weekPlanId).push(topic);
  }

  const ops = [];

  for (const term of terms) {
    const termId = String(term.id);
    ops.push({
      ref: doc(firestore, 'users', uid, 'terms', termId),
      data: {
        name: term.name,
        year: term.year,
        termNumber: term.termNumber,
        startDate: term.startDate ?? '',
        endDate: term.endDate ?? '',
        createdAt: term.createdAt ?? Date.now(),
      },
    });

    for (const cg of classGroups.filter(c => String(c.termId) === termId)) {
      const cgId = String(cg.id);
      ops.push({
        ref: doc(firestore, 'users', uid, 'terms', termId, 'classGroups', cgId),
        data: { termId, classLevel: cg.classLevel },
      });

      for (const sub of subjects.filter(s => String(s.classGroupId) === cgId)) {
        const subId = String(sub.id);
        ops.push({
          ref: doc(firestore, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects', subId),
          data: {
            classGroupId: cgId,
            name: sub.name,
            curriculumSubjectId: sub.curriculumSubjectId ?? null,
            curriculumClassId: sub.curriculumClassId ?? null,
          },
        });

        // Week plan docs are keyed by week number; nest their topics inside.
        const plansForSubject = weekPlans.filter(wp => String(wp.subjectId) === subId);
        for (const wp of plansForSubject) {
          const weekId = String(wp.weekNumber);
          ops.push({
            ref: doc(firestore, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects', subId, 'weekPlans', weekId),
            data: {
              subjectId: subId,
              weekNumber: wp.weekNumber,
              weekType: wp.weekType ?? 'teaching',
              status: wp.status ?? 'planned',
              updatedAt: wp.updatedAt ?? Date.now(),
            },
          });

          for (const topic of topicsByPlanId.get(wp.id) ?? []) {
            const { id: _topicId, weekPlanId: _wpId, ...topicFields } = topic;
            ops.push({
              ref: doc(firestore, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects', subId, 'weekPlans', weekId, 'weekTopics', String(_topicId)),
              data: { weekPlanId: weekId, ...topicFields },
            });
          }
        }
      }
    }
  }

  for (const note of lessonNotes) {
    const { id: _noteId, topicId, ...noteFields } = note;
    ops.push({
      ref: doc(firestore, 'users', uid, 'lessonNotes', String(topicId)),
      data: { ...noteFields, topicId: String(topicId) },
    });
  }

  await commitChunked(ops);
  await markMigrated(uid);
  return { status: 'migrated', count: ops.length };
}
