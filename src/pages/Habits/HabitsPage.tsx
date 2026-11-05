import React from "react";
import { Flame } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const HabitsPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={Flame}
      title="Habits & Daily Disciplines"
      phase="Phase 2 Scope"
      tableName="habits, habit_logs"
      description="Daily consistency tracking for coding routines, deep study sessions, and personal development."
      plannedFeatures={[
        "Daily, weekly, and weekday frequency configurations",
        "Streak calculation with recovery forgiveness rules",
        "Interactive completion heatmaps (GitHub-style contribution grid)",
        "Daily check-in modal and streak celebration cues",
      ]}
    />
  );
};
