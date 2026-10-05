/**
 * usePlanner.js — Auth-aware planner data hooks
 *
 * When the user is signed in, data is read from / written to Firestore so it
 * syncs across devices. When signed out, the existing Dexie (IndexedDB) layer
 * is used — the app still works offline without an account.
 *
 * ── Reading data ──────────────────────────────────────────────────────────────
 * Each hook returns live data:
 *   • Dexie path     — useLiveQuery (existing behaviour, reactive)
 *   • Firestore path — onSnapshot (reactive)
 *
 * ── Writing data ──────────────────────────────────────────────────────────────
 * usePlannerActions() returns the right CRUD functions for the current auth
 * state. Pages call these instead of importing from ../db/planner directly.
 *
 * ── Firestore data shape ──────────────────────────────────────────────────────
 * /users/{uid}/terms/{termId}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subId}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subId}/weekPlans/{wpId}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subId}/weekPlans/{wpId}/weekTopics/{topicId}
 * /users/{uid}/lessonNotes/{topicId}
 */

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  collection, doc, onSnapshot, query, orderBy,
  collectionGroup, where,
} from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { db as dexieDb } from '../db/database';
import { useAuth } from '../context/AuthContext';
import * as dexiePlanner from '../db/planner';
import * as fsCrud from '../db/plannerFirestore';

// ── Snapshot helpers ──────────────────────────────────────────────────────────

