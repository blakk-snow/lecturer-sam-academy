import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";

// ── Lazy-loaded pages ──────────────────────────────────────────────────────────
// Each page becomes a separate Vite chunk, loaded only when first visited.

const Home           = lazy(() => import("./pages/Home"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Course         = lazy(() => import("./pages/Course"));
const Unit           = lazy(() => import("./pages/Unit"));
const Lesson         = lazy(() => import("./pages/Lesson"));
const Practice       = lazy(() => import("./pages/Practice"));
const Quiz           = lazy(() => import("./pages/Quiz"));
const Results        = lazy(() => import("./pages/Results"));
const Profile        = lazy(() => import("./pages/Profile"));
const Curriculum     = lazy(() => import("./pages/Curriculum"));
const Planner        = lazy(() => import("./pages/Planner"));
const PlannerTerm    = lazy(() => import("./pages/PlannerTerm"));
const PlannerSubject = lazy(() => import("./pages/PlannerSubject"));
const PlannerLesson  = lazy(() => import("./pages/PlannerLesson"));
const AIAssistant    = lazy(() => import("./pages/AIAssistant"));

// ── Fallback shown while a page chunk is loading ───────────────────────────────

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60dvh]">
      <div className="w-6 h-6 rounded-full border-2 border-accent border-t-transparent animate-spin" />
    </div>
  );
}

// ── Shell with Suspense boundary ───────────────────────────────────────────────
// <Suspense> cannot be a direct child of <Routes> — it must live inside the
// layout element so React Router only sees <Route> nodes as its children.

function SuspenseShell() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AppShell />
    </Suspense>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<SuspenseShell />}>
        <Route path="/"                                        element={<Home />} />
        <Route path="/dashboard"                               element={<Dashboard />} />
        <Route path="/progress"                                element={<Navigate to="/dashboard" replace />} />
        <Route path="/course"                                  element={<Course />} />
        <Route path="/course/:unitId"                          element={<Unit />} />
        <Route path="/lesson/:lessonId"                        element={<Lesson />} />
        <Route path="/practice"                                element={<Practice />} />
        <Route path="/curriculum"                              element={<Curriculum />} />
        <Route path="/planner"                                 element={<Planner />} />
        <Route path="/planner/:termId"                         element={<PlannerTerm />} />
        <Route path="/planner/:termId/:subjectId"              element={<PlannerSubject />} />
        <Route path="/planner/:termId/:subjectId/:topicId"     element={<PlannerLesson />} />
        <Route path="/ai-assistant"                            element={<AIAssistant />} />
        <Route path="/quiz/:quizId"                            element={<Quiz />} />
        <Route path="/results/:resultId"                       element={<Results />} />
        <Route path="/profile"                                 element={<Profile />} />
      </Route>
    </Routes>
  );
}
