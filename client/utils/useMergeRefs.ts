import { Ref, useCallback } from "react";

/**
 * Merges 2 refs. This useful for example when using `React.forwardRef` but
 * still want to have a ref to use internally.
 */
export function useMergeRefs<T>(...refs: Ref<T>[]) {
  return useCallback((instance: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        (ref as any).current = instance;
      }
    }
  }, refs);
}
