import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer";

    const variants = {
      primary:
        "bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 shadow-xs border border-transparent",
      secondary:
        "bg-stone-200/70 hover:bg-stone-200 text-stone-900 border border-stone-300/60 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-100 dark:border-stone-700/60",
      outline:
        "bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800",
      ghost:
        "bg-transparent hover:bg-stone-100 dark:hover:bg-stone-800/60 text-stone-700 dark:text-stone-300 border border-transparent",
      danger:
        "bg-rose-600 hover:bg-rose-500 text-white shadow-xs border border-rose-500/30",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-1.5 gap-1.5",
      md: "text-sm px-3.5 py-2 gap-2",
      lg: "text-base px-4 py-2.5 gap-2.5",
      icon: "h-9 w-9 p-0",
    };

    return (
      <button
        ref={ref}
        className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
