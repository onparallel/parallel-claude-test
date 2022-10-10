import { PetitionStatus } from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionStatusLabels(): Record<PetitionStatus, string> {
  const intl = useIntl();
  return useMemo(
    () => ({
      DRAFT: intl.formatMessage({
        id: "generic.parallel-status.draft",
        defaultMessage: "Draft",
      }),
      PENDING: intl.formatMessage({
        id: "generic.parallel-status.pending",
        defaultMessage: "Pending",
      }),
      COMPLETED: intl.formatMessage({
        id: "generic.parallel-status.completed",
        defaultMessage: "Completed",
      }),
      CLOSED: intl.formatMessage({
        id: "generic.parallel-status.closed",
        defaultMessage: "Closed",
      }),
    }),
    [intl.locale]
  );
}
