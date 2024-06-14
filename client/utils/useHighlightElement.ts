import { useCallback } from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";
import { waitFor } from "./promises/waitFor";

export function useHighlightElement() {
  return useCallback(async (element: Element | null, omitScroll?: boolean) => {
    if (element) {
      if (!omitScroll) {
        await scrollIntoView(element, {
          scrollMode: "if-needed",
          behavior: "smooth",
        });
      }

      element.setAttribute("data-highlighted", "true");
      waitFor(1000).then(() => {
        element.removeAttribute("data-highlighted");
      });
    }
  }, []);
}
