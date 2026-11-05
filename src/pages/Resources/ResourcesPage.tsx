import React from "react";
import { Library } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const ResourcesPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={Library}
      title="Resources & Library"
      phase="Phase 5 Scope"
      tableName="resources"
      description="Curated repository of computer science books, research papers, official documentation, courses, and engineering blogs."
      plannedFeatures={[
        "Categorization: Books, Documentation, Courses, Videos, Articles",
        "Reading status: To Read, In Progress, Completed",
        "Personal ratings and key takeaways summary",
        "Direct link launcher with offline cache support",
      ]}
    />
  );
};
