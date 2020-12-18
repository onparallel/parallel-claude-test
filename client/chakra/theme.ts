import { extendTheme } from "@chakra-ui/core";
import { styles } from "./styles";

export const theme = extendTheme({
  styles,
  fonts: {
    body: "'IBM Plex Sans', sans-serif",
    heading: "'IBM Plex Sans', sans-serif",
    hero: "'Playfair Display', serif",
  },
  sizes: {
    container: {
      xs: "480px",
      "2xs": "380px",
    },
  },
  fontSizes: {
    "2xs": "0.6rem",
  },
  colors: {
    gray: {
      50: "#fafdff",
    },
    purple: {
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
  textStyles: {
    hint: {
      color: "gray.400",
      fontStyle: "italic",
    },
  },
  components: {
    Button: {
      sizes: {
        "2xs": {
          height: 5,
          minWidth: 5,
          fontSize: "xs",
          fontWeight: "normal",
          paddingX: 1,
          borderRadius: "sm",
        },
      },
    },
    Checkbox: {
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
      sizes: {
        "3xl": { fontSize: ["4xl", null, "5xl"] },
        "2xl": { fontSize: ["3xl", null, "4xl"] },
        xl: { fontSize: ["2xl", null, "3xl"] },
        lg: { fontSize: ["xl", null, "2xl"] },
      },
    },
    Link: {
      baseStyle: {
        cursor: "pointer",
        color: "purple.600",
        _hover: {
          color: "purple.700",
          textDecoration: "none",
        },
        _active: {
          color: "purple.800",
        },
      },
    },
    Switch: {
      defaultProps: {
        size: "md",
        colorScheme: "green",
      },
    },
    Tooltip: {
      defaultProps: {
        openDelay: 300,
      },
    },
  },
});

export type Theme = typeof theme;
