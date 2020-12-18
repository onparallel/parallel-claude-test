import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useOrganizationSections() {
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
    ],
    [intl.locale]
  );
}
