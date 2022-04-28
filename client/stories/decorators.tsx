import { ChakraProvider } from "@chakra-ui/react";
import { Fonts } from "@parallel/chakra/fonts";
import { theme } from "@parallel/chakra/theme";
import { LiquidProvider } from "@parallel/utils/useLiquid";
import { DecoratorFunction } from "@storybook/csf";
import { ReactFramework } from "@storybook/react";
import { AnimateSharedLayout } from "framer-motion";
import { useMemo } from "react";
import { IntlProvider } from "react-intl";

export const StoryDecorator: DecoratorFunction<ReactFramework> = function StoryDecorator(
  story,
  { globals }
) {
  const messages = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = require(`../lang/${globals.locale}.json`);
    return Object.fromEntries<string>(data.map((t: any) => [t.term, t.definition]));
  }, [globals.locale]);
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
          <AnimateSharedLayout>{story()}</AnimateSharedLayout>
        </ChakraProvider>
      </IntlProvider>
    </LiquidProvider>
  );
};
