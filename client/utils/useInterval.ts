import usePrevious from "@react-hook/previous";
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
  const previousIsRunning = usePrevious(isRunning);
  useEffect(() => {
    if (isRunning) {
      let interval: any = undefined;
      const clear = () => {
        if (isNonNullish(interval)) {
          clearInterval(interval);
          interval = undefined;
        }
      };
      interval = setInterval(() => effect(clear), delay);
      if (previousIsRunning === false) {
        effect(clear);
      }
      return clear;
    }
  }, [...(deps ?? []), isRunning, delay]);
}
