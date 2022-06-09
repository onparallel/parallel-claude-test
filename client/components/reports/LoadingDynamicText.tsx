import { Text } from "@chakra-ui/react";
import { useInterval } from "@parallel/utils/useInterval";
import { useMemo, useState } from "react";
import { useIntl } from "react-intl";

const SHOW_TIME = 4_000;

export function LoadingDynamicText() {
  const intl = useIntl();

  const loadingTexts = useMemo(
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
        defaultMessage: "Calculating average times with a calculator...",
      }),
    ],
    [intl.locale]
  );
  const [index, setIndex] = useState(0);
  useInterval(() => setIndex((curr) => (curr + 1) % loadingTexts.length), SHOW_TIME, [
    loadingTexts,
  ]);

  return <Text>{loadingTexts[index]}</Text>;
}
