import { useState, MouseEventHandler, useMemo } from "react";

export function useHover<T = any>({
  onMouseEnter,
  onMouseLeave,
}: {
  onMouseEnter?: MouseEventHandler<T>;
  onMouseLeave?: MouseEventHandler<T>;
} = {}) {
  const [hovered, setHovered] = useState(false);
  return [
    hovered,
    useMemo(
      () => ({
        onMouseEnter: ((e) => {
          setHovered(true);
          onMouseEnter?.(e);
        }) as MouseEventHandler<T>,
        onMouseLeave: ((e) => {
          setHovered(false);
          onMouseLeave?.(e);
        }) as MouseEventHandler<T>,
      }),
      [onMouseEnter, onMouseLeave]
    ),
  ] as const;
}
