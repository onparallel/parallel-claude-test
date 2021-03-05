import { useRef } from "react";
import { assignRef } from "./assignRef";

export function useUpdatingRef<T>(value: T) {
  const ref = useRef(value);
  assignRef(ref, value);
  return ref;
}
