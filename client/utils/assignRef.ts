import { Ref } from "react";

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
