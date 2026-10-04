import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, LOCAL_STUDENT_ID } from "../db/database";
import { getSettings, saveSettings, upsertStudent } from "../db/settings";

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const student = useLiveQuery(
    async () => (await db.students.get(LOCAL_STUDENT_ID)) ?? null,
    [],
  );
  const [settings, setSettings] = useState({ fontSize: "md" });

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.font = settings.fontSize ?? "md";
  }, [settings.fontSize]);

  const value = useMemo(
    () => ({
      student,
      ready: student !== undefined,
      settings,
      async saveProfile(name, fontSize) {
        const record = await upsertStudent(name);
        const next = await saveSettings({ fontSize: fontSize ?? settings.fontSize });
        setSettings(next);
        return record;
      },
    }),
    [student, settings],
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
}

export function useStudent() {
  const ctx = useContext(StudentContext);
  if (!ctx) throw new Error("useStudent must be used inside StudentProvider");
  return ctx;
}
