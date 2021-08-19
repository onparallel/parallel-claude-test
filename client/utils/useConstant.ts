import { useRef } from "react";

/**
 *  Like useMemo but guaranteeing the function is called just once.
 */
export function useConstant<T>(fn: () => T): T {
  const ref = useRef<{ value: T }>({ value: fn() });
  return ref.current.value;
}
