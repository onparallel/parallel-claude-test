import { createContext, PropsWithChildren, useContext } from "react";
import { PdfDocumentTheme } from "../../util/PdfDocumentTheme";

const ThemeContext = createContext<PdfDocumentTheme | undefined>(undefined);

export function ThemeProvider({
  theme: value,
  children,
}: PropsWithChildren<{ theme: PdfDocumentTheme }>) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (theme === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return theme;
}
