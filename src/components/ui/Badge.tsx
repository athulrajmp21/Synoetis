import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "md",
  className,
}) => {
  const variants = {
    default:
      "bg-stone-200/60 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border-stone-200 dark:border-stone-700",
    accent:
      "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 border-stone-800 dark:border-stone-200",
    success:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    warning:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    danger:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
    outline:
      "bg-transparent text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800",
  };

  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5 font-medium rounded-md",
    md: "text-xs px-2 py-0.5 font-medium rounded-lg",
  };

  return (
    <span
      className={twMerge(
        clsx(
          "inline-flex items-center gap-1 border tracking-wide",
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {children}
    </span>
  );
};
