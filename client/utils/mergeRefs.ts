import { Ref } from "react";

export function mergeRefs<T>(...refs: Ref<T>[]): Ref<T> {
  return (value: T) => {
    for (const ref of refs) {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref) {
        (ref as any).current = value;
      }
    }
  };
}
