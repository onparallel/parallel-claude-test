import { createRef, RefObject, useMemo, useRef } from "react";

export function useMultipleRefs<T>(): Record<string, RefObject<T>> {
  const refs = useRef<Record<string, RefObject<T>>>({});
  return useMemo(
    () =>
      new Proxy(refs.current, {
        get(target, id) {
          return (
            target[id as string] ?? (target[id as string] = createRef<T>())
          );
        },
      }),
    []
  );
}
