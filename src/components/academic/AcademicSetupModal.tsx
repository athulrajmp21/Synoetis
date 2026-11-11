import React, { useState } from "react";
import { GraduationCap, X, Check, Award, BookOpen } from "lucide-react";
import { academicService, settingsService } from "@/services/api";

interface AcademicSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialSemester?: number;
  initialDegree?: string;
  initialGpa?: string;
}

export const AcademicSetupModal: React.FC<AcademicSetupModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  initialSemester = 1,
  initialDegree = "",
  initialGpa = "",
}) => {
  const [degree, setDegree] = useState(initialDegree);
  const [selectedSemester, setSelectedSemester] = useState<number>(initialSemester || 1);
  const [targetGpa, setTargetGpa] = useState(initialGpa);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const gpa = targetGpa ? parseFloat(targetGpa) : undefined;
      await academicService.setActiveSemester(selectedSemester, gpa, degree.trim() || undefined);
      if (degree.trim()) {
        await settingsService.setSetting("academic_degree", degree.trim());
      }
      if (targetGpa.trim()) {
        await settingsService.setSetting("academic_target_gpa", targetGpa.trim());
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save academic profile:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] dark:bg-[#141312] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-200/70 dark:bg-stone-800 flex items-center justify-center text-stone-800 dark:text-stone-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Academic Profile Setup
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Configure your current degree, active semester, and target GPA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Degree / Program */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Degree & Major / Stream
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. B.Tech Computer Science & Engineering"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#0C0B0A] border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 transition"
              />
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Personalizes your dashboard & academic view.
            </p>
          </div>

          {/* Current Semester Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Select Your Current Active Semester
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const isSelected = selectedSemester === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-100 shadow-sm"
                        : "bg-white dark:bg-[#0C0B0A] text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700"
                    }`}
                  >
                    <span>Sem {sem}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target GPA */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Target Semester GPA / CGPA (Optional)
            </label>
            <div className="relative">
              <Award className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 9.0"
                value={targetGpa}
                onChange={(e) => setTargetGpa(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-[#0C0B0A] border border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-600 transition"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 rounded-xl hover:bg-stone-800 dark:hover:bg-stone-200 transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : "Save Academic Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
