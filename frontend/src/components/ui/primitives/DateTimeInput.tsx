import React from "react";

export interface DateTimeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function DateTimeInput({ className = "", ...props }: DateTimeInputProps) {
  return (
    <input
      type="datetime-local"
      className={[
        "w-full px-3 py-2 rounded-md",
        "bg-[var(--card-hover-bg)] text-[var(--text-primary)]",
        "border border-[var(--border-color)]",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export default DateTimeInput;
