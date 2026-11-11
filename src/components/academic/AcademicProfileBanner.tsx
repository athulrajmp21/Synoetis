import React from "react";
import { GraduationCap, ArrowRight, Settings } from "lucide-react";

interface AcademicProfileBannerProps {
  currentSemester?: string;
  degree?: string;
  onOpenSetup: () => void;
  className?: string;
}

export const AcademicProfileBanner: React.FC<AcademicProfileBannerProps> = ({
  currentSemester,
  degree,
  onOpenSetup,
  className = "",
}) => {
  const isConfigured = currentSemester && currentSemester !== "Not Set";

  if (isConfigured) {
    return (
      <div
        className={`flex items-center justify-between px-4 py-3 bg-[#F3EFEA] dark:bg-[#191816] rounded-xl border border-stone-200/80 dark:border-stone-800/80 text-stone-800 dark:text-stone-200 text-xs ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold">{currentSemester}</span>
            {degree && (
              <span className="text-stone-500 dark:text-stone-400 ml-2">
                • {degree}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onOpenSetup}
          className="flex items-center gap-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition cursor-pointer"
        >
          <Settings className="w-3 h-3" />
          <span>Change</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-900 dark:text-amber-200 text-xs ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold">Academic Profile Not Configured:</span>{" "}
          <span className="text-stone-600 dark:text-stone-400">
            Set your active semester & degree to tailor your study plans and GPA tracking.
          </span>
        </div>
      </div>
      <button
        onClick={onOpenSetup}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 rounded-lg text-xs font-medium hover:opacity-90 transition shrink-0 cursor-pointer shadow-xs ml-3"
      >
        <span>Set Semester</span>
        <ArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
};
