import { DependencyList, useCallback, useEffect, useRef } from "react";
import { UnwrapPromise } from "./types";

/**
 * Same as useCallback but returns a debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  ms: number,
  deps: DependencyList | undefined
): T & {
  immediate: T;
  immediateIfPending: (
    ...args: Parameters<T>
  ) => ReturnType<T> extends Promise<any>
    ? Promise<UnwrapPromise<ReturnType<T>> | void>
    : ReturnType<T> | void;
} {
  const timeout = useRef<any>(null);
  const pending = useRef<boolean>(false);
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
        pending.current = true;
        timeout.current = setTimeout(() => {
          pending.current = false;
          callback(...args);
        }, ms);
      } as T,
      [...(deps ?? []), ms]
    ),
    {
      immediate: useCallback(
        function (...args: any[]) {
          if (timeout.current) {
            clearTimeout(timeout.current);
          }
          pending.current = false;
          return callback(...args);
        } as T,
        [...(deps ?? []), ms]
      ),
      immediateIfPending: useCallback(
        function (...args: any[]) {
          if (timeout.current) {
            clearTimeout(timeout.current);
          }
          if (pending.current) {
            pending.current = false;
            return callback(...args);
          }
        } as any,
        [...(deps ?? []), ms]
      ),
    }
  );
}
