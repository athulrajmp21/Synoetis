import React from "react";
import { Code2 } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const DsaPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={Code2}
      title="DSA Tracker"
      phase="Phase 4 Scope"
      tableName="dsa_topics, dsa_problems, dsa_attempts"
      description="Systematic Data Structures & Algorithms problem solver, spaced revision scheduler, and topic mastery tracker."
      plannedFeatures={[
        "Pre-seeded 12 core computer science topics (Arrays to Graphs & DP)",
        "Problem directory with platform links (LeetCode, Codeforces)",
        "Independent solving status & confidence ratings (1 to 5)",
        "Spaced repetition revision scheduler",
        "Attempt history logger with approach notes and optimal solutions",
      ]}
    />
  );
};
