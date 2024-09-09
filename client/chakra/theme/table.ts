import { tableAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(
  tableAnatomy.keys,
);

export const tableTheme = defineMultiStyleConfig({
  variants: {
    parallel: definePartsStyle((props) => {
      return {
        table: {
          borderCollapse: "separate",
          borderSpacing: 0,
          borderInline: "1px solid",
          borderColor: "gray.200",
        },
        th: {
          paddingX: 2.5,
          paddingY: 2.5,
          height: "40px",
          letterSpacing: "normal",
          fontWeight: 400,
          fontSize: "sm",
          borderBlock: "1px solid",
          borderColor: "gray.200",
          background: "gray.50",
        },
        tr: {
          th: { _first: { paddingStart: 4 }, _last: { paddingEnd: 4 } },
          td: { _first: { paddingStart: 4 }, _last: { paddingEnd: 4 } },
          _selected: {
            backgroundColor: "primary.50",
          },
          "&[data-highlightable]": {
            _hover: {
              backgroundColor: "gray.50",
              _selected: { backgroundColor: "primary.50" },
            },
          },
        },
        td: {
          paddingX: 2,
          paddingY: 2,
          borderBottom: "1px solid",
          borderColor: "gray.200",
        },
      };
    }),
  },
});
