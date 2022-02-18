import { useRef } from "react";

/**
 *  Like useMemo but guaranteeing the function is called just once.
 */
export function useConstant<T>(fn: () => T): T {
  const ref = useRef<{ value: T } | null>(null);
  if (ref.current === null) {
    ref.current = { value: fn() };
  }
  return ref.current.value;
}
