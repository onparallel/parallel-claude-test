import { useMemo } from "react";
import { useIntl } from "react-intl";

export function usePetitionSignatureStatusLabels() {
  const intl = useIntl();
  return useMemo(
    () => ({
      START: intl.formatMessage({
        id: "petition-signature-status-label.e-signature-start",
        defaultMessage: "Pending start",
      }),
      ENQUEUED: intl.formatMessage({
        id: "petition-signature-status-label.e-signature-processing",
        defaultMessage: "eSignature pending",
      }),
      PROCESSING: intl.formatMessage({
        id: "petition-signature-status-label.e-signature-processing",
        defaultMessage: "eSignature pending",
      }),
      CANCELLED: intl.formatMessage({
        id: "petition-signature-status-label.e-signature-cancelled",
        defaultMessage: "eSignature cancelled",
      }),
      COMPLETED: intl.formatMessage({
        id: "petition-signature-status-label.e-signature-completed",
        defaultMessage: "eSignature completed",
      }),
    }),
    [intl.locale]
  );
}
