import { MaybePromise } from "@parallel/utils/types";
import { useUpdatingRef } from "@parallel/utils/useUpdatingRef";
import { useRouter } from "next/router";
import { useEffect } from "react";

interface PreventNavigationOptions {
  shouldConfirmNavigation: boolean | ((path: string) => boolean);
  confirmNavigation: () => MaybePromise<boolean>;
}

export function usePreventNavigation(options: PreventNavigationOptions) {
  const optionsRef = useUpdatingRef(options);
  const router = useRouter();
  useEffect(() => {
    let omitNextRouteChange = false;
    async function confirmRouteChange(path: string) {
      try {
        const result = await optionsRef.current.confirmNavigation();
        if (result) {
          omitNextRouteChange = true;
          router.push(path);
        }
      } catch {}
    }
    function handleRouteChangeStart(path: string) {
      if (omitNextRouteChange) {
        return;
      }
      const prevent =
        typeof optionsRef.current.shouldConfirmNavigation === "boolean"
          ? optionsRef.current.shouldConfirmNavigation
          : optionsRef.current.shouldConfirmNavigation(path);
      if (prevent) {
        void confirmRouteChange(path);
        router.events.emit("routeChangeError");
        throw "CANCEL_ROUTE_CHANGE";
      }
    }
    router.events.on("routeChangeStart", handleRouteChangeStart);
    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
    };
  }, []);
}
