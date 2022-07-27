import { DependencyList, useEffect } from "react";

export function useTimeoutEffect(
  effect: (isMounted: () => boolean) => void,
  millis: number,
  deps?: DependencyList
) {
  useEffect(() => {
    let isMounted = true;
    const timeout = setTimeout(() => {
      Promise.resolve(effect(() => isMounted)).then();
    }, millis);
    return () => {
      clearTimeout(timeout);
      isMounted = false;
    };
  }, deps);
}
