import { db, LOCAL_STUDENT_ID } from "./database";

const DEFAULT_SETTINGS = {
  id: "app",
  theme: "light",
  fontSize: "md",
  sound: false,
  notifications: false,
};

export async function getSettings() {
  const row = await db.settings.get("app");
  return { ...DEFAULT_SETTINGS, ...row };
}

export async function saveSettings(patch) {
  const current = await getSettings();
  const next = { ...current, ...patch, id: "app" };
  await db.settings.put(next);
  return next;
}

export async function getStudent(studentId = LOCAL_STUDENT_ID) {
  return db.students.get(studentId);
}

export async function upsertStudent(name, studentId = LOCAL_STUDENT_ID) {
  const now = Date.now();
  const existing = await db.students.get(studentId);
  const record = {
    id: studentId,
    name: name.trim(),
    createdAt: existing?.createdAt ?? now,
    lastActive: now,
  };
  await db.students.put(record);
  return record;
}
