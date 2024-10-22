import {
  PetitionLatestSignatureStatus,
  PetitionSignatureStatusFilter,
} from "@parallel/graphql/__types";
import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionSignatureStatusLabels(): Record<
  PetitionSignatureStatusFilter | PetitionLatestSignatureStatus,
  string
> {
  const intl = useIntl();
  return useMemo(
    () => ({
      NO_SIGNATURE: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.no-signature",
        defaultMessage: "Without eSignature",
      }),
      NOT_STARTED: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.not-started",
        defaultMessage: "eSignature not started",
      }),
      ENQUEUED: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.pending-start",
        defaultMessage: "Pending start",
      }),
      PENDING_START: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.pending-start",
        defaultMessage: "Pending start",
      }),
      PROCESSED: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.processing",
        defaultMessage: "Waiting for signature",
      }),
      PROCESSING: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.processing",
        defaultMessage: "Waiting for signature",
      }),
      COMPLETED: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.completed",
        defaultMessage: "eSignature completed",
      }),
      CANCELLING: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.cancelled",
        defaultMessage: "eSignature cancelled",
      }),
      CANCELLED: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.cancelled",
        defaultMessage: "eSignature cancelled",
      }),
      CANCELLED_BY_USER: intl.formatMessage({
        id: "util.use-petition-signatrue-status-labels.cancelled",
        defaultMessage: "eSignature cancelled",
      }),
    }),
    [intl.locale],
  );
}
