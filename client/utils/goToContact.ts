import { MouseEvent, useCallback } from "react";
import { useHandleNavigation } from "./navigation";

export function useGoToContact() {
  const navigate = useHandleNavigation();
  return useCallback(function (id: string, event?: MouseEvent) {
    navigate(`/app/contacts/${id}`, event);
  }, []);
}
