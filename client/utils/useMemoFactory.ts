import { DependencyList, useMemo, useRef } from "react";

export function useMemoFactory<TArgs extends any[], TResult>(
  builder: (...args: TArgs) => TResult,
  deps: DependencyList
): (...args: TArgs) => TResult;
export function useMemoFactory<TArgs extends any[], TResult>(
  builder: (...args: TArgs) => TResult,
  resolver: (...args: TArgs) => string,
  deps: DependencyList
): (...args: TArgs) => TResult;
export function useMemoFactory<TArgs extends any[], TResult>(
  builder: (...args: TArgs) => TResult,
  resolverOrDeps: ((...args: TArgs) => string) | DependencyList,
  maybeDeps?: DependencyList
): (...args: TArgs) => TResult {
  const resolve =
    typeof resolverOrDeps === "function"
      ? resolverOrDeps
      : (...args: TArgs) => `${args}`;
  const deps =
    typeof resolverOrDeps === "function" ? maybeDeps! : resolverOrDeps;
  const cache = useRef(new Map<string, TResult>());
  return useMemo(() => {
    cache.current.clear();
    return function (...args: TArgs) {
      const key = resolve(...args);
      if (!cache.current.has(key)) {
        cache.current.set(key, builder(...args));
      }
      return cache.current.get(key)!;
    };
  }, deps);
}
