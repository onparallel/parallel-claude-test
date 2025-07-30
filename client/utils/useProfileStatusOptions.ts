import { SimpleOption } from "@parallel/components/common/SimpleSelect";
import { ProfileStatus } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

// do not include DELETION_SCHEDULED status, as this is not a valid filter for dashboard modules
export function useProfileStatusOptions(): SimpleOption<ProfileStatus>[] {
  const intl = useIntl();
  return useMemo(
    () => [
      {
        value: "OPEN",
        label: intl.formatMessage({
          id: "util.use-profile-status-labels.open",
          defaultMessage: "Open",
        }),
      },
      {
        value: "CLOSED",
        label: intl.formatMessage({
          id: "util.use-profile-status-labels.closed",
          defaultMessage: "Closed",
        }),
      },
    ],
    [intl.locale],
  );
}
