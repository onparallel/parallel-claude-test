import { createContext, PropsWithChildren, useContext } from "react";
import { SlateNode } from "../../util/slate";

export interface PdfDocumentTheme {
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
  showLogo: boolean;
  logoPosition: "center" | "left" | "right";
  paginationPosition: "center" | "left" | "right";
  legalText: {
    es: SlateNode[];
    en: SlateNode[];
  };
}

export const defaultDocumentTheme: PdfDocumentTheme = {
  marginLeft: 25.4,
  marginRight: 25.4,
  marginTop: 25.4,
  marginBottom: 25.4,
  showLogo: true,
  title1FontFamily: "IBM Plex Sans",
  title1Color: "#000000",
  title1FontSize: 16,
  title2FontFamily: "IBM Plex Sans",
  title2Color: "#000000",
  title2FontSize: 14,
  textFontFamily: "IBM Plex Sans",
  textColor: "#000000",
  textFontSize: 12,
  logoPosition: "center",
  paginationPosition: "right",
  legalText: {
    es: [
      {
        type: "paragraph",
        children: [
          {
            text: "Declaro que los datos y la documentación facilitados, así como las copias o fotocopias enviadas, reproducen fielmente los documentos originales y la información actual de identificación.",
            italic: true,
          },
        ],
      },
    ],
    en: [
      {
        type: "paragraph",
        children: [
          {
            text: "I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and current identification information.",
            italic: true,
          },
        ],
      },
    ],
  },
};

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
