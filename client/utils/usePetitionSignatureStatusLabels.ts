import { useMemo } from "react";
import { useIntl } from "react-intl";
import { PetitionSignatureStatus } from "./getPetitionSignatureStatus";

export function usePetitionSignatureStatusLabels(): Record<PetitionSignatureStatus, string> {
  const intl = useIntl();
  return useMemo(
    () => ({
      NO_SIGNATURE: intl.formatMessage({
        id: "petition-signature-status-label.no-signature",
        defaultMessage: "Without eSignature",
      }),
      NOT_STARTED: intl.formatMessage({
        id: "petition-signature-status-label.not-started",
        defaultMessage: "eSignature not started",
      }),
      PENDING_START: intl.formatMessage({
        id: "petition-signature-status-label.pending-start",
        defaultMessage: "Pending start",
      }),
      PROCESSING: intl.formatMessage({
        id: "petition-signature-status-label.processing",
        defaultMessage: "Waiting for signature",
      }),
      COMPLETED: intl.formatMessage({
        id: "petition-signature-status-label.completed",
        defaultMessage: "eSignature completed",
      }),
      CANCELLED: intl.formatMessage({
        id: "petition-signature-status-label.cancelled",
        defaultMessage: "eSignature cancelled",
      }),
    }),
    [intl.locale]
  );
}
