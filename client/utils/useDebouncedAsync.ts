import { DependencyList, useCallback, useEffect, useRef } from "react";

/**
 * Similar to useDebouncedCallback but for functions returning promises
 */
export function useDebouncedAsync<TReturn, T extends (...args: any[]) => Promise<TReturn>>(
  callback: T,
  ms: number,
  deps: DependencyList | undefined
): T {
  const timeout = useRef<any>(null);
  const promise = useRef<any>(null);
  useEffect(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
  }, [...(deps ?? []), ms]);
  return useCallback(
    function (...args: any[]) {
      return new Promise<TReturn>((resolve, reject) => {
        if (timeout.current) {
          clearTimeout(timeout.current);
          promise.current!.reject("DEBOUNCED");
        }
        promise.current = { reject };
        timeout.current = setTimeout(async () => {
          try {
            resolve(await callback(...args));
          } catch (error) {
            reject(error);
          } finally {
            timeout.current = null;
            promise.current = null;
          }
        }, ms);
      });
    } as T,
    [...(deps ?? []), ms]
  );
}
