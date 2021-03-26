import { keyframes, Theme } from "@chakra-ui/react";
import { useMemo } from "react";
import scrollIntoView from "smooth-scroll-into-view-if-needed";

export function useHighlightElement() {
  return useMemo(
    () => ({
      highlight: async (queryElement: string) => {
        const element = document.querySelector(queryElement);
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
      },
      highlightProps: {
        _highlighted: {
          animation: ((theme: Theme) =>
            `${keyframes`
                0% { background-color: white; }
                25% { background-color: ${theme.colors.gray[100]}; }
                50% { background-color: white }
                75% { background-color: ${theme.colors.gray[100]}; }
                100% { background-color: white; }
                `} 500ms ease`) as any,
        },
      },
    }),
    []
  );
}
