import React from "react";
import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const AnalyticsPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={BarChart3}
      title="Velocity & Analytics"
      phase="Phase 6 Scope"
      tableName="study_sessions, habit_logs, tasks"
      description="Quantitative productivity analytics, weekly study velocity, DSA topic breakdown, and historical goal completion trends."
      plannedFeatures={[
        "Interactive Recharts charts: Study velocity vs goals",
        "DSA topic distribution radar chart and difficulty breakdown",
        "Weekly task throughput velocity metrics",
        "Deep work session duration distribution",
      ]}
    />
  );
};
