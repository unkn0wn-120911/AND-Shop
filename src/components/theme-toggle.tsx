"use client";

import { useEffect, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function getThemeSnapshot() {
  if (typeof window === "undefined") return false;
  try {
    const saved = window.localStorage.getItem("and-shop-theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch (error) {
    console.error("Could not read the saved theme preference.", error);
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
}

function subscribeToTheme(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  function toggle() {
    const next = !dark;
    try {
      window.localStorage.setItem("and-shop-theme", next ? "dark" : "light");
    } catch (error) {
      console.error("Could not save the theme preference.", error);
    }
    listeners.forEach((listener) => listener());
  }

  return (
    <button className="icon-button" type="button" onClick={toggle} aria-label={`Switch to ${dark ? "light" : "dark"} theme`}>
      {dark ? "☼" : "◐"}
    </button>
  );
}
