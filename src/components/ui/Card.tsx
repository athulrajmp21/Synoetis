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
          "rounded-2xl border border-stone-200/80 dark:border-stone-800/80 bg-[#FAF8F5] dark:bg-[#141312] p-5 shadow-xs transition-all",
          interactive &&
            "hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm cursor-pointer",
          className
        )
      )}
      {...props}
    >
      {children}
    </div>
  );
};
