import React from "react";
import { FolderGit2 } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const ProjectsPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={FolderGit2}
      title="Engineering Projects"
      phase="Phase 2 Scope"
      tableName="projects, milestones"
      description="Portfolio and systems software project tracking, feature backlogs, architecture decisions, and git repository links."
      plannedFeatures={[
        "Project lifecycle stages (Planning, Active, Paused, Shipped)",
        "Tech stack tagging and GitHub repository deep-linking",
        "Milestones and deliverable tracking",
        "Architecture Decision Records (ADR) documentation",
        "Project-scoped task views and bug tracking",
      ]}
    />
  );
};
