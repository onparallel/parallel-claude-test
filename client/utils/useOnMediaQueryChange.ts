import { useTheme } from "@chakra-ui/react";
import { useEffect } from "react";

export function useOnMediaQueryChange(mediaQuery: string, handler: (match: boolean) => void) {
  if (typeof window === "undefined") {
    return;
  }

  const { breakpoints } = useTheme();
  if (["sm", "md", "lg", "xl"].includes(mediaQuery)) {
    mediaQuery = `(min-width: ${breakpoints[mediaQuery]})`;
  }

  useEffect(() => {
    const mediaQueryList = window.matchMedia(mediaQuery);
    const changeHandler = () => handler(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", changeHandler);
    } else {
      mediaQueryList.addListener(changeHandler);
    }

    changeHandler();
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener("change", changeHandler);
      } else {
        mediaQueryList.removeListener(changeHandler);
      }
    };
  }, [mediaQuery, handler]);
}
