export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

export const globalTypes = {
  locale: {
    name: "Locale",
    description: "Internationalization locale",
    defaultValue: "en",
    toolbar: {
      icon: "globe",
      items: [
        { value: "ca", right: "🐈", title: "Catalan" },
        { value: "en", right: "🇺🇸", title: "English" },
        { value: "es", right: "🇪🇸", title: "Spanish" },
        { value: "it", right: "🇮🇹", title: "Italian" },
        { value: "pt", right: "🇵🇹", title: "Portuguese" },
      ],
    },
  },
};
