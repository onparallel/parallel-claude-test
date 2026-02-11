// Adapted from @react-hook/resize-observer, which is unmaintained.
import { useSafeLayoutEffect } from "@chakra-ui/react";
import { RefObject } from "react";
import { useUpdatingRef } from "./useUpdatingRef";

type UseResizeObserverCallback = (entry: ResizeObserverEntry, observer: ResizeObserver) => any;

/**
 * A React hook that fires a callback whenever ResizeObserver detects a change to its size
 *
 * @param target A React ref created by `useRef()` or an HTML element
 * @param callback Invoked with a single `ResizeObserverEntry` any time
 *   the `target` resizes
 */
export function useResizeObserver<T extends HTMLElement>(
  target: RefObject<T | null>,
  callback: UseResizeObserverCallback,
) {
  const storedCallback = useUpdatingRef(callback);
  useSafeLayoutEffect(() => {
    if (!("ResizeObserver" in window)) {
      return () => {};
    }
    const resizeObserver = getResizeObserver();
    let didUnsubscribe = false;
    const targetEl = target && "current" in target ? target.current : target;
    if (!targetEl) return () => {};

    function cb(entry: ResizeObserverEntry, observer: ResizeObserver) {
      if (didUnsubscribe) return;
      storedCallback.current(entry, observer);
    }

    resizeObserver.subscribe(targetEl as HTMLElement, cb);

    return () => {
      didUnsubscribe = true;
      resizeObserver.unsubscribe(targetEl as HTMLElement, cb);
    };
  }, [target, storedCallback]);
}

function createResizeObserver() {
  const callbacks: Map<any, Array<UseResizeObserverCallback>> = new Map();
  let frameId: number | null = null;
  let lastArgs: Parameters<ResizeObserverCallback>;
  const observer = new ResizeObserver((...args) => {
    lastArgs = args;
    if (frameId) {
      return;
    } else {
      frameId = requestAnimationFrame(() => {
        frameId = null;
        const [entries, observer] = lastArgs;
        for (let i = 0; i < entries.length; i++) {
          const cbs = callbacks.get(entries[i].target);
          cbs?.forEach((cb) => cb(entries[i], observer));
        }
      });
    }
  });

  return {
    observer,
    subscribe(target: HTMLElement, callback: UseResizeObserverCallback) {
      observer.observe(target);
      const cbs = callbacks.get(target) ?? [];
      cbs.push(callback);
      callbacks.set(target, cbs);
    },
    unsubscribe(target: HTMLElement, callback: UseResizeObserverCallback) {
      const cbs = callbacks.get(target) ?? [];
      if (cbs.length === 1) {
        observer.unobserve(target);
        callbacks.delete(target);
        return;
      }
      const cbIndex = cbs.indexOf(callback);
      if (cbIndex !== -1) cbs.splice(cbIndex, 1);
      callbacks.set(target, cbs);
    },
  };
}

let _resizeObserver: ReturnType<typeof createResizeObserver>;
const getResizeObserver = () => (_resizeObserver ??= createResizeObserver());
