import { useNavigate, useParams } from "react-router-dom";
import { LessonChrome } from "../components/layout/LessonChrome";
import { LessonRenderer } from "../components/lesson/LessonRenderer";
import { useLesson } from "../hooks/useLesson";
import { getSection, getUnit } from "../data/units";

export default function Lesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { lesson, adjacent, sectionLessons } = useLesson(lessonId);

  if (!lesson) {
    return <p>That lesson was not found.</p>;
  }

  const unit = getUnit(lesson.unitId);
  const section = getSection(lesson.unitId, lesson.sectionId);
  const position = sectionLessons.findIndex((item) => item.id === lesson.id) + 1;
  const progress = Math.round((position / sectionLessons.length) * 100);

  return (
    <div>
      <LessonChrome
        prev={adjacent.prev}
        next={adjacent.next}
        progress={progress}
        title={`${section?.title ?? ""} · Lesson ${position} of ${sectionLessons.length}`}
      />
      <p className="text-sm text-ink-soft">{unit?.title}</p>
      <h1 className="mb-6 font-serif text-3xl">{lesson.title}</h1>
      <LessonRenderer
        lesson={lesson}
        onOpenQuiz={(quizId) => navigate(`/quiz/${quizId}`)}
      />
    </div>
  );
}
