import React from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS } from "./navConfig";
import { NavItem } from "@/types/navigation";

export const Sidebar: React.FC = () => {
  const { isSidebarCollapsed, toggleSidebar } = useNavigationStore();

  const renderNavGroup = (items: NavItem[], groupTitle?: string) => {
    return (
      <div className="mb-4">
        {groupTitle && !isSidebarCollapsed && (
          <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {groupTitle}
          </div>
        )}
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 font-semibold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive
                          ? "text-indigo-600 dark:text-indigo-400 scale-105"
                          : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                      }`}
                    />

                    {!isSidebarCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!isSidebarCollapsed && item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          item.badgeVariant === "accent"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Active left indicator line */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 dark:bg-indigo-400 rounded-r" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    );
  };

  const coreItems = MAIN_NAV_ITEMS.filter((i) => i.category === "core");
  const academicItems = MAIN_NAV_ITEMS.filter((i) => i.category === "academic_career");
  const knowledgeItems = MAIN_NAV_ITEMS.filter((i) => i.category === "knowledge");

  return (
    <aside
      className={`h-screen flex flex-col justify-between border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 transition-all duration-200 select-none ${
        isSidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-14 flex items-center justify-between px-3.5 border-b border-slate-200/80 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
              <Terminal className="w-4 h-4" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate">
                <span className="font-semibold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                  Life OS
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  v0.1.0 • Desktop
                </span>
              </div>
            )}
          </div>

          <button
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="p-3 overflow-y-auto max-h-[calc(100vh-140px)]">
          {renderNavGroup(coreItems, "Core")}
          {renderNavGroup(academicItems, "Academic & Career")}
          {renderNavGroup(knowledgeItems, "Knowledge & Growth")}
        </div>
      </div>

      {/* Bottom Nav Items & System Status */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
        {renderNavGroup(BOTTOM_NAV_ITEMS)}
      </div>
    </aside>
  );
};
