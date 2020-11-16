const port = process.env.EMAILS_PORT || 5000;

export const parameters = {
  a11y: {
    config: {},
    options: {
      checks: { "color-contrast": { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },
  docs: {
    iframeHeight: "200px",
  },
  server: {
    url: `http://localhost:${port}`,
  },
};

export const globalTypes = {
  type: {
    name: "Email type",
    description: "The type of the rendered email HTML or text",
    defaultValue: "html",
    toolbar: {
      icon: "document",
      items: [
        { value: "html", icon: "photo", title: "HTML" },
        { value: "text", icon: "document", title: "Plain Text" },
      ],
    },
  },
  locale: {
    name: "Locale",
    description: "Internationalization locale",
    defaultValue: "en",
    toolbar: {
      icon: "globe",
      items: [
        { value: "en", right: "🇺🇸", title: "English" },
        { value: "es", right: "🇪🇸", title: "Español" },
      ],
    },
  },
};
