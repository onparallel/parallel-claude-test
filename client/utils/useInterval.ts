import { DependencyList, useEffect } from "react";
import { isNonNullish } from "remeda";

interface UserIntervalOptions {
  delay?: number;
  isRunning?: boolean;
}

export function useInterval(
  effect: (clearTimeout: () => void) => void,
  delayOrOptions?: number | UserIntervalOptions,
  deps?: DependencyList,
) {
  const { delay, isRunning = true } =
    typeof delayOrOptions === "number"
      ? { delay: delayOrOptions, isRunning: true }
      : (delayOrOptions ?? {});
  useEffect(() => {
    if (!isRunning) {
      return;
    }
    let interval: any = undefined;
    const clear = () => {
      if (isNonNullish(interval)) {
        clearInterval(interval);
        interval = undefined;
      }
    };
    interval = setInterval(() => effect(clear), delay);
    return clear;
  }, [...(deps ?? []), isRunning, delay]);
}
