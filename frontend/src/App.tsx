import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthPage } from "./pages/AuthPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InterviewPage } from "./pages/InterviewPage";
import { LandingPage } from "./pages/LandingPage";
import { PracticeSetupPage } from "./pages/PracticeSetupPage";
import { ResumeAnalyzerPage } from "./pages/ResumeAnalyzerPage";
import { SkillProofChallengePage } from "./pages/SkillProofChallengePage";
import { SkillProofPage } from "./pages/SkillProofPage";
import { SkillProofReportPage } from "./pages/SkillProofReportPage";
import { SkillProofVivaPage } from "./pages/SkillProofVivaPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/skillproof/share/:token" element={<SkillProofReportPage publicView />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/practice" element={<PracticeSetupPage />} />
          <Route path="/resume" element={<ResumeAnalyzerPage />} />
          <Route path="/skillproof" element={<SkillProofPage />} />
          <Route path="/skillproof/:id/report" element={<SkillProofReportPage />} />
        </Route>
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/skillproof/:id/challenge" element={<SkillProofChallengePage />} />
        <Route path="/skillproof/:id/viva" element={<SkillProofVivaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
