import { DependencyList, RefObject, useMemo, useRef } from "react";
import { assignRef } from "./assignRef";

export function useUpdatingRef<T>(value: T) {
  const ref = useRef(value);
  assignRef(ref, value);
  return ref;
}

export function useUpdatingMemoRef<T>(factory: () => T, deps: DependencyList): RefObject<T> {
  const instance = useMemo(factory, deps);
  return useUpdatingRef(instance);
}
