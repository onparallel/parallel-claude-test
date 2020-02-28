import { theme as base, ITheme } from "@chakra-ui/core";

export const theme = {
  ...base,
  fonts: {
    ...base.fonts,
    body: "'IBM Plex Sans', sans-serif",
    heading: "'IBM Plex Sans', sans-serif",
    hero: "'Playfair Display', serif"
  },
  fontSizes: {
    ...base.fontSizes,
    hero: "5rem"
  },
  sizes: {
    ...base.sizes,
    containers: {
      ...base.sizes.containers,
      xs: "480px"
    }
  },
  colors: {
    ...base.colors,
    purple: {
      50: "#f0efff",
      100: "#d1cfff",
      200: "#b0acfb",
      300: "#938eff",
      400: "#746eff",
      500: "#6059f7",
      600: "#5650de",
      700: "#433ead",
      800: "#332f80",
      900: "#282666"
    }
  },
  icons: {
    ...base.icons,
    twitter: {
      viewBox: "0 0 512 512",
      path: (
        <path
          fill="currentColor"
          d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"
        />
      )
    },
    linkedin: {
      viewBox: "0 0 448 512",
      path: (
        <path
          fill="currentColor"
          d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z"
        />
      )
    },
    language: {
      viewBox: "0 0 24 24",
      path: (
        <>
          <path
            fill="none"
            stroke="currentColor"
            d="M4.5 8.25v-3a1.5 1.5 0 0 1 3 0v3M4.5 6.75h3M16.5 10.5V12M13.5 12h6M18 12s-1.5 4.5-4.5 4.5M16.5 14.767a3.932 3.932 0 0 0 3 1.733"
          ></path>
          <path
            fill="none"
            stroke="currentColor"
            d="M11.25 18.75a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5h10.5a1.5 1.5 0 0 1 1.5 1.5v7.5a1.5 1.5 0 0 1-1.5 1.5h-1.5v4.5l-4.5-4.5z"
          ></path>
          <path
            fill="none"
            stroke="currentColor"
            d="M6.75 12.75l-3 3v-4.5h-1.5a1.5 1.5 0 0 1-1.5-1.5v-7.5a1.5 1.5 0 0 1 1.5-1.5h10.5a1.5 1.5 0 0 1 1.5 1.5v3"
          ></path>
        </>
      )
    },
    "paper-plane": {
      viewBox: "0 0 24 24",
      path: (
        <g
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11.5 17L18 6.5L8.5 15" />
          <path d="M22 2L17.5 21L11.5 17L8.5 21.5V15L2.5 11L22 2Z" />
        </g>
      )
    },
    users: {
      viewBox: "0 0 24 24",
      path: (
        <g
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </g>
      )
    },
    "file-text": {
      viewBox: "0 0 24 24",
      path: (
        <g
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </g>
      )
    },
    filter: {
      viewBox: "0 0 24 24",
      path: (
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
        </g>
      )
    }
  }
};

if (process.browser) {
  console.log(theme);
}
