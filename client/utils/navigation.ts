import { useRouter } from "next/router";
import { MouseEvent, useCallback } from "react";
import { useUpdatingRef } from "./useUpdatingRef";

interface NavigationOptions {
  type?: "push" | "replace";
  shallow?: boolean;
}

export function useHandleNavigation() {
  const router = useRouter();
  const localeRef = useUpdatingRef(
    router.locale === router.defaultLocale ? undefined : router.locale
  );
  return useCallback(function (
    url: string,
    event?: MouseEvent | globalThis.MouseEvent,
    { type = "push", shallow }: NavigationOptions = {}
  ) {
    const path = (localeRef.current ? `/${localeRef.current}` : "") + url;
    if (event?.metaKey || event?.ctrlKey) {
      window.open(path, "_blank");
    } else {
      void router[type](path, undefined, { shallow });
    }
  },
  []);
}
