import { MotionValue } from "framer-motion";
import { useEffect, useState } from "react";

export function useIsAnimated(value: MotionValue<number>) {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    let isActive = false;
    value.onChange((latest) => {
      const wasActive = isActive;
      if (latest !== 0) {
        isActive = true;
        if (isActive !== wasActive) {
          setIsAnimated(true);
        }
      } else {
        isActive = false;
        if (isActive !== wasActive) {
          setIsAnimated(false);
        }
      }
    });
  }, [value]);

  return isAnimated;
}
