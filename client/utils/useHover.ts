import { useState, MouseEventHandler, useMemo } from "react";

export function useHover<T = any>({
  onMouseEnter,
  onMouseLeave
}: {
  onMouseEnter?: MouseEventHandler<T>;
  onMouseLeave?: MouseEventHandler<T>;
} = {}) {
  const [hovered, setHovered] = useState(false);
  return [
    hovered,
    useMemo(
      () => ({
        onMouseEnter: <MouseEventHandler<T>>(e => {
          setHovered(true);
          onMouseEnter?.(e);
        }),
        onMouseLeave: <MouseEventHandler<T>>(e => {
          setHovered(false);
          onMouseLeave?.(e);
        })
      }),
      [onMouseEnter, onMouseLeave]
    )
  ] as const;
}
