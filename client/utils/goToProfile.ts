import { MouseEvent, useCallback } from "react";
import { useHandleNavigation } from "./navigation";

export function useGoToProfile() {
  const navigate = useHandleNavigation();
  return useCallback(function (id: string, event?: MouseEvent) {
    navigate(`/app/profiles/${id}`, event);
  }, []);
}
