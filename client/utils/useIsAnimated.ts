import { MotionValue, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export function useIsAnimated(value: MotionValue<number>) {
  const [isAnimated, setIsAnimated] = useState(false);

  useMotionValueEvent(value, "change", (latest) => {
    if (latest !== 0) {
      setIsAnimated(true);
    } else {
      setIsAnimated(false);
    }
  });

  return isAnimated;
}
