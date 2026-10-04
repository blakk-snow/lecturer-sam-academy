import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Course from "./pages/Course";
import Unit from "./pages/Unit";
import Lesson from "./pages/Lesson";
import Practice from "./pages/Practice";
import Quiz from "./pages/Quiz";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import Curriculum from "./pages/Curriculum";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/progress" element={<Navigate to="/dashboard" replace />} />
        <Route path="/course" element={<Course />} />
        <Route path="/course/:unitId" element={<Unit />} />
        <Route path="/lesson/:lessonId" element={<Lesson />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/quiz/:quizId" element={<Quiz />} />
        <Route path="/results/:resultId" element={<Results />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
