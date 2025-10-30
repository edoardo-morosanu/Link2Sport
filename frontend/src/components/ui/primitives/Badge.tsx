import React from "react";

type BadgeVariant = "neutral" | "success" | "info" | "warning";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-[var(--card-hover-bg)] text-[var(--text-secondary)]",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
};

export function Badge({ variant = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <div
      className={["px-2 py-0.5 text-xs rounded-full", variantClasses[variant], className].join(" ")}
      {...props}
    />
  );
}

export default Badge;
