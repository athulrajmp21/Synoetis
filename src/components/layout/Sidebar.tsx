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
          <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
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
                  `group relative flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-stone-200/70 text-stone-900 dark:bg-stone-800/80 dark:text-stone-100 font-semibold shadow-2xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100/80 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-900/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isActive
                          ? "text-stone-900 dark:text-stone-100 scale-105"
                          : "text-stone-400 group-hover:text-stone-600 dark:text-stone-500 dark:group-hover:text-stone-300"
                      }`}
                    />

                    {!isSidebarCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {/* Active left indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-stone-900 dark:bg-stone-100 rounded-r" />
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
      className={`h-screen flex flex-col justify-between border-r border-stone-200/80 dark:border-stone-800/80 bg-[#FBF9F6] dark:bg-[#0D0C0B] transition-all duration-200 select-none ${
        isSidebarCollapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Brand Header */}
      <div>
        <div
          data-tauri-drag-region
          className="h-12 flex items-center justify-between px-3.5 border-b border-stone-200/80 dark:border-stone-800/80"
        >
          <div className="flex items-center gap-2.5 overflow-hidden" data-tauri-drag-region>
            <div className="w-6 h-6 rounded-md overflow-hidden bg-stone-900/5 dark:bg-stone-100/5 flex items-center justify-center shrink-0 shadow-2xs border border-stone-200/80 dark:border-stone-800/80">
              <img src="/logo.png" alt="Synoetis" className="w-5 h-5 object-contain" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col truncate" data-tauri-drag-region>
                <span className="font-semibold text-xs tracking-tight text-stone-900 dark:text-stone-100">
                  Synoetis
                </span>
                <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                  Engine v1.0.1
                </span>
              </div>
            )}
          </div>

          <button
            data-tauri-drag-region="false"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <div className="p-2.5 overflow-y-auto max-h-[calc(100vh-120px)]">
          {renderNavGroup(coreItems, "Core")}
          {renderNavGroup(academicItems, "Academic & Career")}
          {renderNavGroup(knowledgeItems, "Knowledge & Growth")}
        </div>
      </div>

      {/* Bottom Nav Items & System Status */}
      <div className="p-2.5 border-t border-stone-200/80 dark:border-stone-800/80">
        {renderNavGroup(BOTTOM_NAV_ITEMS)}
      </div>
    </aside>
  );
};
