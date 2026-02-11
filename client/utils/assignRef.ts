import { Ref, RefCallback } from "react";

export function assignRef<T = any>(
  ref: Ref<T> | undefined,
  instance: T,
): ReturnType<RefCallback<T>> {
  if (!ref) {
    return;
  }
  if (typeof ref === "function") {
    return ref(instance);
  } else {
    (ref as any).current = instance;
  }
}
