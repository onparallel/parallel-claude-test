import { Text } from "@chakra-ui/react";
import { useMemo } from "react";
import { useIntl } from "react-intl";

type ErrorReason =
  | "user_aborted"
  | "blocked_credentials"
  | "user_not_registered"
  | "document_not_found"
  | "timeout"
  | "generic";

interface EsTaxDocumentsContentErrorMessageProps {
  error: { reason: ErrorReason }[];
}
export function EsTaxDocumentsContentErrorMessage({
  error,
}: EsTaxDocumentsContentErrorMessageProps) {
  const intl = useIntl();
  const reasons: Record<ErrorReason, string> = useMemo(
    () => ({
      user_aborted: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.user-aborted",
        defaultMessage: "You cancelled the request before it could finish. Please, try again.",
      }),
      blocked_credentials: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.blocked-credentials",
        defaultMessage:
          "The Public Administration has blocked your access for security reasons. Please, try again later.",
      }),
      user_not_registered: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.user-not-registered",
        defaultMessage: "The user is not registered in the Public Administration",
      }),
      document_not_found: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.document-not-found",
        defaultMessage: "We couldn't find the requested document in the Public Administration",
      }),
      timeout: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.timeout",
        defaultMessage:
          "The Public Administration took too long to process your request. Please, try again.",
      }),
      generic: intl.formatMessage({
        id: "component.es-tax-documents-content-error-message.generic",
        defaultMessage: "An unknown error happened.",
      }),
    }),
    [intl.locale]
  );
  return (
    <Text color="red.500" fontSize="xs">
      {reasons[error[0].reason]}
    </Text>
  );
}
