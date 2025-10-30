"use client";

import React from "react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed";

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700",
  secondary: "bg-[var(--card-hover-bg)] text-[var(--text-primary)] hover:bg-[var(--card-bg)] border border-[var(--border-color)]",
  outline: "border border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-hover-bg)]",
  ghost: "text-[var(--text-secondary)] hover:bg-[var(--card-hover-bg)]",
  danger: "border border-red-300 text-red-700 hover:bg-red-50/60",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        base,
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export default Button;
