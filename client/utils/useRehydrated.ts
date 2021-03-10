import { DependencyList, EffectCallback, useEffect, useState } from "react";

let rehydrated = false;

export function useRehydrated() {
  const [_, rerender] = useState(0);
  useEffect(() => {
    rehydrated = true;
    rerender(1);
  }, []);
  return rehydrated;
}

export function useRehydratedEffect(
  effect: EffectCallback,
  deps?: DependencyList
) {
  const rehydrated = useRehydrated();
  useEffect(() => {
    if (rehydrated) {
      return effect();
    }
  }, [rehydrated, ...deps!]);
}
