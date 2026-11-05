import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  interactive = false,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          "rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-5 shadow-xs transition-all",
          interactive &&
            "hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
