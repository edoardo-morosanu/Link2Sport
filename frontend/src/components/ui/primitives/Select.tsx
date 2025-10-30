import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      className={[
        "w-full px-3 py-2 border rounded-md shadow-sm",
        "bg-[var(--card-hover-bg)] text-[var(--text-primary)]",
        "border-[var(--border-color)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}

export default Select;
