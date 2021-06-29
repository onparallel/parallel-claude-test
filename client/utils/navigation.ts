import { useRouter } from "next/router";
import { MouseEvent, useCallback } from "react";
import { isMac } from "./platform";
import { useUpdatingRef } from "./useUpdatingRef";

export function useHandleNavigation() {
  const router = useRouter();
  const ref = useUpdatingRef(router.query.locale);
  return useCallback(function (url: string, event?: MouseEvent) {
    if ((event?.metaKey && isMac()) || (event?.ctrlKey && !isMac())) {
      window.open(`/${ref.current}${url}`, "_blank");
    } else {
      router.push(`/${ref.current}${url}`);
    }
  }, []);
}
