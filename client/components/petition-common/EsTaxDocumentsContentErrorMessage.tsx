import { Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { useIntl } from "react-intl";

type ErrorReason =
  | "user_aborted"
  | "user_blocked"
  | "blocked_credentials"
  | "user_unknown"
  | "user_not_registered"
  | "document_not_found"
  | "timeout"
  | "generic"
  | "mfa_method_not_supported"
  | "action_required_from_user"
  | "manually_rejected";

interface EsTaxDocumentsContentErrorMessageProps {
  type: "model-request" | "identity-verification" | null;
  error: { reason: ErrorReason; subreason: string | null }[];
}

export function EsTaxDocumentsContentErrorMessage({
  type: _type,
  error,
}: EsTaxDocumentsContentErrorMessageProps) {
  const intl = useIntl();

  const type = _type ?? "model-request";

  const reasons = useMemo(
    () => ({
      user_aborted: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.user-aborted",
        defaultMessage: "You cancelled the request before it could finish. Please, try again.",
      }),
      blocked_credentials: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.blocked-credentials",
        defaultMessage:
          "The Public Administration has blocked the user access for security reasons. Please, try again later.",
      }),
      user_unknown: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.user-unknown",
        defaultMessage: "The user is not known in the Public Administration.",
      }),
      user_not_registered: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.user-not-registered",
        defaultMessage: "The user is not registered in the Public Administration.",
      }),
      document_not_found: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.document-not-found",
        defaultMessage: "We couldn't find the requested document in the Public Administration.",
      }),
      timeout: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.timeout",
        defaultMessage:
          "The Public Administration took too long to process your request. Please, try again.",
      }),
      action_required_from_user: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.action-required-from-user",
        defaultMessage:
          "The affiliation data required to obtain this information cannot be retrieved. Your data could not be obtained automatically.",
      }),
      parallel_send_limit_reached: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.parallel-send-limit-reached",
        defaultMessage:
          "We couldn't create the file because you reached the limit of parallels you can send.",
      }),
      generic: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.generic",
        defaultMessage: "An unknown error happened.",
      }),
      mfa_method_not_supported: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.mfa-method-not-supported",
        defaultMessage:
          "The user has an uncommon multi factor authentication method which is not currently supported.",
      }),
      user_blocked:
        type === "model-request"
          ? intl.formatMessage({
              id: "component.es-tax-documents-content-error-message.user-blocked",
              defaultMessage:
                "The Public Administration has blocked the user access for security reasons.",
            })
          : error[0].subreason === "user_blocked_expired_document"
            ? intl.formatMessage({
                id: "component.es-tax-documents-content-error-message.user-blocked-identity-verification-document-expired",
                defaultMessage:
                  "It seems the provided documentation is expired and could not be verified. Please, try again with a valid document.",
              })
            : error[0].subreason === "user_blocked_underage"
              ? intl.formatMessage({
                  id: "component.es-tax-documents-content-error-message.user-blocked-identity-verification-underage",
                  defaultMessage:
                    "It seems the provided documentation belongs to an underage person. Please, try again with a valid document.",
                })
              : null,
      manually_rejected: null,
    }),
    [type, intl.locale, error[0].subreason],
  );

  const reason = error[0].reason;

  return (
    <Text color={reason === "document_not_found" ? "gray.500" : "red.500"} fontSize="xs">
      {reasons[reason] || reasons.generic}
    </Text>
  );
}
