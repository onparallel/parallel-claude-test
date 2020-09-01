import { DependencyList, useCallback, useEffect, useRef } from "react";

/**
 * Same as useCallback but returns a debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  ms: number,
  deps: DependencyList | undefined
): T & { immediate: T } {
  const timeout = useRef<any>(null);
  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, [...(deps ?? []), ms]);
  return Object.assign(
    useCallback(
      function (...args: any[]) {
        if (timeout.current) {
          clearTimeout(timeout.current);
        }
        timeout.current = setTimeout(callback, ms, ...args);
      } as T,
      [...(deps ?? []), ms]
    ),
    {
      immediate: useCallback(
        function (...args: any[]) {
          if (timeout.current) {
            clearTimeout(timeout.current);
          }
          callback(...args);
        } as T,
        [...(deps ?? []), ms]
      ),
    }
  );
}
