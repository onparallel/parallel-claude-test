import { createContext, PropsWithChildren, useContext } from "react";

export interface PetitionExportTheme {
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  title1FontFamily: string;
  title1Color: string;
  title1FontSize: number;
  title2FontFamily: string;
  title2Color: string;
  title2FontSize: number;
  textFontFamily: string;
  textColor: string;
  textFontSize: number;
  logoPosition: "center" | "left" | "right";
  paginationPosition: "center" | "left" | "right";
}

const ThemeContext = createContext<PetitionExportTheme | undefined>(undefined);

export function ThemeProvider({
  theme: value,
  children,
}: PropsWithChildren<{ theme: PetitionExportTheme }>) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (theme === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}
