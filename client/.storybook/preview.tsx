import { ChakraProvider } from "@chakra-ui/react";
import { Preview } from "@storybook/react";
import { PropsWithChildren, useMemo } from "react";
import { IntlProvider } from "react-intl";
import { Fonts } from "../chakra/fonts";
import { theme } from "../chakra/theme/theme";
import { LiquidProvider } from "../utils/liquid/LiquidContext";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  globalTypes: {
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
  },
  decorators: [
    // eslint-disable-next-line @typescript-eslint/naming-convention
    (Story, { globals }) => {
      return (
        <WithDecorators locale={globals.locale}>
          <Story />
        </WithDecorators>
      );
    },
  ],
};

function WithDecorators({ locale, children }: PropsWithChildren<{ locale: string }>) {
  const messages = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const data = require(`../lang/${locale}.json`);
    return Object.fromEntries<string>(data.map((t: any) => [t.term, t.definition]));
  }, [locale]);
  return (
    <LiquidProvider>
      <IntlProvider
        locale="en"
        messages={messages}
        defaultRichTextElements={{
          b: (chunks: any) => <strong>{chunks}</strong>,
        }}
        onWarn={() => {}}
      >
        <ChakraProvider theme={theme} resetCSS portalZIndex={40}>
          <Fonts />
          {children}
        </ChakraProvider>
      </IntlProvider>
    </LiquidProvider>
  );
}

export default preview;
