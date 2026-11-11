import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: string;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  onClick,
  className = "",
}) => {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#141312] border border-stone-200/80 dark:border-stone-800/80 flex flex-col justify-between hover:border-stone-300 dark:hover:border-stone-700 transition ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            {trend && <span className="text-emerald-500 font-medium">{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
};
