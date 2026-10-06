import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
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
