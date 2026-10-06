/**
 * plannerFirestore.js — Firestore implementation of the planner data layer
 *
 * Data shape under Firestore:
 *
 *   /users/{uid}/terms/{termId}
 *   /users/{uid}/terms/{termId}/classGroups/{cgId}
 *   /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subjectId}
 *   /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subjectId}/weekPlans/{wpId}
 *   /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subjectId}/weekPlans/{wpId}/weekTopics/{topicId}
 *   /users/{uid}/lessonNotes/{topicId}   ← keyed by topicId string for fast lookup
 *
 * All functions accept a `uid` (Firebase user.uid) as their first argument so
 * they are pure and testable without a React context.
 */

import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy, serverTimestamp,
  writeBatch, runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Path helpers ──────────────────────────────────────────────────────────────

const userRef  = (uid)                          => doc(db, 'users', uid);
const termsCol = (uid)                          => collection(db, 'users', uid, 'terms');
const termRef  = (uid, termId)                  => doc(db, 'users', uid, 'terms', termId);
const cgCol    = (uid, termId)                  => collection(db, 'users', uid, 'terms', termId, 'classGroups');
const cgRef    = (uid, termId, cgId)            => doc(db, 'users', uid, 'terms', termId, 'classGroups', cgId);
const subCol   = (uid, termId, cgId)            => collection(db, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects');
const subRef   = (uid, termId, cgId, subId)     => doc(db, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects', subId);
const wpCol    = (uid, termId, cgId, subId)     => collection(db, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects', subId, 'weekPlans');
const wpRef    = (uid, termId, cgId, subId, wId)=> doc(db, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects', subId, 'weekPlans', wId);
const topCol   = (uid, termId, cgId, subId, wId)=> collection(db, 'users', uid, 'terms', termId, 'classGroups', cgId, 'subjects', subId, 'weekPlans', wId, 'weekTopics');
const notesCol = (uid)                          => collection(db, 'users', uid, 'lessonNotes');

/** Convert a Firestore doc snapshot to a plain object with an `id` field. */
function snap(doc) {
  return doc.exists() ? { id: doc.id, ...doc.data() } : null;
}
function snapAll(querySnapshot) {
  return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Terms ─────────────────────────────────────────────────────────────────────

export async function createTerm(uid, data) {
  const ref = await addDoc(termsCol(uid), {
    name: data.name,
    year: data.year,
    termNumber: data.termNumber,
    startDate: data.startDate ?? '',
    endDate: data.endDate ?? '',
    // Numeric ms timestamp (not serverTimestamp) — keeps orderBy('createdAt')
    // consistent with terms uploaded by the Dexie→Firestore migration.
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function updateTerm(uid, termId, changes) {
  return updateDoc(termRef(uid, termId), changes);
}

export async function deleteTerm(uid, termId) {
  // Cascade handled by recursive helper below
  await _deleteTermCascade(uid, termId);
}

export async function getTerms(uid) {
  const snap = await getDocs(query(termsCol(uid), orderBy('createdAt', 'desc')));
  return snapAll(snap);
}

// ── Class Groups ──────────────────────────────────────────────────────────────

export async function addClassGroup(uid, termId, classLevel) {
  const ref = await addDoc(cgCol(uid, termId), { termId, classLevel });
  return ref.id;
}

export async function removeClassGroup(uid, termId, cgId) {
  await _deleteCgCascade(uid, termId, cgId);
}

export async function getClassGroups(uid, termId) {
  const snap = await getDocs(cgCol(uid, termId));
  return snapAll(snap);
}

// ── Subjects ──────────────────────────────────────────────────────────────────

export async function addSubject(uid, termId, cgId, name, curriculumSubjectId, curriculumClassId) {
  const ref = await addDoc(subCol(uid, termId, cgId), {
    classGroupId: cgId,
    name,
    curriculumSubjectId: curriculumSubjectId || null,
    curriculumClassId:   curriculumClassId   || null,
  });
  return ref.id;
}

export async function updateSubject(uid, termId, cgId, subId, changes) {
  return updateDoc(subRef(uid, termId, cgId, subId), changes);
}

export async function removeSubject(uid, termId, cgId, subId) {
  await _deleteSubjectCascade(uid, termId, cgId, subId);
}

export async function getSubjects(uid, termId, cgId) {
  const snap = await getDocs(subCol(uid, termId, cgId));
  return snapAll(snap);
}

// ── Week Plans ────────────────────────────────────────────────────────────────

export async function upsertWeekPlan(uid, termId, cgId, subId, weekNumber, fields, expectedRevision) {
  // Use weekNumber as the document id for easy lookup
  const ref = wpRef(uid, termId, cgId, subId, String(weekNumber));
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const currentRecord = snap(snapshot);
    if (expectedRevision !== undefined && (currentRecord?.revision ?? null) !== expectedRevision) {
      const error = new Error('This week plan changed elsewhere. Refresh it before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = currentRecord;
      throw error;
    }
    transaction.set(ref, {
      subjectId: subId,
      weekNumber,
      ...fields,
      revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return ref.id;
  });
}

export async function getWeekPlans(uid, termId, cgId, subId) {
  const snap = await getDocs(wpCol(uid, termId, cgId, subId));
  return snapAll(snap);
}

// ── Week Topics ───────────────────────────────────────────────────────────────

export async function addWeekTopic(uid, termId, cgId, subId, weekNumber, topicData) {
  const ref = await addDoc(topCol(uid, termId, cgId, subId, String(weekNumber)), {
    weekPlanId: String(weekNumber),
    ...topicData,
    revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  });
  return ref.id;
}

export async function updateWeekTopic(uid, termId, cgId, subId, weekNumber, topicId, changes, expectedRevision) {
  const ref = doc(topCol(uid, termId, cgId, subId, String(weekNumber)), topicId);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const currentRecord = snap(snapshot);
    if (expectedRevision !== undefined && (currentRecord?.revision ?? null) !== expectedRevision) {
      const error = new Error('This topic changed elsewhere. Refresh it before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = currentRecord;
      throw error;
    }
    transaction.update(ref, {
      ...changes,
      revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  });
}

export async function removeWeekTopic(uid, termId, cgId, subId, weekNumber, topicId) {
  return deleteDoc(doc(topCol(uid, termId, cgId, subId, String(weekNumber)), topicId));
}

export async function getWeekTopics(uid, termId, cgId, subId, weekNumber) {
  const snap = await getDocs(topCol(uid, termId, cgId, subId, String(weekNumber)));
  return snapAll(snap);
}

// ── Lesson Notes ──────────────────────────────────────────────────────────────
// Stored flat under /users/{uid}/lessonNotes/{topicId} for O(1) lookup.

export async function upsertLessonNote(uid, topicId, data, expectedRevision) {
  const ref = doc(notesCol(uid), String(topicId));
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    const currentRecord = snap(snapshot);
    if (
      expectedRevision !== undefined &&
      (currentRecord?.revision ?? null) !== expectedRevision
    ) {
      const error = new Error('This lesson note changed elsewhere. Review the latest version before saving.');
      error.code = 'planner/conflict';
      error.currentRecord = currentRecord;
      throw error;
    }

    const saved = {
      ...data,
      topicId: String(topicId),
      revision: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      updatedAt: Date.now(),
    };
    transaction.set(ref, saved, { merge: true });
    return { id: String(topicId), ...currentRecord, ...saved };
  });
}

export async function getLessonNote(uid, topicId) {
  const d = await getDoc(doc(notesCol(uid), String(topicId)));
  return snap(d);
}

// ── Cascade delete helpers ────────────────────────────────────────────────────

async function _deleteTermCascade(uid, termId) {
  const cgs = await getDocs(cgCol(uid, termId));
  for (const cg of cgs.docs) {
    await _deleteCgCascade(uid, termId, cg.id);
  }
  await deleteDoc(termRef(uid, termId));
}

async function _deleteCgCascade(uid, termId, cgId) {
  const subs = await getDocs(subCol(uid, termId, cgId));
  for (const sub of subs.docs) {
    await _deleteSubjectCascade(uid, termId, cgId, sub.id);
  }
  await deleteDoc(cgRef(uid, termId, cgId));
}

async function _deleteSubjectCascade(uid, termId, cgId, subId) {
  const wps = await getDocs(wpCol(uid, termId, cgId, subId));
  const batch = writeBatch(db);
  for (const wp of wps.docs) {
    const topics = await getDocs(topCol(uid, termId, cgId, subId, wp.id));
    topics.docs.forEach(t => batch.delete(t.ref));
    batch.delete(wp.ref);
  }
  await batch.commit();
  await deleteDoc(subRef(uid, termId, cgId, subId));
}
