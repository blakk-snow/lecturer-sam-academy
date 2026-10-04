import { useMemo } from "react";
import { units, getUnit } from "../data/units";
import { lessons, getLessonsBySection } from "../data/lessons";
import { course } from "../data/course";

export function useCourse() {
  return useMemo(
    () => ({
      course,
      units,
      lessons,
      getUnit,
      getLessonsBySection,
    }),
    [],
  );
}
