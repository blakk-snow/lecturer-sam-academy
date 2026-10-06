import { doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { SAMPLE_TEACHER_SCHEDULE } from '../data/ai/teacherSchedule';
import { db as dexieDb } from './database';

const LOCAL_SCHEDULE_ID = 'teacher-schedule';
const CLOUD_SCHEDULE_ID = 'sample';

function teacherScheduleRef(uid) {
  return doc(firestore, 'users', uid, 'teacher_schedules', CLOUD_SCHEDULE_ID);
}

function toLocalRecord(schedule) {
  return {
    id: LOCAL_SCHEDULE_ID,
    scheduleId: schedule.scheduleId ?? CLOUD_SCHEDULE_ID,
    scheduleVersion: schedule.scheduleVersion ?? 1,
    weeklyTimetable: schedule.weeklyTimetable ?? SAMPLE_TEACHER_SCHEDULE.weeklyTimetable,
    schemesOfLearning: schedule.schemesOfLearning ?? SAMPLE_TEACHER_SCHEDULE.schemesOfLearning,
    updatedAt: Date.now(),
  };
}

export async function cacheTeacherSchedule(schedule) {
  await dexieDb.teacherSchedules.put(toLocalRecord(schedule));
}

export async function ensureSampleTeacherSchedule(uid) {
  if (!uid) return;
  const ref = teacherScheduleRef(uid);

  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists()) return;

    transaction.set(ref, {
      ...SAMPLE_TEACHER_SCHEDULE,
      authorId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

/**
 * Save a user-edited timetable.
 * Signed in: writes to /users/{uid}/teacher_schedules/{scheduleId} (last-write-wins
 * with a scheduleVersion bump) AND caches locally. Signed out: local cache only,
 * matching the planner's offline-first behaviour.
 */
export async function saveTeacherSchedule(uid, schedule) {
  const record = toLocalRecord(schedule);
  record.scheduleVersion = (schedule.scheduleVersion ?? 0) + 1;

  if (uid) {
    const ref = teacherScheduleRef(uid);
    await setDoc(ref, {
      scheduleId: record.scheduleId,
      scheduleVersion: record.scheduleVersion,
      weeklyTimetable: record.weeklyTimetable,
      schemesOfLearning: record.schemesOfLearning,
      authorId: uid,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  await cacheTeacherSchedule(record);
  return record;
}
