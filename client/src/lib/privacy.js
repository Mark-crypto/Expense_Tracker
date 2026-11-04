import { useSyncExternalStore } from "react";

const KEY = "hideBalances";
export const MASK = "•••••";

const read = () => {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

let hidden = read();
const listeners = new Set();

// Read by the money formatters, so every amount in the app follows it.
export const balancesHidden = () => hidden;

export const setBalancesHidden = (value) => {
  hidden = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    // Private browsing can refuse storage; it still applies until the tab closes.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useBalancesHidden = () => useSyncExternalStore(subscribe, balancesHidden);
