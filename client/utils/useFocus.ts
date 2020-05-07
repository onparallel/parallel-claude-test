import { FocusEventHandler, useMemo, useState } from "react";

export function useFocus<T = any>({
  onFocus,
  onBlur,
}: {
  onFocus?: FocusEventHandler<T>;
  onBlur?: FocusEventHandler<T>;
} = {}) {
  const [focused, setFocused] = useState(false);
  return [
    focused,
    useMemo(
      () => ({
        onFocus: ((e) => {
          setFocused(true);
          onFocus?.(e);
        }) as FocusEventHandler<T>,
        onBlur: ((e) => {
          setFocused(false);
          onBlur?.(e);
        }) as FocusEventHandler<T>,
      }),
      [onFocus, onBlur]
    ),
  ] as const;
}
