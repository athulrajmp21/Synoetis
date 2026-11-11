import React, { useState, useEffect } from "react";
import {
  Code2,
  Plus,
  Search,
  ExternalLink,
  CheckCircle2,
  Circle,
  Trash2,
  Star,
  X,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DifficultyDot } from "@/components/ui/DifficultyDot";
import { dsaService, srsService } from "@/services/api";
import { DsaProblemItem, DsaTopicItem, SrsOverview } from "@/types/models";
import { SrsReviewModal } from "@/components/srs/SrsReviewModal";

export const DsaPage: React.FC = () => {
  const [problems, setProblems] = useState<DsaProblemItem[]>([]);
  const [topics, setTopics] = useState<DsaTopicItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all");

  // Modal / Add Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSrsModalOpen, setIsSrsModalOpen] = useState(false);
  const [srsDueCount, setSrsDueCount] = useState(0);
  const [newTitle, setNewTitle] = useState("");
  const [newTopic, setNewTopic] = useState("Arrays & Hashing");
  const [newDifficulty, setNewDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [newPlatform, setNewPlatform] = useState("LeetCode");
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [probData, topicData, srsData] = await Promise.all([
        dsaService.getDsaProblems(),
        dsaService.getDsaTopics(),
        srsService.getOverview().catch(() => ({ due_today_count: 0 } as SrsOverview)),
      ]);
      setProblems(probData);
      setTopics(topicData);
      setSrsDueCount(srsData.due_today_count);
    } catch (e) {
      console.error("Failed to load DSA data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await dsaService.addDsaProblem({
        title: newTitle.trim(),
        topic_name: newTopic,
        difficulty: newDifficulty,
        platform: newPlatform,
        url: newUrl.trim() || undefined,
      });

      setProblems((prev) => [created, ...prev]);
      setNewTitle("");
      setNewUrl("");
      setIsModalOpen(false);
      const updatedTopics = await dsaService.getDsaTopics();
      setTopics(updatedTopics);
    } catch (e) {
      console.error("Failed to add problem:", e);
    }
  };

  const handleToggleSolved = async (id: string, currentSolved: boolean, currentScore: number) => {
    const nextSolved = !currentSolved;
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, independent_solve: nextSolved } : p))
    );
    await dsaService.updateDsaStatus(id, nextSolved, currentScore);
  };

  const handleSetConfidence = async (id: string, score: number, currentSolved: boolean) => {
    setProblems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, confidence_score: score } : p))
    );
    await dsaService.updateDsaStatus(id, currentSolved, score);
  };

  const handleDelete = async (id: string) => {
    setProblems((prev) => prev.filter((p) => p.id !== id));
    await dsaService.deleteDsaProblem(id);
  };

  const filteredProblems = problems.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.platform.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      selectedDifficulty === "all" || p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "solved" && p.independent_solve) ||
      (statusFilter === "unsolved" && !p.independent_solve);

    return matchesSearch && matchesDifficulty && matchesStatus;
  });

  const solvedCount = problems.filter((p) => p.independent_solve).length;
  const easyCount = problems.filter((p) => p.difficulty === "Easy" && p.independent_solve).length;
  const mediumCount = problems.filter((p) => p.difficulty === "Medium" && p.independent_solve).length;
  const hardCount = problems.filter((p) => p.difficulty === "Hard" && p.independent_solve).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            DSA Tracker
            <Code2 className="w-5 h-5 text-stone-600 dark:text-stone-400" />
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Notion-style database for algorithmic mastery and interview preparation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSrsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 shadow-2xs"
            title="Practice Spaced Repetition flashcards for algorithm retention"
          >
            <Brain className="w-3.5 h-3.5 text-amber-500" />
            <span>Review Flashcards</span>
            {srsDueCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500 text-white font-bold">
                {srsDueCount}
              </span>
            )}
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900 flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Problem
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Total Solved
          </span>
          <div className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            {solvedCount}
            <span className="text-xs font-normal text-stone-400 ml-1">/ {problems.length}</span>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Easy
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {easyCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Medium
          </span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {mediumCount}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Hard
          </span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {hardCount}
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search problems, topics..."
            className="w-full text-xs pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300 focus:outline-hidden"
          >
            <option value="all">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center bg-[#F3EFEA] dark:bg-[#191816] p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "all"
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              All ({problems.length})
            </button>
            <button
              onClick={() => setStatusFilter("solved")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "solved"
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              Solved ({solvedCount})
            </button>
            <button
              onClick={() => setStatusFilter("unsolved")}
              className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                statusFilter === "unsolved"
                  ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 font-medium shadow-xs"
                  : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200"
              }`}
            >
              To Solve ({problems.length - solvedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Notion-Style Problems Table */}
      <div className="rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 overflow-hidden shadow-xs">
        {filteredProblems.length === 0 ? (
          <div className="py-12 text-center">
            <Code2 className="w-8 h-8 mx-auto text-stone-300 dark:text-stone-700 mb-2" />
            <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
              No DSA problems logged yet
            </h4>
            <p className="text-xs text-stone-400 dark:text-stone-500 max-w-sm mx-auto mb-4">
              Add LeetCode, Codeforces, or custom interview questions to track your solving confidence and revision schedule.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Problem
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F3EFEA] dark:bg-[#191816] border-b border-stone-200/80 dark:border-stone-800/80 text-stone-500 dark:text-stone-400 font-medium text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">Status</th>
                  <th className="py-2.5 px-3">Problem Title</th>
                  <th className="py-2.5 px-3">Topic</th>
                  <th className="py-2.5 px-3">Difficulty</th>
                  <th className="py-2.5 px-3">Platform</th>
                  <th className="py-2.5 px-3">Confidence</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/50 dark:divide-stone-800/50">
                {filteredProblems.map((prob) => {
                  const isSolved = prob.independent_solve;
                  return (
                    <tr
                      key={prob.id}
                      className="group hover:bg-stone-100/50 dark:hover:bg-stone-900/40 transition"
                    >
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() =>
                            handleToggleSolved(
                              prob.id,
                              prob.independent_solve,
                              prob.confidence_score
                            )
                          }
                          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                          title={isSolved ? "Mark unsolved" : "Mark solved"}
                        >
                          {isSolved ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-500/10" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-stone-900 dark:text-stone-100">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={
                              isSolved
                                ? "line-through text-stone-400 dark:text-stone-500"
                                : ""
                            }
                          >
                            {prob.title}
                          </span>
                          {prob.url && (
                            <a
                              href={prob.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5"
                              title="Open problem link"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 dark:text-stone-400">
                        {prob.topic_name}
                      </td>
                      <td className="py-2.5 px-3">
                        <DifficultyDot difficulty={prob.difficulty} />
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 dark:text-stone-400 font-mono text-[11px]">
                        {prob.platform}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() =>
                                handleSetConfidence(
                                  prob.id,
                                  star,
                                  prob.independent_solve
                                )
                              }
                              className={`p-0.5 transition cursor-pointer ${
                                star <= prob.confidence_score
                                  ? "text-amber-500"
                                  : "text-stone-200 dark:text-stone-800 hover:text-amber-400"
                              }`}
                            >
                              <Star className="w-3 h-3 fill-current" />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDelete(prob.id)}
                          className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 p-1 transition cursor-pointer"
                          title="Delete problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Problem Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/60 dark:border-stone-800/60">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Add DSA Problem
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddProblem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Problem Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Trapping Rain Water"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-1 focus:ring-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Topic
                  </label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g. Dynamic Programming"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) => setNewDifficulty(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  >
                    <option value="LeetCode">LeetCode</option>
                    <option value="NeetCode">NeetCode</option>
                    <option value="Codeforces">Codeforces</option>
                    <option value="GFG">GFG</option>
                    <option value="InterviewBit">InterviewBit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                    Problem URL
                  </label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-[#0C0B0A] text-stone-800 dark:text-stone-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs border-stone-200 dark:border-stone-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-stone-50 dark:text-stone-900"
                >
                  Save Problem
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Spaced Repetition Flashcard Modal */}
      <SrsReviewModal
        isOpen={isSrsModalOpen}
        onClose={() => setIsSrsModalOpen(false)}
        onCompletedReview={loadData}
      />
    </div>
  );
};
