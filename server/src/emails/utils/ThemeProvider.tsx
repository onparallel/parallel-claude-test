import { createContext, PropsWithChildren, useContext } from "react";
import Color from "color";

type EmailThemeColor = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, "string">;

export type EmailTheme = {
  fontFamily: string | undefined;
  colors: Record<"primary", EmailThemeColor>;
};

export interface OrganizationBrandTheme {
  fontFamily?: string;
  color?: string;
}

const ThemeContext = createContext<EmailTheme | undefined>(undefined);

export function ThemeProvider({
  theme,
  children,
}: PropsWithChildren<{ theme: OrganizationBrandTheme }>) {
  const value = {
    colors: {
      primary: theme?.color
        ? generateOrganizationPallete(theme!.color)
        : {
            50: "#f8f8ff",
            100: "#dddbff",
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
    fontFamily: theme?.fontFamily ?? undefined,
  } as EmailTheme;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (theme === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}

function generateOrganizationPallete(color: string) {
  const _color = new Color(color);
  const lightness = _color.hsl().round().lightness();

  const lightenOffset = (97 - lightness) / 5;
  const darkenOffset = lightness > 21 ? (lightness - 20) / 4 : 6;

  return {
    50: _color.lightness(97).hex().toString(),
    100: _color
      .lightness(lightness + lightenOffset * 4)
      .hex()
      .toString(),
    200: _color
      .lightness(lightness + lightenOffset * 3)
      .hex()
      .toString(),
    300: _color
      .lightness(lightness + lightenOffset * 2)
      .hex()
      .toString(),
    400: _color
      .lightness(lightness + lightenOffset)
      .hex()
      .toString(),
    500: color,
    600: _color
      .lightness(lightness - darkenOffset)
      .hex()
      .toString(),
    700: _color
      .lightness(lightness - darkenOffset * 2)
      .hex()
      .toString(),
    800: _color
      .lightness(lightness - darkenOffset * 3)
      .hex()
      .toString(),
    900: _color.lightness(20).hex().toString(),
  };
}
