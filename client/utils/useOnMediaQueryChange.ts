import { useTheme } from "@chakra-ui/react";
import { useEffect } from "react";

export function useOnMediaQueryChange(
  mediaQuery: string,
  handler: (match: boolean) => void
) {
  if (!process.browser) {
    return;
  }

  const { breakpoints } = useTheme();
  if (["sm", "md", "lg", "xl"].includes(mediaQuery)) {
    mediaQuery = `(min-width: ${breakpoints[mediaQuery]})`;
  }

  useEffect(() => {
    const mediaQueryList = window.matchMedia(mediaQuery);
    const changeHandler = () => handler(mediaQueryList.matches);

    mediaQueryList.addEventListener("change", changeHandler);

    changeHandler();
    return () => {
      mediaQueryList.removeEventListener("change", changeHandler);
    };
  }, [mediaQuery, handler]);
}
