import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ArrowRight,
  X,
  BookOpen,
  FileText,
  CheckSquare,
  Code2,
  Briefcase,
  Target,
  FolderGit2,
  GraduationCap,
  ExternalLink,
  FolderOpen,
  Zap,
  Sparkles,
  Command,
  Columns2,
  HardDrive,
  Clock,
  ChevronRight,
  Flame,
  Terminal,
  Copy,
  Check,
} from "lucide-react";
import { useNavigationStore } from "@/stores/useNavigationStore";
import { useFocusTimerStore } from "@/stores/useFocusTimerStore";
import { useKeybindingsStore } from "@/stores/useKeybindingsStore";
import { MAIN_NAV_ITEMS, BOTTOM_NAV_ITEMS } from "./navConfig";
import { searchService, resourceService, snippetsService } from "@/services/api";
import { OmniSearchResultItem } from "@/types/models";

type FilterCategory =
  | "all"
  | "snippet"
  | "resource"
  | "note"
  | "task"
  | "dsa"
  | "career"
  | "goal"
  | "project"
  | "navigation";

const CATEGORY_TABS: { id: FilterCategory; label: string; prefix?: string }[] = [
  { id: "all", label: "All" },
  { id: "snippet", label: "Snippets", prefix: "*" },
  { id: "resource", label: "Books & PDFs", prefix: "@" },
  { id: "note", label: "Notes", prefix: "#" },
  { id: "task", label: "Tasks", prefix: "!" },
  { id: "dsa", label: "DSA", prefix: "$" },
  { id: "career", label: "Career", prefix: "%" },
  { id: "goal", label: "Goals" },
  { id: "project", label: "Projects" },
  { id: "navigation", label: "Pages", prefix: ">" },
];

