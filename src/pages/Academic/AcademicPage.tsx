import React from "react";
import { GraduationCap } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const AcademicPage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={GraduationCap}
      title="Academic OS"
      phase="Phase 3 Scope"
      tableName="semesters, courses, assessments"
      description="Eight-semester engineering degree roadmap, course syllabus tracking, credits, and grade target calculators."
      plannedFeatures={[
        "Interactive 8-semester roadmap (Fall & Spring progression)",
        "Course database with instructor, syllabus, credits, and target grades",
        "Assessment tracker (midterms, finals, quizzes, labs, assignments)",
        "GPA & SGPA projection calculator",
        "Course-linked notes and study material hubs",
      ]}
    />
  );
};
