import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useOrganizationSections(isAdmin: boolean) {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: "organization.users.title",
          defaultMessage: "Users",
        }),
        path: "/app/organization/users",
      },
      {
        title: intl.formatMessage({
          id: "view.groups.title",
          defaultMessage: "User groups",
        }),
        path: "/app/organization/groups",
      },
      ...(isAdmin
        ? [
            {
              title: intl.formatMessage({
                id: "organization.branding.title",
                defaultMessage: "Branding",
              }),
              path: "/app/organization/branding",
            },
          ]
        : []),
    ],
    [intl.locale, isAdmin]
  );
}
