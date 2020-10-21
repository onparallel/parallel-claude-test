import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useSettingsSections() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: "settings.account",
          defaultMessage: "Account",
        }),
        path: "/app/settings/account",
      },
      {
        title: intl.formatMessage({
          id: "settings.security",
          defaultMessage: "Security",
        }),
        path: "/app/settings/security",
      },
    ],
    [intl.locale]
  );
}
