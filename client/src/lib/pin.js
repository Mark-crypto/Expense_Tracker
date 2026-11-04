import { useSyncExternalStore } from "react";

// One PIN prompt at a time: every request that hits the PIN waits on the same answer.
let pending = null;
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

export const requestPin = () => {
  if (!pending) {
    let resolve, reject;
    const promise = new Promise((ok, cancel) => {
      resolve = ok;
      reject = cancel;
    });
    pending = { promise, resolve, reject };
    emit();
  }
  return pending.promise;
};

export const settlePin = (unlocked) => {
  const current = pending;
  pending = null;
  emit();
  if (unlocked) current?.resolve();
  else current?.reject(new Error("PIN not entered"));
};

// Same rule as the server: repeats, runs like 1234 or 9876, and pairs like 1212.
export const isWeakPin = (pin) => {
  const digits = [...pin].map(Number);
  const steps = digits.slice(1).map((digit, index) => digit - digits[index]);
  return (
    steps.every((step) => step === 0) ||
    steps.every((step) => step === 1) ||
    steps.every((step) => step === -1) ||
    (pin[0] === pin[2] && pin[1] === pin[3])
  );
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePinRequested = () => useSyncExternalStore(subscribe, () => pending !== null);
