import { DependencyList, useEffect } from "react";
import { isDefined } from "remeda";

export function useInterval(
  effect: (clearTimeout: () => void) => void,
  ms?: number,
  deps?: DependencyList
) {
  useEffect(() => {
    let interval: any = undefined;
    const clear = () => {
      if (isDefined(interval)) {
        clearInterval(interval);
        interval = undefined;
      }
    };
    interval = setInterval(() => effect(clear), ms);
    return clear;
  }, deps);
}
