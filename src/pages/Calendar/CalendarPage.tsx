import React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const CalendarPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={CalendarIcon}
      title="Unified Calendar"
      phase="Phase 6 Scope"
      tableName="assessments & tasks"
      description="Integrated chronological schedule across assignments, exams, project milestones, and task deadlines."
      plannedFeatures={[
        "Month, week, and day grid views",
        "Visual color coding by course and project",
        "Exam and assessment countdown widgets",
        "Drag-and-drop task rescheduling",
        "ICS format export for mobile sync",
      ]}
    />
  );
};
