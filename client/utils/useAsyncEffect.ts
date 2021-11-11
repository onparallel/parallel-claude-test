import { DependencyList, useEffect } from "react";
import { MaybePromise } from "./types";

export function useAsyncEffect(
  effect: (isMounted: () => boolean) => MaybePromise<void>,
  deps?: DependencyList
) {
  useEffect(() => {
    let isMounted = true;
    Promise.resolve(effect(() => isMounted)).then();
    return () => {
      isMounted = false;
    };
  }, deps);
}
