"use client";

import { useEffect, useMemo, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";

type Theme = "light" | "dark" | "system";

function getSystemPrefersDark() {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  const doc = document.documentElement;
  const setDark = (on: boolean) => (on ? doc.classList.add("dark") : doc.classList.remove("dark"));
  const setLight = (on: boolean) => (on ? doc.classList.add("light") : doc.classList.remove("light"));

  if (theme === "dark") {
    setDark(true);
    setLight(false);
  } else if (theme === "light") {
    setDark(false);
    setLight(true);
  } else {
    setLight(false);
    setDark(getSystemPrefersDark());
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("theme") as Theme) || "system";
      setTheme(saved);
      applyTheme(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    mq.addEventListener?.("change", listener);
    return () => mq.removeEventListener?.("change", listener);
  }, [theme]);

  const Icon = useMemo(() => {
    if (theme === "light") return Sun;
    if (theme === "dark") return Moon;
    return Laptop;
  }, [theme]);

  function cycleTheme() {
    const next: Theme = theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
    applyTheme(next);
  }

  const label = theme === "system" ? "System" : theme === "light" ? "Light" : "Dark";

  return (
    <button
      onClick={cycleTheme}
      aria-label={`Toggle theme (current: ${label})`}
      title={`Theme: ${label}`}
      className="p-2 hover:bg-[var(--card-hover-bg)] rounded-full transition-colors duration-200"
    >
      <Icon className="w-5 h-5 text-[var(--text-muted)]" />
    </button>
  );
}

export default ThemeToggle;