export const CommandSearchModal: React.FC = () => {
  const { isSearchOpen, setSearchOpen } = useNavigationStore();
  const { startTimer, setModalOpen: setFocusModalOpen } = useFocusTimerStore();
  const { matches, keybindings } = useKeybindingsStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [searchResults, setSearchResults] = useState<OmniSearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Parse prefixes from user query
  const parsedSearch = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.startsWith("*")) {
      return { category: "snippet" as FilterCategory, term: trimmed.slice(1).trim() };
    }
    if (trimmed.startsWith("@")) {
      return { category: "resource" as FilterCategory, term: trimmed.slice(1).trim() };
    }
    if (trimmed.startsWith("#")) {
      return { category: "note" as FilterCategory, term: trimmed.slice(1).trim() };
    }
    if (trimmed.startsWith("!")) {
      return { category: "task" as FilterCategory, term: trimmed.slice(1).trim() };
    }
    if (trimmed.startsWith("$")) {
      return { category: "dsa" as FilterCategory, term: trimmed.slice(1).trim() };
    }
    if (trimmed.startsWith("%")) {
      return { category: "career" as FilterCategory, term: trimmed.slice(1).trim() };
    }
    if (trimmed.startsWith(">")) {
      return { category: "navigation" as FilterCategory, term: trimmed.slice(1).trim() };
    }
    return { category: activeCategory, term: trimmed };
  }, [query, activeCategory]);

  // Combine database results with app navigation pages
  const allNavigationItems = useMemo(() => {
    return [...MAIN_NAV_ITEMS, ...BOTTOM_NAV_ITEMS].map((item) => ({
      id: `nav-${item.id}`,
      category: "navigation",
      title: item.label,
      subtitle: item.category ? `Navigate to ${item.category} workspace` : undefined,
      badge: item.shortcut || "PAGE",
      badge_color: "stone",
      target_route: item.path,
      is_local_file: false,
    }));
  }, []);

  // Filter navigation items by search term
  const filteredNavItems = useMemo(() => {
    if (parsedSearch.category !== "all" && parsedSearch.category !== "navigation") {
      return [];
    }
    const t = parsedSearch.term.toLowerCase();
    if (!t) {
      return parsedSearch.category === "navigation" ? allNavigationItems : [];
    }
    return allNavigationItems.filter(
      (n) => n.title.toLowerCase().includes(t) || (n.subtitle && n.subtitle.toLowerCase().includes(t))
    );
  }, [parsedSearch, allNavigationItems]);

  // Combined full items list
  const combinedItems: OmniSearchResultItem[] = useMemo(() => {
    if (parsedSearch.category === "navigation") {
      return filteredNavItems;
    }
    return [...searchResults, ...filteredNavItems];
  }, [searchResults, filteredNavItems, parsedSearch.category]);

  // Perform search across SQLite database
  useEffect(() => {
    if (!isSearchOpen) return;

    let isMounted = true;
    const executeSearch = async () => {
      setLoading(true);
      try {
        const cat = parsedSearch.category === "navigation" ? null : parsedSearch.category;
        const resp = await searchService.globalOmnisearch(
          parsedSearch.term,
          cat === "all" ? undefined : cat || undefined
        );
        if (isMounted) {
          setSearchResults(resp.items);
          setExecutionTimeMs(resp.execution_time_ms);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Omnisearch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const debounce = setTimeout(executeSearch, parsedSearch.term ? 80 : 0);
    return () => {
      isMounted = false;
      clearTimeout(debounce);
    };
  }, [parsedSearch, isSearchOpen]);

  // Focus input and reset when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setQuery("");
      setActiveCategory("all");
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Auto-scroll selected element into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const selectedEl = resultsContainerRef.current.querySelector(
      `[data-index="${selectedIndex}"]`
    );
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex]);

  // Global Keyboard Shortcuts (Dynamic Omnisearch binding, Esc, Arrow Navigation, Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matches(e, "omnisearch")) {
        e.preventDefault();
        setSearchOpen(!isSearchOpen);
      } else if (e.key === "Escape" && isSearchOpen) {
        setSearchOpen(false);
      } else if (isSearchOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            combinedItems.length > 0 ? (prev + 1) % combinedItems.length : 0
          );
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((prev) =>
            combinedItems.length > 0
              ? (prev - 1 + combinedItems.length) % combinedItems.length
              : 0
          );
        } else if (e.key === "Enter") {
          e.preventDefault();
          const item = combinedItems[selectedIndex];
          if (item) {
            handleItemExecution(item, e.ctrlKey || e.metaKey);
          }
        } else if (e.key === "Tab") {
          e.preventDefault();
          // Cycle through category tabs
          const currIdx = CATEGORY_TABS.findIndex((t) => t.id === activeCategory);
          const nextIdx = e.shiftKey
            ? (currIdx - 1 + CATEGORY_TABS.length) % CATEGORY_TABS.length
            : (currIdx + 1) % CATEGORY_TABS.length;
          setActiveCategory(CATEGORY_TABS[nextIdx].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSearchOpen, setSearchOpen, combinedItems, selectedIndex, activeCategory]);

  const handleItemExecution = async (
    item: OmniSearchResultItem,
    forceExternal: boolean = false
  ) => {
    setSearchOpen(false);

    // If Ctrl+Enter and it's a local file or external link, launch external app
    if (forceExternal && item.url_or_path) {
      if (item.is_local_file) {
        await resourceService.openResourceItem(item.url_or_path);
        return;
      } else if (item.url_or_path.startsWith("http")) {
        window.open(item.url_or_path, "_blank");
        return;
      }
    }

    // Default: Navigate to target route in Synoetis
    if (item.target_route) {
      navigate(item.target_route);
    }
  };

  const handleOpenExternal = async (
    e: React.MouseEvent,
    item: OmniSearchResultItem
  ) => {
    e.stopPropagation();
    if (item.url_or_path) {
      if (item.is_local_file) {
        await resourceService.openResourceItem(item.url_or_path);
      } else if (item.url_or_path.startsWith("http")) {
        window.open(item.url_or_path, "_blank");
      }
    }
  };

  const handleRevealExplorer = async (
    e: React.MouseEvent,
    item: OmniSearchResultItem
  ) => {
    e.stopPropagation();
    if (item.url_or_path && item.is_local_file) {
      await resourceService.revealInExplorer(item.url_or_path);
    }
  };

  const handleCopySnippet = async (
    e: React.MouseEvent,
    item: OmniSearchResultItem
  ) => {
    e.stopPropagation();
    if (item.url_or_path) {
      await navigator.clipboard.writeText(item.url_or_path);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
      try {
        await snippetsService.incrementUsage(item.id);
      } catch {
        // ignore
      }
    }
  };

  if (!isSearchOpen) return null;

  const getItemIcon = (category: string) => {
    switch (category) {
      case "snippet":
        return Terminal;
      case "resource":
        return BookOpen;
      case "note":
        return FileText;
      case "task":
        return CheckSquare;
      case "dsa":
        return Code2;
      case "career":
        return Briefcase;
      case "goal":
        return Target;
      case "project":
        return FolderGit2;
      case "course":
        return GraduationCap;
      case "navigation":
      default:
        return Command;
    }
  };

  const getBadgeClass = (color?: string | null) => {
    switch (color) {
      case "amber":
        return "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30";
      case "blue":
        return "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30";
      case "purple":
        return "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30";
      case "emerald":
        return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30";
      case "rose":
        return "bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30";
      default:
        return "bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300/40 dark:border-stone-700/40";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-stone-900/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 p-4"
      onClick={() => setSearchOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF8F5] dark:bg-[#121110] border border-stone-200/90 dark:border-stone-800/90 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200/80 dark:border-stone-800/80 shrink-0">
          <Search className="w-4 h-4 text-amber-500 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks, snippets, books, notes, DSA... (*snippets, @books, #notes, !tasks)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 font-medium"
          />

          {executionTimeMs !== null && (
            <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-stone-400 px-1.5 py-0.5 rounded bg-stone-200/50 dark:bg-stone-800/60">
              <Zap className="w-2.5 h-2.5 text-amber-500" />
              <span>{executionTimeMs}ms</span>
            </div>
          )}

          <button
            onClick={() => setSearchOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="px-3.5 py-2 border-b border-stone-200/60 dark:border-stone-800/60 flex items-center gap-1.5 overflow-x-auto shrink-0 bg-stone-50/50 dark:bg-stone-900/40 no-scrollbar">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                  isActive
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-semibold border border-amber-500/30"
                    : "text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.prefix && (
                  <span className="text-[10px] opacity-60 font-mono">
                    {tab.prefix}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results Scroll Viewport */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5 animate-pulse text-amber-500" />
              <span>Querying local SQLite database...</span>
            </div>
          ) : combinedItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">
              No matching records found across your tasks, books, notes, or code.
            </div>
          ) : (
            combinedItems.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = getItemIcon(item.category);

              return (
                <div
                  key={`${item.category}-${item.id}-${idx}`}
                  data-index={idx}
                  onClick={() => handleItemExecution(item, false)}
                  className={`w-full text-left p-2.5 rounded-xl transition flex items-start justify-between gap-3 cursor-pointer group ${
                    isSelected
                      ? "bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-stone-900 dark:text-stone-100 shadow-2xs"
                      : "hover:bg-stone-200/50 dark:hover:bg-stone-800/50 text-stone-700 dark:text-stone-300 border border-transparent"
                  }`}
                >
                  {/* Left: Icon & Title & Details */}
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-amber-500 text-white"
                          : "bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold tracking-tight text-stone-900 dark:text-stone-100 truncate">
                          {item.title}
                        </span>

                        {item.badge && (
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded-md border font-medium ${getBadgeClass(
                              item.badge_color
                            )}`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      {item.subtitle && (
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      )}

                      {item.match_preview && (
                        <div className="text-[10px] text-stone-400 dark:text-stone-500 italic mt-1 line-clamp-1 border-l-2 border-amber-500/40 pl-2">
                          &ldquo;{item.match_preview}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex items-center gap-1 shrink-0 self-center">
                    {item.category === "snippet" && item.url_or_path && (
                      <button
                        type="button"
                        onClick={(e) => handleCopySnippet(e, item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono transition cursor-pointer ${
                          copiedId === item.id
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40"
                            : "bg-stone-200/60 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-amber-500/15 hover:text-amber-800 dark:hover:text-amber-300"
                        }`}
                        title="Copy snippet code to clipboard"
                      >
                        {copiedId === item.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}

                    {item.is_local_file && item.url_or_path && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => handleOpenExternal(e, item)}
                          className="p-1 rounded text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition cursor-pointer"
                          title="Open with Windows Default App (Acrobat/VS Code)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleRevealExplorer(e, item)}
                          className="p-1 rounded text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                          title="Reveal in Windows File Explorer"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    <div
                      className={`flex items-center gap-1 text-[10px] font-medium transition ${
                        isSelected ? "opacity-100 text-amber-600 dark:text-amber-400" : "opacity-0 group-hover:opacity-100 text-stone-400"
                      }`}
                    >
                      <span className="hidden sm:inline">Open</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Shortcut & Status Strip */}
        <div className="px-4 py-2.5 border-t border-stone-200/80 dark:border-stone-800/80 bg-[#F3EFEA] dark:bg-[#0E0D0C] flex flex-wrap items-center justify-between text-[11px] text-stone-500 dark:text-stone-400 gap-2 shrink-0">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[9px]">
                ↑↓
              </kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[9px]">
                ↵
              </kbd>
              <span>open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.2 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[9px]">
                Ctrl+↵
              </kbd>
              <span>launch file</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 rounded bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-mono text-[9px]">
                Tab
              </kbd>
              <span>filter</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-stone-400">
              {combinedItems.length} items
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-mono text-[10px]">
              ESC
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};
