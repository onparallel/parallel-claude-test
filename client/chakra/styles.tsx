import theme from "@chakra-ui/theme";
import { Styles } from "@chakra-ui/theme-tools";

export const styles: Styles = {
  global: (props: any) => ({
    ...(theme.styles?.global as any)?.(props),
    // Hubspot stuff
    "div#hubspot-messages-iframe-container": {
      display: "none !important",
    },
    "@media screen and (min-width: 30em)": {
      "div#hubspot-messages-iframe-container": {
        display: "block !important",
      },
    },
  }),
};
