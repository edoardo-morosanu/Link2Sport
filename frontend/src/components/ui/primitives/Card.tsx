import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const padMap = {
  none: "p-0",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export function Card({ padding = "md", interactive = false, className = "", ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]",
        interactive ? "hover:bg-[var(--card-hover-bg)] transition-colors" : "",
        padMap[padding],
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export default Card;
