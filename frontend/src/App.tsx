import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InterviewPage } from "./pages/InterviewPage";
import { LandingPage } from "./pages/LandingPage";
import { PracticeSetupPage } from "./pages/PracticeSetupPage";
import { ResumeAnalyzerPage } from "./pages/ResumeAnalyzerPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/practice" element={<PracticeSetupPage />} />
          <Route path="/resume" element={<ResumeAnalyzerPage />} />
        </Route>
        <Route path="/interview/:id" element={<InterviewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
