import { Dispatch, SetStateAction, useCallback, useState } from "react";

export function useUserPreference<S>(
  name: string,
  defaultValue: S
): [S, Dispatch<SetStateAction<S>>] {
  const [value, setValue] = useState<S>(() => {
    try {
      const stored = localStorage.getItem(name);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  return [
    value,
    useCallback(
      (dispatch: SetStateAction<S>) => {
        setValue((current) => {
          const next =
            typeof dispatch === "function"
              ? ((dispatch as any)(current) as S)
              : dispatch;
          try {
            localStorage.setItem(name, JSON.stringify(next));
          } catch {}
          return next;
        });
      },
      [setValue]
    ),
  ];
}
