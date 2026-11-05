import React from "react";
import { Briefcase } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const CareerPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={Briefcase}
      title="Career OS"
      phase="Phase 4 Scope"
      tableName="companies, applications"
      description="Internship and placement tracker, company research database, interview pipeline, and technical skill roadmaps."
      plannedFeatures={[
        "Target company registry with tiers and research notes",
        "Application pipeline (Applied, OA, Technical Round, HR, Offer)",
        "Resume version mapping and job description analysis",
        "Interview question archive and post-interview debriefs",
        "Compensation and offer comparison matrix",
      ]}
    />
  );
};
