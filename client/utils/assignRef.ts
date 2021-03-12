import { DependencyList, Ref, useMemo } from "react";

export function assignRef<T = any>(ref: Ref<T>, instance: T) {
  if (!ref) {
    return;
  }
  if (typeof ref === "function") {
    ref(instance);
  } else {
    (ref as any).current = instance;
  }
}

export function useAssignMemoRef<T = any>(
  ref: Ref<T>,
  factory: () => T,
  deps: DependencyList | undefined
) {
  const instance = useMemo(factory, deps);
  assignRef(ref, instance);
}
