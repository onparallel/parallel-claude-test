import { createContext, PropsWithChildren, useContext } from "react";
import Color from "color";
import { BrandTheme } from "../../util/BrandTheme";
import { Tone } from "./types";

type EmailThemeColor = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, "string">;

export type EmailTheme = {
  fontFamily: string | undefined;
  colors: Record<"primary", EmailThemeColor>;
  tone: Tone;
};

const ThemeContext = createContext<EmailTheme | undefined>(undefined);

export function ThemeProvider({ theme, children }: PropsWithChildren<{ theme: BrandTheme }>) {
  return (
    <ThemeContext.Provider
      value={
        {
          colors: { primary: generateOrganizationPallete(theme.color) },
          fontFamily: theme.fontFamily,
          tone: theme.preferredTone,
        } as EmailTheme
      }
    >
      {children}
    </ThemeContext.Provider>
  );
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
