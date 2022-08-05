import { Global } from "@emotion/react";

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
          src: url('${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/ibm-plex-sans-v8-latin-300.woff2') format('woff2');
        }
        
        /* ibm-plex-sans-regular - latin */
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 400;
          font-display: swap;
          src: url('${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/ibm-plex-sans-v8-latin-regular.woff2') format('woff2');
        }

        /* ibm-plex-sans-600 - latin */
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 500;
          font-display: swap;
          src: url('${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/ibm-plex-sans-v8-latin-500.woff2') format('woff2');
        }
        
        /* ibm-plex-sans-600 - latin */
        @font-face {
          font-family: 'IBM Plex Sans';
          font-style: normal;
          font-weight: 600;
          font-display: swap;
          src: url('${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/ibm-plex-sans-v8-latin-600.woff2') format('woff2');
        }
        
        /* source-sans-pro-600 - latin */
        @font-face {
          font-family: 'Source Sans Pro';
          font-style: normal;
          font-weight: 600;
          src: url('${process.env.NEXT_PUBLIC_ASSETS_URL}/static/fonts/source-sans-pro-v14-latin-600.woff2') format('woff2');
        }
      `
      }
    />
  );
}
