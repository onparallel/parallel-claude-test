import { DependencyList, useCallback, useRef } from "react";
import { useEffectSkipFirst } from "./useEffectSkipFirst";

/**
 * Similar to useDebouncedCallback but for functions returning promises
 */
export function useDebouncedAsync<TReturn, T extends (...args: any[]) => Promise<TReturn>>(
  callback: T,
  ms: number,
  deps: DependencyList | undefined,
): T {
  const timeout = useRef<any>(null);
  const promise = useRef<any>(null);
  useEffectSkipFirst(() => {
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
          } catch (error: any) {
            reject(error);
          } finally {
            timeout.current = null;
            promise.current = null;
          }
        }, ms);
      });
    } as T,
    [...(deps ?? []), ms],
  );
}
