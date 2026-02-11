import { useRouter } from "next/router";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";
import { isNonNullish, isNullish } from "remeda";
import { openNewWindow } from "../openNewWindow";
import { useInterval } from "../useInterval";
import { useWindowEvent } from "../useWindowEvent";

export interface ManagedWindowState {
  state: "IDLE" | "FETCHING";
  browserTabRef: RefObject<Window | undefined>;
  setState: (state: "IDLE" | "FETCHING") => void;
  openWindow: (url: string) => Promise<void>;
  closeWindow: () => void;
}

export function useManagedWindow({
  refreshInterval = 5000,
  onRefreshField,
}: {
  refreshInterval?: number;
  onRefreshField: () => void;
}): ManagedWindowState {
  const [state, setState] = useState<"IDLE" | "FETCHING">("IDLE");
  const browserTabRef = useRef<Window>(undefined);
  const router = useRouter();

  useInterval(
    async (done) => {
      if (isNonNullish(browserTabRef.current) && browserTabRef.current.closed) {
        setState("IDLE");
        done();
      } else if (state === "FETCHING") {
        onRefreshField();
      }
    },
    refreshInterval,
    [onRefreshField, state],
  );

  useEffect(() => {
    const handleRouteChange = () => {
      if (isNonNullish(browserTabRef.current)) {
        browserTabRef.current.close();
      }
    };

    router.events.on("routeChangeStart", handleRouteChange);

    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, []);

  useWindowEvent(
    "message",
    async (e) => {
      const browserTab = browserTabRef.current;
      if (isNullish(browserTab) || e.source !== browserTab) {
        return;
      }
      if (e.data === "refresh") {
        onRefreshField();
      }
    },
    [onRefreshField],
  );

  const openWindow = useCallback(async (url: string) => {
    setState("FETCHING");
    try {
      browserTabRef.current = await openNewWindow(url);
    } catch {}
  }, []);

  const closeWindow = useCallback(() => {
    setState("IDLE");
    browserTabRef.current?.close();
  }, []);

  return {
    state,
    browserTabRef,
    setState,
    openWindow,
    closeWindow,
  };
}
