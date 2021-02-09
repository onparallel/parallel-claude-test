import { Dispatch, SetStateAction, useState } from "react";
import { useEffectSkipFirst } from "./useEffectSkipFirst";

export function useUserPreference<S>(
  name: string,
  defaultValue: S
): [S, Dispatch<SetStateAction<S>>] {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(name);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffectSkipFirst(() => {
    try {
      localStorage.setItem(name, value);
    } catch {}
  }, [value]);
  return [value, setValue];
}
