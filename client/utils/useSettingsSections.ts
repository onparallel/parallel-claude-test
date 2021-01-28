import { Settings_UserFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useSettingsSections(user: Settings_UserFragment) {
  const intl = useIntl();
  return useMemo(() => {
    const sections = [
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
    ];

    if (user.hasApiTokens) {
      sections.push({
        title: intl.formatMessage({
          id: "settings.api-tokens",
          defaultMessage: "API Tokens",
        }),
        path: "/app/settings/tokens",
      });
    }

    return sections;
  }, [intl.locale]);
}
