import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  Building2,
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Award,
  Sparkles,
  Columns3,
  List,
  FileQuestion,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Check,
  DollarSign,
  ChevronRight,
  TrendingUp,
  GripVertical,
  ArrowRight,
} from "lucide-react";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/Button";
import { careerService } from "@/services/api";
import {
  ApplicationItem,
  ApplicationStatus,
  CompanyItem,
  InterviewItem,
  CreateApplicationInput,
  CreateInterviewInput,
} from "@/types/models";

const PIPELINE_COLUMNS: {
  id: ApplicationStatus;
  title: string;
  badgeClass: string;
  dotColor: string;
  nextStatus?: ApplicationStatus;
  nextLabel?: string;
}[] = [
  {
    id: "wishlist",
    title: "Wishlist",
    badgeClass: "bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300",
    dotColor: "bg-stone-400",
    nextStatus: "applied",
    nextLabel: "Applied",
  },
  {
    id: "applied",
    title: "Applied",
    badgeClass: "bg-sky-500/15 text-sky-800 dark:text-sky-300",
    dotColor: "bg-sky-500",
    nextStatus: "oa_round",
    nextLabel: "OA Round",
  },
  {
    id: "oa_round",
    title: "OA / Assessment",
    badgeClass: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    dotColor: "bg-amber-500",
    nextStatus: "interview",
    nextLabel: "Interview",
  },
  {
    id: "interview",
    title: "Technical Rounds",
    badgeClass: "bg-purple-500/15 text-purple-800 dark:text-purple-300",
    dotColor: "bg-purple-500",
    nextStatus: "offer",
    nextLabel: "Offer",
  },
  {
    id: "offer",
    title: "Offer Received",
    badgeClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300",
    dotColor: "bg-emerald-500",
  },
  {
    id: "rejected",
    title: "Archived / Rejected",
    badgeClass: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
    dotColor: "bg-rose-500",
  },
];

interface DragState {
  app: ApplicationItem;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  cardWidth: number;
  targetColumn: ApplicationStatus | null;
}

