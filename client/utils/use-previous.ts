import { useEffect, useRef } from "react";
import { assignRef } from "./assignRef";

export function usePrevious<T>(value: T, initialValue: T): T;
export function usePrevious<T>(value: T): T | undefined;
export function usePrevious<T>(value: T, initialValue?: T): T | undefined {
  const valueRef = useRef(initialValue);
  useEffect(() => {
    assignRef(valueRef, value);
  }, [value]);
  return valueRef.current;
}
