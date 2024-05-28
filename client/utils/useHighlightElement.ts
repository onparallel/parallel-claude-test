import { useCallback } from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { waitFor } from "./promises/waitFor";

export function useHighlightElement() {
  return useCallback(async (element: Element | null) => {
    if (element) {
      await scrollIntoView(element, {
        scrollMode: "if-needed",
        behavior: "smooth",
      });

      element.setAttribute("data-highlighted", "true");
      await waitFor(1000);
      element.removeAttribute("data-highlighted");
    }
  }, []);
}