export const CareerPage: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View state: 'kanban' | 'table' | 'vault'
  const [viewMode, setViewMode] = useState<"kanban" | "table" | "vault">("kanban");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("all");

  // Pointer-based Drag & Drop state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragRef = useRef<{
    app: ApplicationItem | null;
    startX: number;
    startY: number;
    cardRect: DOMRect | null;
    isDragging: boolean;
    targetColumn: ApplicationStatus | null;
  }>({
    app: null,
    startX: 0,
    startY: 0,
    cardRect: null,
    isDragging: false,
    targetColumn: null,
  });

  // Modals state
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [selectedAppForInterview, setSelectedAppForInterview] = useState<ApplicationItem | null>(null);

  // New Application Form State
  const [appForm, setAppForm] = useState<CreateApplicationInput>({
    company_name: "",
    company_tier: "Tier 1 Big Tech",
    company_website: "",
    role: "",
    salary_range: "",
    status: "applied",
    job_url: "",
    applied_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // New Interview Debrief Form State
  const [interviewForm, setInterviewForm] = useState<CreateInterviewInput>({
    application_id: "",
    round_name: "Technical Round 1 (DSA)",
    interview_date: new Date().toISOString().split("T")[0],
    interviewer_info: "",
    questions_asked: "",
    notes: "",
    result: "pending",
  });

  const loadData = async () => {
    try {
      const [apps, ints, comps] = await Promise.all([
        careerService.getApplications(),
        careerService.getInterviews(),
        careerService.getCompanies(),
      ]);
      setApplications(apps);
      setInterviews(ints);
      setCompanies(comps);
    } catch (e) {
      console.error("Failed to load career data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.company_name.trim() || !appForm.role.trim()) return;

    try {
      const created = await careerService.createApplication(appForm);
      setApplications((prev) => [created, ...prev]);
      setIsAppModalOpen(false);
      setAppForm({
        company_name: "",
        company_tier: "Tier 1 Big Tech",
        company_website: "",
        role: "",
        salary_range: "",
        status: "applied",
        job_url: "",
        applied_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      careerService.getCompanies().then(setCompanies);
    } catch (err) {
      console.error("Failed to create application:", err);
    }
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    // Optimistic UI update
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    try {
      await careerService.updateApplicationStatus(id, newStatus);
    } catch (e) {
      console.error("Failed to update application status in DB:", e);
    }
  };

  const handleDeleteApplication = async (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
    await careerService.deleteApplication(id);
    setInterviews((prev) => prev.filter((i) => i.application_id !== id));
  };

  // Pointer-based Drag & Drop Engine (100% reliable across all browsers & WebViews)
  const handleCardPointerDown = (e: React.PointerEvent<HTMLDivElement>, app: ApplicationItem) => {
    if (e.button !== 0) return; // Primary click only

    // Ignore if clicking interactive controls
    const target = e.target as HTMLElement;
    if (target.closest("button, a, select, input, textarea")) return;

    const cardEl = e.currentTarget;
    const rect = cardEl.getBoundingClientRect();

    dragRef.current = {
      app,
      startX: e.clientX,
      startY: e.clientY,
      cardRect: rect,
      isDragging: false,
      targetColumn: null,
    };

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const { app, startX, startY, cardRect, isDragging } = dragRef.current;
      if (!app || !cardRect) return;

      const distance = Math.hypot(moveEvt.clientX - startX, moveEvt.clientY - startY);
      if (!isDragging && distance < 6) return;

      if (!isDragging) {
        dragRef.current.isDragging = true;
        document.body.style.userSelect = "none";
        document.body.style.cursor = "grabbing";
      }

      // Find which column is under the cursor
      const elem = document.elementFromPoint(moveEvt.clientX, moveEvt.clientY);
      const colElem = elem?.closest("[data-column-id]");
      const colId = (colElem?.getAttribute("data-column-id") as ApplicationStatus) || null;
      dragRef.current.targetColumn = colId;

      setDragState({
        app,
        x: moveEvt.clientX,
        y: moveEvt.clientY,
        offsetX: startX - cardRect.left,
        offsetY: startY - cardRect.top,
        cardWidth: cardRect.width,
        targetColumn: colId,
      });
    };

    const handlePointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      const { app, isDragging, targetColumn } = dragRef.current;
      if (isDragging && app) {
        const elem = document.elementFromPoint(upEvt.clientX, upEvt.clientY);
        const colElem = elem?.closest("[data-column-id]");
        const detectedColId = colElem?.getAttribute("data-column-id") as ApplicationStatus | null;
        const finalColId = detectedColId || targetColumn;

        if (finalColId && finalColId !== app.status) {
          handleStatusChange(app.id, finalColId);
        }
      }

      dragRef.current = {
        app: null,
        startX: 0,
        startY: 0,
        cardRect: null,
        isDragging: false,
        targetColumn: null,
      };
      setDragState(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  const handleOpenInterviewModal = (app: ApplicationItem) => {
    setSelectedAppForInterview(app);
    setInterviewForm({
      application_id: app.id,
      round_name: "Technical Round 1 (DSA)",
      interview_date: new Date().toISOString().split("T")[0],
      interviewer_info: "",
      questions_asked: "",
      notes: "",
      result: "pending",
    });
    setIsInterviewModalOpen(true);
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewForm.application_id || !interviewForm.round_name.trim()) return;

    try {
      const created = await careerService.createInterview(interviewForm);
      setInterviews((prev) => [created, ...prev]);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === interviewForm.application_id
            ? { ...a, interviews_count: a.interviews_count + 1 }
            : a
        )
      );
      setIsInterviewModalOpen(false);
    } catch (err) {
      console.error("Failed to log interview debrief:", err);
    }
  };

  const handleDeleteInterview = async (id: string) => {
    setInterviews((prev) => prev.filter((i) => i.id !== id));
    await careerService.deleteInterview(id);
  };

  // Metrics
  const totalApps = applications.length;
  const activePipelineCount = applications.filter((a) =>
    ["applied", "oa_round", "interview"].includes(a.status)
  ).length;
  const offersCount = applications.filter((a) => a.status === "offer").length;
  const totalDebriefs = interviews.length;

  // Filtered Applications
  const filteredApps = applications.filter((a) => {
    const matchesSearch =
      a.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier =
      selectedTier === "all" ||
      (a.company_tier && a.company_tier.toLowerCase().includes(selectedTier.toLowerCase()));
    return matchesSearch && matchesTier;
  });

  // Filtered Interviews for Vault
  const filteredInterviews = interviews.filter((i) => {
    const q = searchQuery.toLowerCase();
    const comp = i.company_name?.toLowerCase() || "";
    const role = i.role?.toLowerCase() || "";
    const questions = i.questions_asked?.toLowerCase() || "";
    const round = i.round_name.toLowerCase();
    return comp.includes(q) || role.includes(q) || questions.includes(q) || round.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Floating Card Ghost while Dragging */}
      {dragState && (
        <div
          style={{
            position: "fixed",
            left: `${dragState.x - dragState.offsetX}px`,
            top: `${dragState.y - dragState.offsetY}px`,
            width: `${dragState.cardWidth}px`,
          }}
          className="pointer-events-none z-[9999] opacity-95 shadow-2xl rounded-2xl bg-white dark:bg-[#141312] border-2 border-amber-500 ring-4 ring-amber-500/20 rotate-1 scale-[1.02] p-3.5 select-none"
        >
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <GripVertical className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                {dragState.app.company_name}
              </h4>
            </div>
            {dragState.app.company_tier && (
              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                {dragState.app.company_tier.replace("Big Tech", "").trim()}
              </span>
            )}
          </div>
          <div className="text-[11px] font-medium text-stone-700 dark:text-stone-300 line-clamp-1 mb-1 pl-5">
            {dragState.app.role}
          </div>
          {dragState.app.salary_range && (
            <div className="text-[10px] pl-5 mt-1 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
              {dragState.app.salary_range}
            </div>
          )}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              Career OS
              <Briefcase className="w-5 h-5 text-stone-500" />
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-semibold">
              Live Pipeline
            </span>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Target company registry, application pipeline, and technical interview debriefs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800/80 text-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("vault")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                viewMode === "vault"
                  ? "bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              <FileQuestion className="w-3.5 h-3.5" />
              <span>Question Vault ({totalDebriefs})</span>
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => setIsAppModalOpen(true)}
            className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Application</span>
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          title="Total Applications"
          value={totalApps}
          subtitle="Companies targeted"
          icon={Building2}
        />
        <MetricCard
          title="Active In Flight"
          value={activePipelineCount}
          subtitle="Applied, OA or Interview"
          icon={Clock}
        />
        <MetricCard
          title="Offers Secured"
          value={offersCount}
          subtitle={offersCount > 0 ? "Congratulations!" : "Keep grinding"}
          icon={Award}
        />
        <MetricCard
          title="Interview Debriefs"
          value={totalDebriefs}
          subtitle="Technical rounds logged"
          icon={FileQuestion}
          onClick={() => setViewMode("vault")}
        />
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              viewMode === "vault"
                ? "Search interview questions, algorithms, or companies..."
                : "Search applications by company or role..."
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          />
        </div>

        {viewMode !== "vault" && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-stone-400">Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300 focus:outline-hidden"
            >
              <option value="all">All Tiers</option>
              <option value="Tier 1">Tier 1 Big Tech</option>
              <option value="Unicorn">Unicorn / High-Growth</option>
              <option value="Startup">Early-Stage Startup</option>
              <option value="Enterprise">Enterprise / Mid-Market</option>
            </select>
          </div>
        )}
      </div>

      {/* VIEW 1: KANBAN PIPELINE */}
      {viewMode === "kanban" && (
        <div className="space-y-2">
          {/* Drag Guidance Banner */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-100/70 dark:bg-stone-900/40 border border-stone-200/60 dark:border-stone-800/60 text-[11px] text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <GripVertical className="w-3.5 h-3.5 text-amber-500" />
              <span>
                <strong>Click and drag any card</strong> to move it into another column (e.g. from <em>Wishlist</em> to <em>Applied</em>), or click the <strong>➔ button</strong> for instant move.
              </span>
            </div>
            {dragState && (
              <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                Moving "{dragState.app.company_name}"...
              </span>
            )}
          </div>

          {/* Kanban Columns Track */}
          <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start select-none">
            {PIPELINE_COLUMNS.map((col) => {
              const colApps = filteredApps.filter((a) => a.status === col.id);
              const isTargetColumn = dragState?.targetColumn === col.id;

              return (
                <div
                  key={col.id}
                  data-column-id={col.id}
                  className={`w-[290px] shrink-0 flex flex-col rounded-2xl p-3.5 shadow-2xs transition-all duration-150 ${
                    isTargetColumn
                      ? "bg-amber-500/15 dark:bg-amber-400/15 border-2 border-dashed border-amber-500 dark:border-amber-400 ring-4 ring-amber-500/20"
                      : "bg-[#FAF8F5]/90 dark:bg-[#141312]/90 border border-stone-200/80 dark:border-stone-800/80"
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                      <h3 className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                        {col.title}
                      </h3>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-medium">
                      {colApps.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[620px] pr-0.5 min-h-[140px]">
                    {/* Active Drag Landing Zone for this column */}
                    {dragState && dragState.app.status !== col.id && (
                      <div
                        className={`py-3 px-3 rounded-xl border-2 border-dashed transition-all duration-150 flex items-center justify-center gap-2 text-xs font-semibold ${
                          isTargetColumn
                            ? "border-amber-500 bg-amber-500/25 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/40 scale-[1.02]"
                            : "border-stone-300 dark:border-stone-700 bg-stone-100/60 dark:bg-stone-900/60 text-stone-500 dark:text-stone-400"
                        }`}
                      >
                        <ArrowRight
                          className={`w-4 h-4 ${
                            isTargetColumn ? "text-amber-600 dark:text-amber-300 animate-pulse" : "text-stone-400"
                          }`}
                        />
                        <span>
                          {isTargetColumn
                            ? `Drop into ${col.title}`
                            : `Release here to move to ${col.title}`}
                        </span>
                      </div>
                    )}

                    {colApps.length === 0 && (!dragState || dragState.app.status === col.id) ? (
                      <div className="py-10 text-center border border-dashed border-stone-200/70 dark:border-stone-800/70 rounded-xl">
                        <p className="text-[11px] text-stone-400 dark:text-stone-500">
                          Drag cards here or add new
                        </p>
                      </div>
                    ) : (
                      colApps.map((app) => {
                        const isBeingDragged = dragState?.app.id === app.id;
                        return (
                          <div
                            key={app.id}
                            onPointerDown={(e) => handleCardPointerDown(e, app)}
                            className={`group p-3.5 rounded-xl bg-white dark:bg-[#0C0B0A] border transition cursor-grab active:cursor-grabbing select-none shadow-xs flex flex-col justify-between touch-none ${
                              isBeingDragged
                                ? "opacity-25 scale-95 border-2 border-dashed border-stone-400 dark:border-stone-600"
                                : "border-stone-200/80 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm"
                            }`}
                          >
                            <div>
                              {/* Top Card Row */}
                              <div className="flex items-start justify-between gap-1 mb-1.5">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <GripVertical className="w-3.5 h-3.5 text-stone-300 dark:text-stone-700 group-hover:text-stone-500 dark:group-hover:text-stone-400 shrink-0" />
                                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                    {app.company_name}
                                  </h4>
                                </div>
                                {app.company_tier && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 shrink-0">
                                    {app.company_tier.replace("Big Tech", "").trim()}
                                  </span>
                                )}
                              </div>

                              {/* Role */}
                              <div className="text-[11px] font-medium text-stone-700 dark:text-stone-300 line-clamp-1 mb-1 pl-5">
                                {app.role}
                              </div>

                              {/* Salary & Date Chips */}
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 mt-2 pl-5">
                                {app.salary_range && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-mono font-medium">
                                    {app.salary_range}
                                  </span>
                                )}
                                {app.applied_date && (
                                  <span className="font-mono text-stone-400">
                                    {app.applied_date}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Footer: Status advance & debriefs */}
                            <div className="mt-3 pt-2.5 border-t border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between text-xs pl-1">
                              {/* Interviews count & Log Interview */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenInterviewModal(app);
                                }}
                                className="flex items-center gap-1 text-[10px] font-medium text-purple-600 dark:text-purple-400 hover:opacity-80 transition cursor-pointer"
                                title="Log Technical Round Debrief"
                              >
                                <FileQuestion className="w-3 h-3" />
                                <span>
                                  {app.interviews_count > 0
                                    ? `${app.interviews_count} Rounds`
                                    : "+ Interview"}
                                </span>
                              </button>

                              {/* Actions: Quick Move Pill + Dropdown + Delete */}
                              <div
                                className="flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {col.nextStatus && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(app.id, col.nextStatus!)}
                                    className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-medium bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 transition cursor-pointer"
                                    title={`Move to ${col.nextLabel}`}
                                  >
                                    <span>➔</span>
                                    <span>{col.nextLabel}</span>
                                  </button>
                                )}

                                {app.job_url && (
                                  <a
                                    href={app.job_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
                                    title="Open Job Posting"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}

                                <select
                                  value={app.status}
                                  onChange={(e) =>
                                    handleStatusChange(app.id, e.target.value as ApplicationStatus)
                                  }
                                  className="text-[10px] bg-stone-100 dark:bg-stone-800 rounded px-1 py-0.5 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 cursor-pointer"
                                  title="Change stage"
                                >
                                  <option value="wishlist">Wishlist</option>
                                  <option value="applied">Applied</option>
                                  <option value="oa_round">OA</option>
                                  <option value="interview">Interview</option>
                                  <option value="offer">Offer</option>
                                  <option value="rejected">Archived</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteApplication(app.id)}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-rose-500 transition cursor-pointer"
                                  title="Delete application"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Quick Add under Column */}
                  <button
                    onClick={() => {
                      setAppForm((prev) => ({ ...prev, status: col.id }));
                      setIsAppModalOpen(true);
                    }}
                    className="w-full mt-2.5 py-1.5 px-2 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 text-[11px] flex items-center justify-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to {col.title}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: TABLE VIEW */}
      {viewMode === "table" && (
        <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-[#FAF8F5] dark:bg-[#141312] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200 dark:border-stone-800 text-[11px] uppercase font-semibold text-stone-500 dark:text-stone-400 bg-stone-100/50 dark:bg-stone-900/30">
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Tier</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">CTC / Salary</th>
                  <th className="py-3 px-3">Applied Date</th>
                  <th className="py-3 px-3">Interviews</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/50 text-xs">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-stone-400">
                      No applications matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => (
                    <tr
                      key={app.id}
                      className="hover:bg-stone-200/30 dark:hover:bg-stone-900/30 transition group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-stone-400" />
                          <span className="font-semibold text-stone-900 dark:text-stone-100">
                            {app.company_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-stone-700 dark:text-stone-300">
                        {app.role}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {app.company_tier || "Standard"}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(app.id, e.target.value as ApplicationStatus)
                          }
                          className="text-[11px] font-medium bg-stone-100 dark:bg-stone-800 rounded-lg px-2 py-1 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer"
                        >
                          <option value="wishlist">Wishlist</option>
                          <option value="applied">Applied</option>
                          <option value="oa_round">OA Round</option>
                          <option value="interview">Interview</option>
                          <option value="offer">Offer</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-600 dark:text-stone-400">
                        {app.salary_range || "—"}
                      </td>
                      <td className="py-3 px-3 font-mono text-stone-400">
                        {app.applied_date || "—"}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleOpenInterviewModal(app)}
                          className="flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                        >
                          <FileQuestion className="w-3.5 h-3.5" />
                          <span>{app.interviews_count} Rounds</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {app.job_url && (
                            <a
                              href={app.job_url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteApplication(app.id)}
                            className="p-1 text-stone-400 hover:text-rose-500 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: INTERVIEW QUESTION VAULT */}
      {viewMode === "vault" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-purple-500" />
                Technical Interview Debrief Archive
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Log and review questions asked in system design, DSA, and technical rounds for pattern retention.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-stone-600 dark:text-stone-400">
              {filteredInterviews.length} Questions Logged
            </span>
          </div>

          <div className="space-y-3">
            {filteredInterviews.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 p-8">
                <FileQuestion className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                <h4 className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  No interview debriefs found
                </h4>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Click on any company card in the pipeline to log interview questions and feedback.
                </p>
              </div>
            ) : (
              filteredInterviews.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                            {item.company_name}
                          </h4>
                          <span className="text-stone-300 dark:text-stone-700">/</span>
                          <span className="text-xs text-stone-600 dark:text-stone-400">
                            {item.role}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-stone-400">
                          {item.round_name} • {item.interview_date}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold uppercase ${
                          item.result === "passed"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : item.result === "failed"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {item.result}
                      </span>
                      <button
                        onClick={() => handleDeleteInterview(item.id)}
                        className="text-stone-400 hover:text-rose-500 p-1 transition cursor-pointer"
                        title="Delete debrief"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Questions Box */}
                  {item.questions_asked && (
                    <div className="p-3 rounded-xl bg-white dark:bg-[#0C0B0A] border border-stone-200/70 dark:border-stone-800/70">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mb-1">
                        Questions & Algorithms Asked:
                      </div>
                      <pre className="text-xs font-mono text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed">
                        {item.questions_asked}
                      </pre>
                    </div>
                  )}

                  {/* Takeaways Notes */}
                  {item.notes && (
                    <div className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed pl-1">
                      <span className="font-semibold text-stone-700 dark:text-stone-300">
                        Takeaways:{" "}
                      </span>
                      {item.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD APPLICATION */}
      {isAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#141312] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-stone-800 dark:text-stone-200">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    Add Job Application
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Track a new company, role, and application status
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAppModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={appForm.company_name}
                    onChange={(e) =>
                      setAppForm((prev) => ({ ...prev, company_name: e.target.value }))
                    }
                    placeholder="e.g. Google, Stripe, Uber"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Company Tier
                  </label>
                  <select
                    value={appForm.company_tier}
                    onChange={(e) =>
                      setAppForm((prev) => ({ ...prev, company_tier: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  >
                    <option value="Tier 1 Big Tech">Tier 1 Big Tech</option>
                    <option value="Unicorn">Unicorn / High-Growth</option>
                    <option value="Startup">Early-Stage Startup</option>
                    <option value="Enterprise">Enterprise / Mid-Market</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={appForm.role}
                    onChange={(e) =>
                      setAppForm((prev) => ({ ...prev, role: e.target.value }))
                    }
                    placeholder="e.g. SDE 1, Distributed Systems Intern"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={appForm.status}
                    onChange={(e) =>
                      setAppForm((prev) => ({ ...prev, status: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  >
                    <option value="wishlist">Wishlist (To Apply)</option>
                    <option value="applied">Applied (Waiting)</option>
                    <option value="oa_round">OA / Assessment</option>
                    <option value="interview">Technical Interview</option>
                    <option value="offer">Offer Received</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Offered Salary / CTC Range
                  </label>
                  <input
                    type="text"
                    value={appForm.salary_range || ""}
                    onChange={(e) =>
                      setAppForm((prev) => ({ ...prev, salary_range: e.target.value }))
                    }
                    placeholder="e.g. ₹28 LPA, $160,000"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Applied Date
                  </label>
                  <input
                    type="date"
                    value={appForm.applied_date || ""}
                    onChange={(e) =>
                      setAppForm((prev) => ({ ...prev, applied_date: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Job Posting URL (Optional)
                </label>
                <input
                  type="url"
                  value={appForm.job_url || ""}
                  onChange={(e) =>
                    setAppForm((prev) => ({ ...prev, job_url: e.target.value }))
                  }
                  placeholder="https://careers.google.com/jobs/..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Notes & Referral Contacts
                </label>
                <textarea
                  rows={2}
                  value={appForm.notes || ""}
                  onChange={(e) =>
                    setAppForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Referral person, recruiter contact, special requirements..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAppModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                >
                  Save Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG INTERVIEW DEBRIEF */}
      {isInterviewModalOpen && selectedAppForInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#141312] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3.5 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-700 dark:text-purple-300">
                  <FileQuestion className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                    Log Interview Debrief
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {selectedAppForInterview.company_name} — {selectedAppForInterview.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInterviewModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInterview} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Round Type *
                  </label>
                  <select
                    value={interviewForm.round_name}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({ ...prev, round_name: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  >
                    <option value="Online Assessment">Online Assessment (OA)</option>
                    <option value="Technical Round 1 (DSA)">Technical Round 1 (DSA)</option>
                    <option value="Technical Round 2 (Systems)">Technical Round 2 (Systems)</option>
                    <option value="System Design Round">System Design Round</option>
                    <option value="Hiring Manager / HR">Hiring Manager / HR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Round Result
                  </label>
                  <select
                    value={interviewForm.result}
                    onChange={(e) =>
                      setInterviewForm((prev) => ({ ...prev, result: e.target.value }))
                    }
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                  >
                    <option value="pending">Pending Result</option>
                    <option value="passed">Passed / Cleared</option>
                    <option value="failed">Did Not Clear</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Questions & Problems Asked *
                </label>
                <textarea
                  rows={4}
                  required
                  value={interviewForm.questions_asked || ""}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({ ...prev, questions_asked: e.target.value }))
                  }
                  placeholder="e.g. 1. Implement LRU Cache in O(1)&#10;2. Explain concurrency in Go vs Rust&#10;3. Follow-up: how to scale to multi-node cache..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Debrief Notes & Self-Reflection
                </label>
                <textarea
                  rows={2}
                  value={interviewForm.notes || ""}
                  onChange={(e) =>
                    setInterviewForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="What went well? Where did you stumble? Topics to revise..."
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInterviewModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                >
                  Save Debrief
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
