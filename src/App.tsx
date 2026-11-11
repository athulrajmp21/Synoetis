import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/Dashboard/DashboardPage";
import { TasksPage } from "@/pages/Tasks/TasksPage";
import { CalendarPage } from "@/pages/Calendar/CalendarPage";
import { AcademicPage } from "@/pages/Academic/AcademicPage";
import { DsaPage } from "@/pages/DSA/DsaPage";
import { CareerPage } from "@/pages/Career/CareerPage";
import { ProjectsPage } from "@/pages/Projects/ProjectsPage";
import { SnippetsPage } from "@/pages/Snippets/SnippetsPage";
import { KnowledgePage } from "@/pages/Knowledge/KnowledgePage";
import { StudyStudioPage } from "@/pages/Study/StudyStudioPage";
import { ResourcesPage } from "@/pages/Resources/ResourcesPage";
import { GoalsPage } from "@/pages/Goals/GoalsPage";
import { HabitsPage } from "@/pages/Habits/HabitsPage";
import { AnalyticsPage } from "@/pages/Analytics/AnalyticsPage";
import { SettingsPage } from "@/pages/Settings/SettingsPage";
import { BackupPage } from "@/pages/Backup/BackupPage";
import { AboutPage } from "@/pages/About/AboutPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="academic" element={<AcademicPage />} />
          <Route path="dsa" element={<DsaPage />} />
          <Route path="career" element={<CareerPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="snippets" element={<SnippetsPage />} />
          <Route path="knowledge" element={<KnowledgePage />} />
          <Route path="study" element={<StudyStudioPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="habits" element={<HabitsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
