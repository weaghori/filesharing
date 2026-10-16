"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Schedule asynchronous read to prevent cascading render lint warnings
    const timer = setTimeout(() => {
      try {
        const isDark = document.documentElement.classList.contains("dark");
        const stored = localStorage.getItem("aghori-theme");
        const current = stored || (isDark ? "dark" : "light");
        setTheme(current);
        setMounted(true);

        // Ensure both class and data-theme are synchronized
        document.documentElement.setAttribute("data-theme", current);
        if (current === "dark") {
          document.documentElement.classList.add("dark");
          document.documentElement.classList.remove("light");
        } else {
          document.documentElement.classList.remove("dark");
          document.documentElement.classList.add("light");
        }
      } catch {
        setMounted(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    try {
      localStorage.setItem("aghori-theme", nextTheme);
    } catch {}

    // Apply directly to root HTML element
    document.documentElement.setAttribute("data-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-300 dark:border-[#151E32] bg-white dark:bg-[#0B1220] text-zinc-800 dark:text-[#94A3B8] shadow-sm transition-all hover:border-zinc-950 dark:hover:border-[#2563EB]/50 hover:text-zinc-950 dark:hover:text-white dark:hover:shadow-[0_0_12px_rgba(37,99,235,0.25)] active:scale-95"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {!mounted ? (
        <span className="h-4 w-4" />
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-zinc-900 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}