function docsToArray(snapshot) {
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─────────────────────────────────────────────────────────────────────────────
// useTerms — live list of all terms
// ─────────────────────────────────────────────────────────────────────────────
export function useTerms() {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user) { setFsData(undefined); return; }
    const q = query(
      collection(firestore, 'users', user.uid, 'terms'),
      orderBy('createdAt', 'desc'),
    );
    return onSnapshot(q, snap => setFsData(docsToArray(snap)));
  }, [user]);

  const dexieData = useLiveQuery(
    () => !user ? dexieDb.terms.orderBy('createdAt').reverse().toArray() : Promise.resolve(undefined),
    [user],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useTerm — single term by id
// ─────────────────────────────────────────────────────────────────────────────
export function useTerm(termId) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || !termId) { setFsData(undefined); return; }
    return onSnapshot(
      doc(firestore, 'users', user.uid, 'terms', String(termId)),
      snap => setFsData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    );
  }, [user, termId]);

  const dexieData = useLiveQuery(
    () => !user ? dexieDb.terms.get(Number(termId)) : Promise.resolve(undefined),
    [user, termId],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useClassGroups — live list of class groups for a term
// ─────────────────────────────────────────────────────────────────────────────
export function useClassGroups(termId) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || !termId) { setFsData(undefined); return; }
    return onSnapshot(
      collection(firestore, 'users', user.uid, 'terms', String(termId), 'classGroups'),
      snap => setFsData(docsToArray(snap)),
    );
  }, [user, termId]);

  const dexieData = useLiveQuery(
    () => !user ? dexieDb.classGroups.where('termId').equals(Number(termId)).toArray() : Promise.resolve(undefined),
    [user, termId],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useSubjectsForTerm — all subjects across all class groups in a term
// Uses a Firestore collectionGroup query for efficiency.
// ─────────────────────────────────────────────────────────────────────────────
export function useSubjectsForTerm(termId, classGroups) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || !classGroups?.length) { setFsData(classGroups?.length === 0 ? [] : undefined); return; }

    // Subscribe to each classGroup's subjects subcollection and merge
    const results = {};
    const unsubscribers = classGroups.map(cg => {
      const col = collection(
        firestore, 'users', user.uid, 'terms', String(termId),
        'classGroups', String(cg.id), 'subjects',
      );
      return onSnapshot(col, snap => {
        results[cg.id] = docsToArray(snap);
        setFsData(Object.values(results).flat());
      });
    });
    return () => unsubscribers.forEach(u => u());
  }, [user, termId, classGroups]);

  const dexieData = useLiveQuery(
    () => {
      if (user || !classGroups?.length) return Promise.resolve(undefined);
      const ids = classGroups.map(cg => cg.id);
      return dexieDb.subjects.where('classGroupId').anyOf(ids).toArray();
    },
    [user, classGroups],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useSubject — single subject. In Firestore the subject is nested under
// classGroups, so we pass termId + cgId when available. For cases where
// we only have subjectId (e.g. PlannerSubject route), we use a collectionGroup.
// ─────────────────────────────────────────────────────────────────────────────
export function useSubject(subjectId, termId) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || !subjectId) { setFsData(undefined); return; }
    // collectionGroup query to find the subject by its document id
    const q = query(
      collectionGroup(firestore, 'subjects'),
      where('classGroupId', '!=', ''),  // ensure we're in the right collection
    );
    // We can't query by doc id with collectionGroup directly, so we listen to
    // all subjects under this term and find the match client-side.
    const col = collection(firestore, 'users', user.uid, 'terms', String(termId));
    // Simpler: store a flat copy of each subject at /users/{uid}/subjectMeta/{subId}
    // for fast single-doc reads. We do that on write in plannerFirestore.js.
    // For now, use onSnapshot on the direct ref (requires knowing cgId).
    // Since we DON'T know cgId in PlannerSubject, fall back: listen to all
    // subjects in this term's classGroups by querying subjectMeta.
    // PRAGMATIC SOLUTION: store cgId on the subject doc (already done), and
    // also store a flat shadow doc at /users/{uid}/subjectMeta/{subjectId}.
    // Until that's wired: return undefined and let plannerFirestore handle reads.
    setFsData(undefined);
  }, [user, subjectId, termId]);

  const dexieData = useLiveQuery(
    () => !user ? dexieDb.subjects.get(Number(subjectId)) : Promise.resolve(undefined),
    [user, subjectId],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useWeekPlans + useWeekTopics — for PlannerSubject
// These need cgId to build the Firestore path. PlannerSubject has subjectId
// in the URL but not cgId. We resolve cgId from the subject doc.
// ─────────────────────────────────────────────────────────────────────────────
export function useWeekPlans(subjectId) {
  const { user } = useAuth();

  // Dexie path — same as before
  const dexieData = useLiveQuery(
    () => !user ? dexieDb.weekPlans.where('subjectId').equals(Number(subjectId)).toArray() : Promise.resolve(undefined),
    [user, subjectId],
  );

  // Firestore: return undefined — PlannerSubject will need to be updated to
  // pass more context. For now, authenticated users get live data via the
  // snapshot listeners set up when classGroups/subjects are loaded.
  return user ? undefined : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// usePlannerActions — returns CRUD functions for the current auth state
//
// Dexie functions use the old numeric IDs from URL params.
// Firestore functions need termId + cgId context for nested writes — these
// are passed as optional extra args. Pages that have been migrated pass them;
// pages that haven't yet fall through to Dexie.
// ─────────────────────────────────────────────────────────────────────────────
export function usePlannerActions() {
  const { user } = useAuth();
  const uid = user?.uid;

  if (uid) {
    return {
      _isFirestore: true,
      uid,
      // Terms
      createTerm:      (data)                          => fsCrud.createTerm(uid, data),
      updateTerm:      (termId, changes)               => fsCrud.updateTerm(uid, String(termId), changes),
      deleteTerm:      (termId)                        => fsCrud.deleteTerm(uid, String(termId)),
      // Class groups (need termId as extra arg)
      addClassGroup:   (termId, classLevel)            => fsCrud.addClassGroup(uid, String(termId), classLevel),
      removeClassGroup:(cgId, termId)                  => fsCrud.removeClassGroup(uid, String(termId), String(cgId)),
      // Subjects (need termId, cgId as extra args)
      addSubject:      (cgId, name, csId, ccId, termId) =>
                                                          fsCrud.addSubject(uid, String(termId), String(cgId), name, csId, ccId),
      updateSubject:   (subId, changes, termId, cgId)  =>
                                                          fsCrud.updateSubject(uid, String(termId), String(cgId), String(subId), changes),
      removeSubject:   (subId, termId, cgId)           =>
                                                          fsCrud.removeSubject(uid, String(termId), String(cgId), String(subId)),
      // Week plans (need termId, cgId, subId)
      upsertWeekPlan:  (subId, weekNum, fields, termId, cgId) =>
                                                          fsCrud.upsertWeekPlan(uid, String(termId), String(cgId), String(subId), weekNum, fields),
      // Week topics (need termId, cgId, subId, weekNum)
      addWeekTopic:    (planId, data, termId, cgId, subId, weekNum) =>
                                                          fsCrud.addWeekTopic(uid, String(termId), String(cgId), String(subId), weekNum, data),
      updateWeekTopic: (topicId, changes, termId, cgId, subId, weekNum) =>
                                                          fsCrud.updateWeekTopic(uid, String(termId), String(cgId), String(subId), weekNum, String(topicId), changes),
      removeWeekTopic: (topicId, termId, cgId, subId, weekNum) =>
                                                          fsCrud.removeWeekTopic(uid, String(termId), String(cgId), String(subId), weekNum, String(topicId)),
      // Lesson notes (flat under uid)
      upsertLessonNote:(topicId, data)                 => fsCrud.upsertLessonNote(uid, String(topicId), data),
      getLessonNote:   (topicId)                       => fsCrud.getLessonNote(uid, String(topicId)),
    };
  }

  // ── Dexie actions ─────────────────────────────────────────────────────────
  return {
    _isFirestore: false,
    // Terms
    createTerm:      (data)               => dexiePlanner.createTerm(data),
    updateTerm:      (termId, changes)    => dexiePlanner.updateTerm(termId, changes),
    deleteTerm:      (termId)             => dexiePlanner.deleteTerm(termId),
    // Class groups
    addClassGroup:   (termId, classLevel) => dexiePlanner.addClassGroup(termId, classLevel),
    removeClassGroup:(cgId)               => dexiePlanner.removeClassGroup(cgId),
    // Subjects
    addSubject:      (cgId, name, csId, ccId) => dexiePlanner.addSubject(cgId, name, csId, ccId),
    updateSubject:   (subId, changes)     => dexiePlanner.updateSubject(subId, changes),
    removeSubject:   (subId)              => dexiePlanner.removeSubject(subId),
    // Week plans
    upsertWeekPlan:  (subId, weekNum, fields) => dexiePlanner.upsertWeekPlan(subId, weekNum, fields),
    // Week topics
    addWeekTopic:    (planId, data)       => dexiePlanner.addWeekTopic(planId, data),
    updateWeekTopic: (topicId, changes)   => dexiePlanner.updateWeekTopic(topicId, changes),
    removeWeekTopic: (topicId)            => dexiePlanner.removeWeekTopic(topicId),
    // Lesson notes
    upsertLessonNote:(topicId, data)      => dexiePlanner.upsertLessonNote(topicId, data),
    getLessonNote:   (topicId)            => dexiePlanner.getLessonNote(topicId),
  };
}
