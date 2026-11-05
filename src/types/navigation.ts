import { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: "default" | "accent" | "warning";
  shortcut?: string;
  category?: "core" | "academic_career" | "knowledge" | "system";
}
