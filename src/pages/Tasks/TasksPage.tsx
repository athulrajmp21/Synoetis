import React from "react";
import { CheckSquare } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const TasksPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={CheckSquare}
      title="My Tasks"
      phase="Phase 2 Scope"
      tableName="tasks"
      description="Unified task management system with priority sorting, project/goal associations, and recurrence rules."
      plannedFeatures={[
        "Task creation, inline editing, and modal editor",
        "Priority flags: Low, Medium, High, Urgent",
        "Due dates, category tagging, and status filters",
        "Relational links to Projects, Academic Courses, and Goals",
        "Kanban board, list, and calendar views",
        "Recurring tasks scheduler engine",
      ]}
    />
  );
};
