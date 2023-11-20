import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useAdminSections() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: "page.admin-organizations.title",
          defaultMessage: "Organizations",
        }),
        path: "/app/admin/organizations",
      },
      {
        title: intl.formatMessage({
          id: "page.admin-support-methods.title",
          defaultMessage: "Support methods",
        }),
        path: "/app/admin/support-methods",
      },
    ],
    [intl.locale],
  );
}
