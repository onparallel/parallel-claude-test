import { useRouter } from "next/router";
import { MouseEvent, useCallback } from "react";
import { useUpdatingRef } from "./useUpdatingRef";

export function useHandleNavigation() {
  const router = useRouter();
  const ref = useUpdatingRef(router.locale);
  return useCallback(function (url: string, event?: MouseEvent) {
    if (event?.metaKey || event?.ctrlKey) {
      window.open(`/${ref.current}${url}`, "_blank");
    } else {
      router.push(`/${ref.current}${url}`);
    }
  }, []);
}
