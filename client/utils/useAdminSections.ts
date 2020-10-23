import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useAdminSections() {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        title: intl.formatMessage({
          id: "admin.support-methods",
          defaultMessage: "Support methods",
        }),
        path: "/app/admin/support-methods",
      },
    ],
    [intl.locale]
  );
}
