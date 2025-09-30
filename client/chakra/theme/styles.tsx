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
      // Basic print setup
      ".no-print, .no-print *": {
        display: "none !important",
      },
      "html, body, #__next, main, div": {
        height: "auto !important",
        width: "auto !important",
        overflow: "visible !important",
        fontSize: "12px !important",
      },
      // Hide navigation tabs
      "[data-section='dashboards']": {
        display: "none !important",
      },
      // Dashboard grid layout
      ".dashboard-grid": {
        display: "block !important",
        columnCount: "2",
        columnGap: "20px",
        columnFill: "balance",
      },
      // Dashboard cards
      "[data-testid='dashboard-module-card']": {
        breakInside: "avoid",
        marginBottom: "16px !important",
        border: "1px solid #E2E8F0 !important",
        borderRadius: "8px !important",
        padding: "14px !important",
        display: "block !important",
        boxShadow: "none !important",
      },
      // Hide problematic elements
      "[data-testid='dashboard-module-card'] *[style*='position: absolute'], [data-testid='dashboard-module-card'] *[style*='position:absolute'], *[data-popper-placement], *[role='tooltip']":
        {
          display: "none !important",
        },
      ".dashboard-number-module": {
        fontSize: "24px !important",
        fontWeight: "700 !important",
      },
      // Charts
      "[data-testid='dashboard-module-card'] canvas": {
        maxWidth: "200px !important",
        maxHeight: "200px !important",
      },
    },
  }),
};
