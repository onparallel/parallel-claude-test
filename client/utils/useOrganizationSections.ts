import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useOrganizationSections() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: "organization.branding.title",
          defaultMessage: "Branding",
        }),
        path: "/app/organization/branding",
      },
      {
        title: intl.formatMessage({
          id: "organization.users.title",
          defaultMessage: "Users",
        }),
        path: "/app/organization/users",
      },
      {
        title: intl.formatMessage({
          id: "organization.groups.title",
          defaultMessage: "Groups",
        }),
        path: "/app/organization/groups",
      },
    ],
    [intl.locale]
  );
}
