import { Ref, RefCallback, useMemo } from "react";
import { assignRef } from "./assignRef";

export function useMergeRefs<T>(...refs: (Ref<T> | undefined)[]): RefCallback<T> {
  return useMemo(
    () => (value: T | null) => {
      const cleanups: (() => void)[] = [];

      for (const ref of refs) {
        const cleanup = assignRef(ref, value);
        const isCleanup = typeof cleanup === "function";
        cleanups.push(isCleanup ? cleanup : () => assignRef(ref, null));
      }

      return () => {
        for (const cleanup of cleanups) {
          cleanup();
        }
      };
    },
    refs,
  );
}
