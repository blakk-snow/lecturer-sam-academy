import { useMemo } from "react";
import { getAdjacentLessons, getLesson, getLessonsBySection } from "../data/lessons";

export function useLesson(lessonId) {
  return useMemo(() => {
    const lesson = getLesson(lessonId);
    const adjacent = lessonId ? getAdjacentLessons(lessonId) : { prev: null, next: null };
    const sectionLessons = lesson ? getLessonsBySection(lesson.sectionId) : [];
    return { lesson, adjacent, sectionLessons };
  }, [lessonId]);
}
