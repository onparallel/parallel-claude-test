import { MouseEvent, useCallback } from "react";
import { useHandleNavigation } from "./navigation";

export function useGoToPetition() {
  const navigate = useHandleNavigation();
  return useCallback(function (
    id: string,
    section: "compose" | "replies" | "activity" | "preview",
    event?: MouseEvent
  ) {
    navigate(`/app/petitions/${id}/${section}`, event);
  },
  []);
}
