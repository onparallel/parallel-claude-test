import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import { isNonNullish } from "remeda";
import { assignRef } from "./assignRef";
import { useInterval } from "./useInterval";
import { usePageVisibility } from "./usePageVisibility";

export function useCheckForNewVersion() {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const currentVersionRef = useRef<string>();
  const isPageVisible = usePageVisibility();
  useInterval(
    async () => {
      try {
        const res = await fetch("/status");
        const version = await res.text();
        if (isNonNullish(currentVersionRef.current) && currentVersionRef.current !== version) {
          setHasNewVersion(true);
        }
        assignRef(currentVersionRef, version);
      } catch {}
    },
    { delay: 60 * 1000, isRunning: isPageVisible },
    [],
  );
  // when there's a new version force a full reload on the next route change.
  const router = useRouter();
  useEffect(() => {
    function handleRouterChangeStart(path: string) {
      window.location.href = path;
    }
    if (hasNewVersion) {
      router.events.on("routeChangeStart", handleRouterChangeStart);
      return () => router.events.off("routeChangeStart", handleRouterChangeStart);
    }
  }, [hasNewVersion]);
  return hasNewVersion;
}
