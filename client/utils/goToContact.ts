import { useRouter } from "next/router";
import { useCallback, useRef } from "react";
import { useIntl } from "react-intl";
import { assignRef } from "./assignRef";

export function useGoToContact() {
  const router = useRouter();
  const intl = useIntl();
  const localeRef = useRef<string>(intl.locale);
  assignRef(localeRef, intl.locale);
  return useCallback((id: string) => {
    router.push(`/${localeRef.current}/app/contacts/${id}`);
  }, []);
}
