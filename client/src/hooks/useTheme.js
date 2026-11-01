import { useSyncExternalStore } from "react";

const listeners = new Set();

const getTheme = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const toggleTheme = () => {
  const next = getTheme() === "dark" ? "light" : "dark";
  document.documentElement.classList.toggle("dark", next === "dark");
  localStorage.setItem("theme", next);
  listeners.forEach((listener) => listener());
};

export const useTheme = () => useSyncExternalStore(subscribe, getTheme);
