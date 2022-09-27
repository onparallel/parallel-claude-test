import { Dispatch, SetStateAction, useCallback } from "react";

export function useStateSlice<T extends {}, K extends keyof T>(
  state: T,
  setState: Dispatch<SetStateAction<T>>,
  slice: K
): [T[K], Dispatch<SetStateAction<T[K]>>] {
  return [
    state[slice],
    useCallback(
      function (value) {
        setState((prevState) => ({
          ...prevState,
          [slice]: typeof value === "function" ? (value as any)(prevState[slice]) : value,
        }));
      },
      [setState]
    ),
  ];
}
