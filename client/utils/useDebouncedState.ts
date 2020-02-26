import { useState, Dispatch, SetStateAction, useMemo } from "react";
import { useDebouncedCallback } from "./useDebouncedCallback";

export function useDebouncedState<S>(
  initialState: S | (() => S),
  ms: number
): [S, Dispatch<SetStateAction<S>>] {
  const [debounced, setDebounced] = useState(initialState);
  return [debounced, useDebouncedCallback(setDebounced, ms, [])];
}
