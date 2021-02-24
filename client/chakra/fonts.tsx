export const fonts = /* css */ `
  /* ibm-plex-sans-300 - latin */
  @font-face {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 300;
    font-display: swap;
    src: local(''),
        url('/static/fonts/ibm-plex-sans-v8-latin-300.woff2') format('woff2'), /* Super Modern Browsers */
        url('/static/fonts/ibm-plex-sans-v8-latin-300.woff') format('woff'); /* Modern Browsers */
  }
  
  /* ibm-plex-sans-regular - latin */
  @font-face {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: local(''),
        url('/static/fonts/ibm-plex-sans-v8-latin-regular.woff2') format('woff2'), /* Super Modern Browsers */
        url('/static/fonts/ibm-plex-sans-v8-latin-regular.woff') format('woff'); /* Modern Browsers */
  }
  
  /* ibm-plex-sans-500 - latin */
  @font-face {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: local(''),
        url('/static/fonts/ibm-plex-sans-v8-latin-500.woff2') format('woff2'), /* Super Modern Browsers */
        url('/static/fonts/ibm-plex-sans-v8-latin-500.woff') format('woff'); /* Modern Browsers */
  }
  
  /* ibm-plex-sans-600 - latin */
  @font-face {
    font-family: 'IBM Plex Sans';
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: local(''),
        url('/static/fonts/ibm-plex-sans-v8-latin-600.woff2') format('woff2'), /* Super Modern Browsers */
        url('/static/fonts/ibm-plex-sans-v8-latin-600.woff') format('woff'); /* Modern Browsers */
  }
  
  /* source-sans-pro-regular - latin */
  @font-face {
    font-family: 'Source Sans Pro';
    font-style: normal;
    font-weight: 400;
    src: local(''),
        url('/static/fonts/source-sans-pro-v14-latin-regular.woff2') format('woff2'), /* Super Modern Browsers */
        url('/static/fonts/source-sans-pro-v14-latin-regular.woff') format('woff'), /* Modern Browsers */
  }

  /* source-sans-pro-600 - latin */
  @font-face {
    font-family: 'Source Sans Pro';
    font-style: normal;
    font-weight: 600;
    src: local(''),
        url('/static/fonts/source-sans-pro-v14-latin-600.woff2') format('woff2'), /* Super Modern Browsers */
        url('/static/fonts/source-sans-pro-v14-latin-600.woff') format('woff'), /* Modern Browsers */
  }
`.replace(/\/\*.*\*\//g, "");
