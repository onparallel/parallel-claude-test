import { useState, FocusEventHandler } from "react";

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
    {
      onFocus: <FocusEventHandler<T>>(e => {
        setFocused(true);
        onFocus && onFocus(e);
      }),
      onBlur: <FocusEventHandler<T>>(e => {
        setFocused(false);
        onBlur && onBlur(e);
      })
    }
  ] as const;
}
