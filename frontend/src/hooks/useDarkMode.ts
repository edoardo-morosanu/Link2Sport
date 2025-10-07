import { useState, useEffect } from "react";

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  // Helper function to determine if dark mode should be enabled
  const shouldEnableDarkMode = (
    savedTheme: string | null,
    prefersDark: boolean,
  ): boolean => {
    const hasExplicitDarkTheme = savedTheme === "dark";
    const shouldUseSystemPreference = !savedTheme && prefersDark;

    return hasExplicitDarkTheme || shouldUseSystemPreference;
  };

  useEffect(() => {
    // Check for saved dark mode preference
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (shouldEnableDarkMode(savedTheme, prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return { isDark, toggleDarkMode };
}
