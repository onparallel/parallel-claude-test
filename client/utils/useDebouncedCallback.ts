import { useMemo, DependencyList } from "react";

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  ms: number,
  deps: DependencyList | undefined
): T {
  return useMemo(() => {
    let timeout: ReturnType<typeof setTimeout>;
    return function(...args: any[]) {
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(callback, ms, ...args);
    } as T;
  }, [...(deps ?? []), ms]);
}
