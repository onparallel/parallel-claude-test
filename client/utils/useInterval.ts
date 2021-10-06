import { DependencyList, useEffect } from "react";

export function useInterval(effect: () => void, ms?: number, deps?: DependencyList) {
  useEffect(() => {
    const interval = setInterval(effect, ms);
    return () => clearInterval(interval);
  }, deps);
}
