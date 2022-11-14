import { useCallback, DependencyList, useRef } from "react";

export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const depsRef = useRef<DependencyList>();
  const resultRef = useRef<any>();
  return useCallback(
    ((...args) => {
      if (!depsAreEqual(deps, depsRef.current)) {
        depsRef.current = deps;
        resultRef.current = callback(...args);
      }
      return resultRef.current;
    }) as T,
    deps
  );
}

function depsAreEqual(d1: DependencyList | undefined, d2: DependencyList | undefined) {
  if (!d1 || !d2 || d1.length !== d2.length) {
    return false;
  }
  for (let i = 0; i < d1.length; ++i) {
    if (d1[i] !== d2[i]) {
      return false;
    }
  }
  return true;
}
