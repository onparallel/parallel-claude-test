import { DependencyList, useCallback, useEffect, useRef } from "react";

/**
 * Same as useCallback but returns a debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  ms: number,
  deps: DependencyList | undefined
): T {
  const timeout = useRef<any>(null);
  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, [...(deps ?? []), ms]);
  return useCallback(
    function (...args: any[]) {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(callback, ms, ...args);
    } as T,
    [...(deps ?? []), ms]
  );
}
