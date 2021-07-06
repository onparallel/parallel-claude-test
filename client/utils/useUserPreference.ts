import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { localStorageGet, localStorageSet } from "./localStorage";

export function useUserPreference<S>(
  name: string,
  defaultValue: S
): [S, Dispatch<SetStateAction<S>>] {
  const [value, setValue] = useState<S>(() => {
    return localStorageGet(name, defaultValue);
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
          localStorageSet(name, next);
          return next;
        });
      },
      [setValue]
    ),
  ];
}
