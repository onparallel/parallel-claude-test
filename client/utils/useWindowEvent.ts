import { DependencyList, useEffect } from "react";

interface UseWindowEventOptions {
  isListening?: boolean;
}

export function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  callback: (ev: WindowEventMap[K]) => void,
  options: UseWindowEventOptions,
  deps: DependencyList,
): void;
export function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  callback: (ev: WindowEventMap[K]) => void,
  deps: DependencyList,
): void;
export function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  callback: (ev: WindowEventMap[K]) => void,
  optionsOrDeps: UseWindowEventOptions | DependencyList,
  deps?: DependencyList,
) {
  const [_deps, { isListening = true }] = Array.isArray(optionsOrDeps)
    ? [optionsOrDeps, { isListening: true }]
    : [deps!, optionsOrDeps as UseWindowEventOptions];
  useEffect(() => {
    if (!isListening) {
      return;
    }
    window.addEventListener(type, callback);
    return () => window.removeEventListener(type, callback);
  }, [..._deps, isListening]);
}
