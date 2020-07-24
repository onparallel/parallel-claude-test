import { default as base } from "@chakra-ui/theme";

export const theme = {
  ...base,
  fonts: {
    body: "'IBM Plex Sans', sans-serif",
    heading: "'IBM Plex Sans', sans-serif",
    hero: "'Playfair Display', serif",
  },
  sizes: {
    ...base.sizes,
    container: {
      ...base.sizes.container,
      xs: "480px",
    },
  },
  colors: {
    ...base.colors,
    gray: {
      ...base.colors.gray,
      50: "#fbfcfd",
    },
    primary: {
      50: "#f8f8ff",
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
  },
};

export type Theme = typeof theme;
