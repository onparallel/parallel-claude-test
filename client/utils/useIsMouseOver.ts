import { RefObject, useEffect, useState } from "react";

export function useIsMouseOver(ref: RefObject<HTMLElement>) {
  const [isMouseOver, setIsMouseOver] = useState(false);
  useEffect(() => {
    function handleMouseEnter() {
      setIsMouseOver(true);
    }
    function handleMouseLeave() {
      setIsMouseOver(false);
    }
    ref.current?.addEventListener("mouseenter", handleMouseEnter);
    ref.current?.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      ref.current?.removeEventListener("mouseenter", handleMouseEnter);
      ref.current?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [ref.current]);
  return isMouseOver;
}
