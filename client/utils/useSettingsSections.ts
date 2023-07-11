import { gql } from "@apollo/client";
import { useSettingsSections_UserFragment } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";
import { useHasPermission } from "./useHasPermission";

export function useSettingsSections(user: useSettingsSections_UserFragment) {
  const intl = useIntl();
  const hasDeveloperPermissions = useHasPermission("INTEGRATIONS:CRUD_API");
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

    if (user.hasDeveloperAccess && hasDeveloperPermissions) {
      sections.push({
        title: intl.formatMessage({
          id: "settings.developers",
          defaultMessage: "Developers",
        }),
        path: "/app/settings/developers",
      });
    }

    return sections;
  }, [user, intl.locale]);
}

useSettingsSections.fragments = {
  User: gql`
    fragment useSettingsSections_User on User {
      hasDeveloperAccess: hasFeatureFlag(featureFlag: DEVELOPER_ACCESS)
    }
  `,
};
