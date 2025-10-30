import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid = false, className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "w-full px-4 py-3 rounded-xl bg-[var(--card-hover-bg)] text-[var(--text-primary)]",
        "border focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        invalid ? "border-red-300" : "border-[var(--border-color)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export default Input;
