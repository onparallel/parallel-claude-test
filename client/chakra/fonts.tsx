import { Global } from "@emotion/react";
import PDF_FONTS from "./pdfDocumentFonts.json";

export function Fonts() {
  return (
    <Global
      styles={
        /* css */ `
        /* ibm-plex-sans-300 - latin */
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 300;
          font-display: swap;
          src: url('${
            process.env.NEXT_PUBLIC_ASSETS_URL
          }/static/fonts/ibm-plex-sans-v8-latin-300.woff2') format('woff2');
        }
        
        /* ibm-plex-sans-regular - latin */
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('${
            process.env.NEXT_PUBLIC_ASSETS_URL
          }/static/fonts/ibm-plex-sans-v8-latin-regular.woff2') format('woff2');
        }
        
        /* ibm-plex-sans-600 - latin */
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url('${
            process.env.NEXT_PUBLIC_ASSETS_URL
          }/static/fonts/ibm-plex-sans-v8-latin-600.woff2') format('woff2');
        }
        
        /* source-sans-pro-600 - latin */
        @font-face {
          font-family: 'Source Sans Pro';
          font-style: normal;
          font-weight: 600;
          src: url('${
            process.env.NEXT_PUBLIC_ASSETS_URL
          }/static/fonts/source-sans-pro-v14-latin-600.woff2') format('woff2');
        }

       ${PDF_FONTS.flatMap((family) =>
         family.fonts.map(
           (font) => /* css */ `
        @font-face {
          font-family: '${family.family}';
          font-style: ${font.fontStyle || "normal"};
          font-weight: ${font.fontWeight || 400};
          src: url('${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/pdf${
             font.src
           }') format('truetype');
        }
       `
         )
       ).join("\n")}
      `
      }
    />
  );
}
