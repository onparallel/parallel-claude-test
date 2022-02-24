import { MouseEvent, useCallback } from "react";
import { useHandleNavigation } from "./navigation";

export function useGoToPetition() {
  const navigate = useHandleNavigation();
  return useCallback(function (
    id: string,
    section: "compose" | "replies" | "activity" | "preview",
    options?: {
      event?: MouseEvent;
      query?: Record<string, string>;
    }
  ) {
    let url = `/app/petitions/${id}/${section}`;
    if (options?.query) {
      url += `?${new URLSearchParams(options.query)}`;
    }
    navigate(url, options?.event);
  }, []);
}
