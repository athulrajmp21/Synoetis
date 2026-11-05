import React from "react";
import { Target } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const GoalsPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={Target}
      title="Goals & Milestones"
      phase="Phase 2 Scope"
      tableName="goals, milestones"
      description="Long-term vision and short-term quarterly milestones for engineering skills, academics, and career growth."
      plannedFeatures={[
        "Categorization: Academic, Career, Technical, Personal",
        "Time horizons: Short-term (Quarterly) vs Long-term (Multi-year)",
        "Automated progress metrics calculated from completed child tasks",
        "Milestones checklist and target completion timelines",
      ]}
    />
  );
};
