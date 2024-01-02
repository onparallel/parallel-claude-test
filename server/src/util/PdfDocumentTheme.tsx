import { ContactLocale } from "../db/__types";
import { SlateNode } from "./slate/render";

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
  legalText: Record<ContactLocale, SlateNode[]>;
}

export const defaultPdfDocumentTheme: PdfDocumentTheme = {
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
  legalText: Object.fromEntries(
    Object.entries({
      ca: "Declaro que les dades i la documentació facilitades, així com les còpies o fotocòpies enviades, reproduïxen fidelment els documents originals i la informació actual d'identificació.",
      en: "I declare that the data and documentation provided, as well as the copies or photocopies sent, faithfully reproduce the original documents and current identification information.",
      es: "Declaro que los datos y la documentación facilitados, así como las copias o fotocopias enviadas, reproducen fielmente los documentos originales y la información actual de identificación.",
      it: "Dichiaro che i dati e la documentazione forniti, così come le copie o le fotocopie inviate, riproducono fedelmente i documenti originali e le attuali informazioni di identificazione.",
      pt: "Declaro que os dados e a documentação fornecidos, bem como as cópias ou fotocópias enviadas, reproduzem fielmente os documentos originais e a informação atual de identificação.",
    }).map(
      ([locale, text]) =>
        [
          locale as ContactLocale,
          [{ type: "paragraph", children: [{ text, italic: true }] }] as SlateNode[],
        ] as const,
    ),
  ) as Record<ContactLocale, SlateNode[]>,
};
