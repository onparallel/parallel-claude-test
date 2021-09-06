import { extendTheme, keyframes, Menu, Popover, Select, Tooltip } from "@chakra-ui/react";
import { mode } from "@chakra-ui/theme-tools";
import { ChevronDownIcon } from "./icons";
import { styles } from "./styles";

export const theme = extendTheme({
  useSystemColorMode: false,
  initialColorMode: "light",
  styles,
  fonts: {
    body: "'IBM Plex Sans', sans-serif",
    heading: "'IBM Plex Sans', sans-serif",
    hero: "'Source Sans Pro', sans-serif",
  },
  sizes: {
    container: {
      xs: "480px",
      "2xs": "420px",
      "3xs": "360px",
      "4xs": "300px",
      "5xs": "240px",
    },
  },
  shadows: {
    inline: "inset 0 0 0 3px rgba(66, 153, 225, 0.6)",
  },
  fontSizes: {
    "2xs": "0.6rem",
  },
  colors: {
    gray: {
      50: "#fafdff",
      75: "#f4f7f9",
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
  layerStyles: {
    highlightable: {
      _highlighted: {
        animation: ((theme: any) =>
          `${keyframes`
              0% { background-color: white; }
              25% { background-color: ${theme.colors.gray[100]}; }
              50% { background-color: white }
              75% { background-color: ${theme.colors.gray[100]}; }
              100% { background-color: white; }
              `} 500ms ease`) as any,
      },
    },
  },
  textStyles: {
    hint: {
      color: "gray.400",
      fontStyle: "italic",
    },
    muted: {
      color: "gray.400",
    },
  },
  components: {
    Input: {
      sizes: {
        sm: {
          field: {
            borderRadius: "md",
          },
        },
      },
    },
    Menu: {
      baseStyle: {
        item: {
          _focus: {
            background: "gray.75",
          },
        },
      },
    },
    NumberInput: {
      sizes: {
        sm: {
          field: {
            borderRadius: "md",
          },
        },
      },
    },
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
      variants: {
        link: (props: any) => {
          return {
            fontWeight: "normal",
            borderRadius: "sm",
            padding: 0,
            height: "auto",
            lineHeight: "normal",
            color: mode(`purple.600`, `purple.200`)(props),
            _hover: {
              color: mode(`purple.800`, `purple.200`)(props),
              textDecoration: "none",
            },
            _active: {
              color: mode(`purple.800`, `purple.500`)(props),
            },
          };
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
      variants: {
        radio: {
          control: { borderRadius: "50%" },
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
        transition: `all 0.15s ease-out`,
        borderRadius: "sm",
        cursor: "pointer",
        color: "purple.600",
        _hover: {
          color: "purple.800",
          textDecoration: "none",
        },
        _active: {
          color: "purple.800",
        },
        _focus: {
          boxShadow: "outline",
        },
      },
    },
    Switch: {
      defaultProps: {
        size: "md",
        colorScheme: "green",
      },
    },
  },
});

export type Theme = typeof theme;

Tooltip.defaultProps = {
  hasArrow: true,
  openDelay: 250,
  closeDelay: 150,
  arrowSize: 8,
} as any;

Menu.defaultProps = {
  isLazy: true,
  strategy: "fixed",
} as any;

Popover.defaultProps = {
  openDelay: 250,
  isLazy: true,
} as any;

Select.defaultProps = {
  icon: <ChevronDownIcon fontSize="16px" />,
};
