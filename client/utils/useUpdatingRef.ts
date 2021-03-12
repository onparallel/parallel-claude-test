import { useRef, useMemo, RefObject, DependencyList } from "react";
import { assignRef } from "./assignRef";

export function useUpdatingRef<T>(value: T) {
  const ref = useRef(value);
  assignRef(ref, value);
  return ref;
}

export function useUpdatingMemoRef<T>(
  factory: () => T,
  deps: DependencyList | undefined
): RefObject<T> {
  const instance = useMemo(factory, deps);
  return useUpdatingRef(instance);
}
