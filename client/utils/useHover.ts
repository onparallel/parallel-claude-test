import { useState, MouseEventHandler } from "react";

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
    {
      onMouseEnter: <MouseEventHandler<T>>(e => {
        setHovered(true);
        onMouseEnter?.(e);
      }),
      onMouseLeave: <MouseEventHandler<T>>(e => {
        setHovered(false);
        onMouseLeave?.(e);
      })
    }
  ] as const;
}
