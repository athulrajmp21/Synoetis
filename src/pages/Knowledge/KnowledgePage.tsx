import React from "react";
import { BookOpen } from "lucide-react";
import { ModulePlaceholder } from "@/pages/ModulePlaceholder";

export const KnowledgePage: React.FC = () => {
  return (
    <ModulePlaceholder
      icon={BookOpen}
      title="Knowledge Hub"
      phase="Phase 5 Scope"
      tableName="notes, tags, note_tags"
      description="Personal Second Brain and technical wiki with rich-text editing, Markdown export, and bidirectional relational linking."
      plannedFeatures={[
        "Tiptap rich-text & Markdown block editor",
        "Syntax-highlighted code blocks for Rust, TypeScript, C++, Python",
        "Tags, folders, and full-text keyword indexing",
        "Bidirectional backlinks to Courses and Projects",
        "Offline Markdown file import and export",
      ]}
    />
  );
};
