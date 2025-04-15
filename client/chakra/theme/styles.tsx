import { mode, Styles } from "@chakra-ui/theme-tools";

export const styles: Styles = {
  global: (props: any) => ({
    body: {
      fontFamily: "body",
      color: mode("gray.800", "whiteAlpha.900")(props),
      bg: mode("white", "gray.800")(props),
      transition: "background-color 0.2s",
      lineHeight: "base",
    },
    "*::placeholder": {
      color: mode("gray.400", "whiteAlpha.400")(props),
      opacity: 1,
    },
    "*, *::before, &::after": {
      borderColor: mode("gray.200", "whiteAlpha.300")(props),
      wordWrap: "break-word",
    },
    "@media print": {
      ".no-print, .no-print *": {
        display: "none !important",
      },
      "html, body, #__next, main, div": {
        height: "auto !important",
        width: "auto !important",
        overflow: "visible !important",
        fontSize: "12px !important",
      },
    },
  }),
};
