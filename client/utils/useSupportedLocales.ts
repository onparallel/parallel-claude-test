import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useSupportedLocales() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        key: "en",
        label: "English",
        localizedLabel: intl.formatMessage({
          id: "supported-locales.english",
          defaultMessage: "English",
        }),
      },
      {
        key: "es",
        label: "Español",
        localizedLabel: intl.formatMessage({
          id: "supported-locales.spanish",
          defaultMessage: "Spanish",
        }),
      },
    ],
    []
  );
}
