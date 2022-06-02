import { Text } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";

const SHOW_TIME = 2200;

export function LoadingDynamicText() {
  const intl = useIntl();

  const defaultTexts = useMemo(
    () => [
      intl.formatMessage({
        id: "component.loading-dynamic-text.checking-all-commas",
        defaultMessage: "Checking all commas and periods...",
      }),
      intl.formatMessage({
        id: "component.loading-dynamic-text.giving-color",
        defaultMessage: "Giving color to the charts...",
      }),
      intl.formatMessage({
        id: "component.loading-dynamic-text.searching-petitions",
        defaultMessage: "Searching for petitions in every corner...",
      }),
      intl.formatMessage({
        id: "component.loading-dynamic-text.dusting-off",
        defaultMessage: "Dusting off closed petitions...",
      }),
      intl.formatMessage({
        id: "component.loading-dynamic-text.calculating-average-times",
        defaultMessage: "Calculating average times with the calculator...",
      }),
    ],
    [intl.locale]
  );

  const texts = useRef([...defaultTexts]);

  const [text, setText] = useState(defaultTexts[0]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const one = texts.current.pop();
      if (one) {
        setText(one);
      } else {
        texts.current = [...defaultTexts];
        setText(texts.current.pop()!);
      }
    }, SHOW_TIME);

    return () => {
      clearTimeout(timer);
    };
  }, [text]);

  return <Text>{text}</Text>;
}
