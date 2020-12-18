import { mode, Styles } from "@chakra-ui/theme-tools";
import { fonts } from "./fonts";

export const styles: Styles = {
  global: (props: any) =>
    [
      fonts,
      {
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
      },
    ] as any,
};
