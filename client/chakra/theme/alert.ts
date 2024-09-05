import { alertAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
import { cssVar, transparentize } from "@chakra-ui/theme-tools";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(
  alertAnatomy.keys,
);
export const alertTheme = defineMultiStyleConfig({
  variants: {
    subtle: definePartsStyle((props) => {
      const { theme, colorScheme: c } = props;
      const $fg = cssVar("alert-fg");
      const $bg = cssVar("alert-bg");
      return {
        container: {
          overflow: undefined,
          [$fg.variable]: c === "orange" ? `colors.yellow.500` : `colors.${c}.500`,
          [$bg.variable]: `colors.${c}.100`,
          _dark: {
            [$fg.variable]: `colors.${c}.200`,
            [$bg.variable]: transparentize(`${c}.200`, 0.16)(theme),
          },
        },
      };
    }),
  },
});
