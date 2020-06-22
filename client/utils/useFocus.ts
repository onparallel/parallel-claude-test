import { FocusEventHandler, useMemo, useState, useRef } from "react";

export function useFocus<T = any>({
  onFocus,
  onBlur,
  onBlurDelay,
}: {
  onFocus?: FocusEventHandler<T>;
  onBlur?: FocusEventHandler<T>;
  onBlurDelay?: number;
} = {}) {
  const blurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);
  return [
    focused,
    useMemo(
      () => ({
        onFocus: ((e) => {
          if (blurRef.current) {
            clearTimeout(blurRef.current);
            blurRef.current = null;
          }
          setFocused(true);
          onFocus?.(e);
        }) as FocusEventHandler<T>,
        onBlur: ((e) => {
          blurRef.current = setTimeout(() => {
            setFocused(false);
          }, onBlurDelay ?? 0);
          onBlur?.(e);
        }) as FocusEventHandler<T>,
      }),
      [onFocus, onBlur]
    ),
  ] as const;
}
