import { ProfileStatus } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function useProfileStatusLabels(): Record<ProfileStatus, string> {
  const intl = useIntl();
  return useMemo(
    () => ({
      CLOSED: intl.formatMessage({
        id: "util.use-profile-status-labels.closed",
        defaultMessage: "Closed",
      }),
      DELETION_SCHEDULED: intl.formatMessage({
        id: "util.use-profile-status-labels.deletion-scheduled",
        defaultMessage: "Deletion scheduled",
      }),
      OPEN: intl.formatMessage({
        id: "util.use-profile-status-labels.open",
        defaultMessage: "Open",
      }),
    }),
    [intl.locale],
  );
}
