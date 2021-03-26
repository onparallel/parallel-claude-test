import { useCallback } from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

export function useHighlightElement() {
  return useCallback(async (element: Element | null) => {
    if (element) {
      await scrollIntoView(element, {
        scrollMode: "if-needed",
        behavior: "smooth",
      });
      element.setAttribute("data-highlighted", "true");
      setTimeout(() => {
        element.removeAttribute("data-highlighted");
      }, 1000);
    }
  }, []);
}
