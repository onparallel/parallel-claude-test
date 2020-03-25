import { theme as base } from "@chakra-ui/core";
import { icons } from "./icons";

export const theme = {
  ...base,
  fonts: {
    ...base.fonts,
    body: "'IBM Plex Sans', sans-serif",
    heading: "'IBM Plex Sans', sans-serif",
    hero: "'Playfair Display', serif",
  },
  fontSizes: {
    ...base.fontSizes,
    hero: "5rem",
  },
  sizes: {
    ...base.sizes,
    containers: {
      ...base.sizes.containers,
      xs: "480px",
    },
  },
  colors: {
    ...base.colors,
    gray: {
      ...base.colors.gray,
      50: "#fbfcfd",
    },
    purple: {
      50: "#f0efff",
      100: "#d1cfff",
      200: "#b0acfb",
      300: "#938eff",
      400: "#746eff",
      500: "#6059f7",
      600: "#5650de",
      700: "#433ead",
      800: "#332f80",
      900: "#282666",
    },
    field: {
      FILE_UPLOAD: base.colors.teal[400],
      TEXT: base.colors.yellow[400],
    },
  },
  icons: {
    ...base.icons,
    ...icons,
  },
};

// if (process.browser) {
//   console.log(theme);
// }
