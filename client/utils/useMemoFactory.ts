import { DependencyList, useMemo, useRef } from "react";

export function useMemoFactory<T extends (...args: any[]) => any>(
  builder: T,
  deps: DependencyList
): T;
export function useMemoFactory<T extends (...args: any[]) => any>(
  builder: T,
  resolver: (...args: Parameters<T>) => string,
  deps: DependencyList
): T;
export function useMemoFactory<T extends (...args: any[]) => any>(
  builder: T,
  depsOrResolver: DependencyList | ((...args: Parameters<T>) => string),
  maybeDeps?: DependencyList
): T {
  const resolve =
    typeof depsOrResolver === "function" ? depsOrResolver : (...args: Parameters<T>) => `${args}`;
  const deps = typeof depsOrResolver === "function" ? maybeDeps! : depsOrResolver;
  const cache = useRef(new Map<string, ReturnType<T>>());
  return useMemo(() => {
    cache.current.clear();
    return function (...args: Parameters<T>) {
      const key = resolve(...args);
      if (!cache.current.has(key)) {
        cache.current.set(key, builder(...args));
      }
      return cache.current.get(key);
    } as T;
  }, deps);
}
