import { createRef, RefObject, useRef } from "react";
import { useConstant } from "./useConstant";

export type MultipleRefObject<T> = Record<string, RefObject<T>>;

export function useMultipleRefs<T>(): MultipleRefObject<T> {
  const refs = useRef<Record<string, RefObject<T>>>({});
  return useConstant(
    () =>
      new Proxy(refs.current, {
        get(target, id) {
          return target[id as string] ?? (target[id as string] = createRef<T>());
        },
      }),
  );
}
