/**
 * usePlanner.js — Auth-aware planner data hooks
 *
 * When the user is signed in, data is read from / written to Firestore so it
 * syncs across devices. When signed out, the existing Dexie (IndexedDB) layer
 * is used — the app still works offline without an account.
 *
 * ── Reading data ──────────────────────────────────────────────────────────────
 * Each hook returns live data:
 *   • Dexie path     — useLiveQuery (reactive)
 *   • Firestore path — onSnapshot (reactive)
 *
 * Return conventions:
 *   undefined — still loading (callers show a loading state)
 *   null      — loaded, but the record does not exist
 *   array     — loaded (possibly empty)
 *
 * ── Writing data ──────────────────────────────────────────────────────────────
 * usePlannerActions() returns the right CRUD functions for the current auth
 * state. Pages call these instead of importing from ../db/planner directly.
 * Firestore writes need extra path context (termId/cgId/…); Dexie functions
 * ignore the extra trailing arguments.
 *
 * ── Firestore data shape ──────────────────────────────────────────────────────
 * /users/{uid}/terms/{termId}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subId}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subId}/weekPlans/{weekNumber}
 * /users/{uid}/terms/{termId}/classGroups/{cgId}/subjects/{subId}/weekPlans/{weekNumber}/weekTopics/{topicId}
 * /users/{uid}/lessonNotes/{topicId}
 *
 * Subject docs store their classGroupId, and topic docs store their weekPlanId
 * (which equals the week number), so pages can resolve nesting client-side.
 */

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  collection, doc, onSnapshot, query, orderBy,
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
// Merges one listener per class group (a term has a handful of class groups).
// ─────────────────────────────────────────────────────────────────────────────
export function useSubjectsForTerm(termId, classGroups) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || termId == null) { setFsData(undefined); return; }
    if (classGroups === undefined) { setFsData(undefined); return; }
    if (classGroups.length === 0) { setFsData([]); return; }

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
      if (user || termId == null || !classGroups?.length) return Promise.resolve(undefined);
      const ids = classGroups.map(cg => cg.id);
      return dexieDb.subjects.where('classGroupId').anyOf(ids).toArray();
    },
    [user, classGroups],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useSubject — single subject by id within a term.
// Subjects are nested under unknown classGroups in Firestore, so we reuse the
// term-wide subject list and find the match; its classGroupId field gives us
// the nesting context needed by week-plan reads and writes.
// ─────────────────────────────────────────────────────────────────────────────
export function useSubject(termId, subjectId) {
  const { user } = useAuth();
  const classGroups = useClassGroups(termId);
  const subjects = useSubjectsForTerm(termId, classGroups);

  const dexieData = useLiveQuery(
    () => (!user && subjectId != null)
      ? dexieDb.subjects.get(Number(subjectId))
      : Promise.resolve(undefined),
    [user, subjectId],
  );

  if (!user) return dexieData;
  if (classGroups === undefined || subjects === undefined) return undefined;
  return subjects.find(s => String(s.id) === String(subjectId)) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// useWeekPlans — live week plans for a subject.
// Firestore needs the nesting context (termId + cgId) which callers resolve
// from the subject's classGroupId field.
// ─────────────────────────────────────────────────────────────────────────────
export function useWeekPlans(termId, cgId, subjectId) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || !termId || !cgId || subjectId == null) { setFsData(undefined); return; }
    return onSnapshot(
      collection(firestore, 'users', user.uid, 'terms', String(termId),
        'classGroups', String(cgId), 'subjects', String(subjectId), 'weekPlans'),
      snap => setFsData(docsToArray(snap)),
    );
  }, [user, termId, cgId, subjectId]);

  const dexieData = useLiveQuery(
    () => (!user && subjectId != null)
      ? dexieDb.weekPlans.where('subjectId').equals(Number(subjectId)).toArray()
      : Promise.resolve(undefined),
    [user, subjectId],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useWeekTopicsForSubject — all week topics under a subject, merged across its
// week plans (one listener per week plan that exists).
// Firestore topics carry weekPlanId (= the week-number doc id), so callers can
// group them back under their plan.
// ─────────────────────────────────────────────────────────────────────────────
export function useWeekTopicsForSubject(termId, cgId, subjectId, weekPlans) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || !termId || !cgId || subjectId == null) { setFsData(undefined); return; }
    if (weekPlans === undefined) { setFsData(undefined); return; }
    if (weekPlans.length === 0) { setFsData([]); return; }

    const results = {};
    const unsubscribers = weekPlans.map(wp => {
      const weekId = String(wp.id);
      return onSnapshot(
        collection(firestore, 'users', user.uid, 'terms', String(termId),
          'classGroups', String(cgId), 'subjects', String(subjectId),
          'weekPlans', weekId, 'weekTopics'),
        snap => {
          results[weekId] = docsToArray(snap);
          setFsData(Object.values(results).flat());
        },
      );
    });
    return () => unsubscribers.forEach(u => u());
  }, [user, termId, cgId, subjectId, weekPlans]);

  const dexieData = useLiveQuery(
    () => {
      if (user || weekPlans === undefined) return Promise.resolve(undefined);
      if (weekPlans.length === 0) return Promise.resolve([]);
      const planIds = weekPlans.map(wp => wp.id);
      return dexieDb.weekTopics.where('weekPlanId').anyOf(planIds).toArray();
    },
    [user, weekPlans],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// useLessonNote — live lesson note for a topic (flat collection, O(1) lookup)
// ─────────────────────────────────────────────────────────────────────────────
export function useLessonNote(topicId) {
  const { user } = useAuth();

  const [fsData, setFsData] = useState(undefined);
  useEffect(() => {
    if (!user || topicId == null) { setFsData(undefined); return; }
    return onSnapshot(
      doc(firestore, 'users', user.uid, 'lessonNotes', String(topicId)),
      snap => setFsData(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    );
  }, [user, topicId]);

  const dexieData = useLiveQuery(
    () => (!user && topicId != null)
      ? dexieDb.lessonNotes.where('topicId').equals(Number(topicId)).first()
      : Promise.resolve(undefined),
    [user, topicId],
  );

  return user ? fsData : dexieData;
}

// ─────────────────────────────────────────────────────────────────────────────
// usePlannerActions — returns CRUD functions for the current auth state
//
// Dexie functions use the old numeric IDs from URL params.
// Firestore functions need termId + cgId context for nested writes — these
// are passed as optional extra args (Dexie functions ignore them).
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
      // Week plans (need termId, cgId as extra args)
      upsertWeekPlan:  (subId, weekNum, fields, termId, cgId) =>
                                                          fsCrud.upsertWeekPlan(uid, String(termId), String(cgId), String(subId), weekNum, fields),
      // Week topics (need termId, cgId, subId, weekNum)
      addWeekTopic:    (planId, data, termId, cgId, subId, weekNum) =>
                                                          fsCrud.addWeekTopic(uid, String(termId), String(cgId), String(subId), weekNum, data),
      updateWeekTopic: (topicId, changes, termId, cgId, subId, weekNum) =>
                                                          fsCrud.updateWeekTopic(uid, String(termId), String(cgId), String(subId), String(weekNum), String(topicId), changes),
      removeWeekTopic: (topicId, termId, cgId, subId, weekNum) =>
                                                          fsCrud.removeWeekTopic(uid, String(termId), String(cgId), String(subId), String(weekNum), String(topicId)),
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
