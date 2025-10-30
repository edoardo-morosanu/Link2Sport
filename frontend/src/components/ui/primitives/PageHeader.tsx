import React from "react";

export interface PageHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, right, className = "" }: PageHeaderProps) {
  return (
    <div className={["flex items-start justify-between", className].join(" ")}> 
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
    </div>
  );
}

export default PageHeader;
