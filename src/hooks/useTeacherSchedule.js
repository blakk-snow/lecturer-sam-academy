import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db as firestore } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { db as dexieDb } from '../db/database';
import { cacheTeacherSchedule, saveTeacherSchedule } from '../db/teacherSchedule';
import { SAMPLE_TEACHER_SCHEDULE } from '../data/ai/teacherSchedule';

export function useTeacherSchedule() {
  const { user } = useAuth();
  const [cloudState, setCloudState] = useState({ uid: null, schedule: undefined, error: null });
  const localSchedule = useLiveQuery(
    () => dexieDb.teacherSchedules.get('teacher-schedule'),
    [],
  );

  useEffect(() => {
    if (!user?.uid) {
      setCloudState({ uid: null, schedule: undefined, error: null });
      return undefined;
    }

    const uid = user.uid;
    return onSnapshot(
      doc(firestore, 'users', uid, 'teacher_schedules', 'sample'),
      snapshot => {
        const schedule = snapshot.exists()
          ? { id: snapshot.id, ...snapshot.data() }
          : null;
        setCloudState({ uid, schedule, error: null });
        if (schedule) {
          cacheTeacherSchedule(schedule).catch(error => {
            console.warn('Could not cache teacher schedule locally:', error);
          });
        }
      },
      error => setCloudState({ uid, schedule: undefined, error }),
    );
  }, [user?.uid]);

  // Save a timetable: Firestore when signed in, local cache always.
  const save = useCallback((weeklyTimetable) => {
    const current = cloudState.uid === user?.uid && cloudState.schedule
      ? cloudState.schedule
      : localSchedule ?? SAMPLE_TEACHER_SCHEDULE;
    return saveTeacherSchedule(user?.uid ?? null, {
      ...current,
      weeklyTimetable,
    });
  }, [cloudState, localSchedule, user?.uid]);

  if (user?.uid && cloudState.uid === user.uid && cloudState.schedule) {
    return {
      schedule: cloudState.schedule,
      source: 'cloud',
      error: cloudState.error,
      loading: false,
      save,
    };
  }
  if (localSchedule) {
    return {
      schedule: localSchedule,
      source: user ? 'offline' : 'local',
      error: cloudState.uid === user?.uid ? cloudState.error : null,
      loading: false,
      save,
    };
  }
  return {
    schedule: SAMPLE_TEACHER_SCHEDULE,
    source: 'sample',
    error: cloudState.uid === user?.uid ? cloudState.error : null,
    loading: Boolean(user?.uid && cloudState.uid !== user.uid),
    save,
  };
}
