import { FocusEventHandler, useMemo, useState } from "react";

export function useFocus<T = any>({
  onFocus,
  onBlur
}: {
  onFocus?: FocusEventHandler<T>;
  onBlur?: FocusEventHandler<T>;
} = {}) {
  const [focused, setFocused] = useState(false);
  return [
    focused,
    useMemo(
      () => ({
        onFocus: <FocusEventHandler<T>>(e => {
          setFocused(true);
          onFocus?.(e);
        }),
        onBlur: <FocusEventHandler<T>>(e => {
          setFocused(false);
          onBlur?.(e);
        })
      }),
      [onFocus, onBlur]
    )
  ] as const;
}
