import { DependencyList, EffectCallback, useEffect, useRef } from "react";

export function useEffectSkipFirst(
  effect: EffectCallback,
  deps?: DependencyList
) {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
    } else {
      return effect();
    }
  }, deps);
}
