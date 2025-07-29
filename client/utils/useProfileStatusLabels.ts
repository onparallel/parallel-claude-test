import { ProfileStatus } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

// do not include DELETION_SCHEDULED status, as this is not a valid filter for dashboard modules
export function useProfileStatusLabels(): Partial<Record<ProfileStatus, string>> {
  const intl = useIntl();
  return useMemo(
    () => ({
      CLOSED: intl.formatMessage({
        id: "util.use-profile-status-labels.closed",
        defaultMessage: "Closed",
      }),
      OPEN: intl.formatMessage({
        id: "util.use-profile-status-labels.open",
        defaultMessage: "Open",
      }),
    }),
    [intl.locale],
  );
}
