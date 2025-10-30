import React from "react";

export interface AppShellProps extends React.HTMLAttributes<HTMLElement> {
  wide?: boolean;
}

export function AppShell({ children, wide = false, className = "", ...props }: AppShellProps) {
  return (
    <main
      className={[
        wide ? "max-w-7xl" : "max-w-6xl",
        "mx-auto px-4 py-6",
        className,
      ].join(" ")}
      {...props}
    >
      {children}
    </main>
  );
}

export default AppShell;
