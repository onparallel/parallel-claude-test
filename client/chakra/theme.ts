import { default as base } from "@chakra-ui/theme";
import { omit } from "remeda";

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
  fontSizes: {
    ...base.fontSizes,
  },
  colors: {
    ...omit(base.colors, [
      "facebook",
      "linkedin",
      "messenger",
      "telegram",
      "twitter",
      "whatsapp",
    ]),
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
  components: {
    ...base.components,
    Checkbox: {
      ...base.components.Checkbox,
      sizes: {
        sm: {
          control: { boxSize: 3 },
          label: { fontSize: "sm" },
          icon: { fontSize: "0.5rem" },
        },
        md: {
          control: { boxSize: 4 },
          label: { fontSize: "md" },
          icon: { fontSize: "0.625rem" },
        },
        lg: {
          control: { boxSize: 5 },
          label: { fontSize: "lg" },
          icon: { fontSize: "0.75rem" },
        },
      },
    },
    Heading: {
      ...base.components.Heading,
      sizes: {
        ...base.components.Heading.sizes,
        "3xl": {
          fontSize: ["4xl", null, "5xl"],
        },
        "2xl": {
          fontSize: ["3xl", null, "4xl"],
        },
        xl: {
          fontSize: ["2xl", null, "3xl"],
        },
        lg: {
          fontSize: ["xl", null, "2xl"],
        },
      },
    },
    Tooltip: {
      ...base.components.Tooltip,
      defaultProps: {
        openDelay: 300,
      },
    },
  },
};

export type Theme = typeof theme;
