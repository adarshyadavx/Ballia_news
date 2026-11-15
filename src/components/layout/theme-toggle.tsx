"use client";
import { useLayoutEffect } from "react";
import { Moon, Sun } from "lucide-react";

const apply = (dark: boolean) => document.documentElement.classList.toggle("dark", dark);

export function toggleTheme() {
  const root = document.documentElement;
  const next = root.classList.contains("dark") ? "light" : "dark";
  root.classList.add("theme-anim");
  apply(next === "dark");
  try { localStorage.setItem("theme", next); } catch {}
  setTimeout(() => root.classList.remove("theme-anim"), 350);
}

export function ThemeToggle() {
  // React resets <html> classes on the dev remount; put the saved theme back before paint.
  useLayoutEffect(() => {
    try {
      const t = localStorage.getItem("theme") || "system";
      apply(t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches));
    } catch {}
  }, []);

  return (
    <button type="button" onClick={toggleTheme} aria-label="थीम बदलें (लाइट / डार्क)" title="थीम बदलें"
      className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      <Sun size={18} strokeWidth={1.75} className="dark:hidden" />
      <Moon size={18} strokeWidth={1.75} className="hidden dark:block" />
    </button>
  );
}
