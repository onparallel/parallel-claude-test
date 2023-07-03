import { gql } from "@apollo/client";
import { DateTime } from "@parallel/components/common/DateTime";
import { useSignatureCancelledRequestErrorMessage_SignatureCancelledEventFragment } from "@parallel/graphql/__types";
import { useCallback } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import { FORMATS } from "./dates";

export function useSignatureCancelledRequestErrorMessage() {
  const intl = useIntl();

  return useCallback(
    (event: useSignatureCancelledRequestErrorMessage_SignatureCancelledEventFragment) => {
      switch (event.errorCode) {
        case "SIGNATURIT_ACCOUNT_DEPLETED_CREDITS":
        case "INSUFFICIENT_SIGNATURE_CREDITS":
          return (
            <FormattedMessage
              id="component.signature-cancelled-request-error.insufficient-credits.description"
              defaultMessage="The eSignature could not be started due to lack of signature credits {timeAgo}"
              values={{
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          );
        case "UNKNOWN_ERROR":
          return (
            <FormattedMessage
              id="component.signature-cancelled-request-error.unknown-error.description"
              defaultMessage="The eSignature could not be started due to an unknown error {timeAgo}"
              values={{
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
              }}
            />
          );
        default:
          return (
            <FormattedMessage
              id="component.signature-cancelled-request-error.description"
              defaultMessage="The eSignature has been cancelled due to an error from the provider {timeAgo}: {message}"
              values={{
                timeAgo: (
                  <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
                ),
                message:
                  event.errorCode === "EMAIL_BOUNCED" ? (
                    <FormattedMessage
                      id="component.signature-cancelled-request-error.email-bounced.description"
                      defaultMessage="{hasEmail, select, true{The email<{signerEmail}>} other{an email}} has bounced."
                      values={{
                        hasEmail: Boolean(event.extraErrorData?.email),
                        signerEmail: event.extraErrorData?.email,
                      }}
                    />
                  ) : event.errorCode === "MAX_SIZE_EXCEEDED" ? (
                    <FormattedMessage
                      id="component.signature-cancelled-request-error.max-size-exceeded.description"
                      defaultMessage="The document exceeds the maximum size allowed. Please, reduce the size of the annexed files and try it again."
                    />
                  ) : event.errorCode === "CONSENT_REQUIRED" ||
                    event.errorCode === "ACCOUNT_SUSPENDED" ? (
                    <FormattedMessage
                      id="component.signature-cancelled-request-error.consent-required.description"
                      defaultMessage="The integration has expired and needs to be reauthorized."
                    />
                  ) : event.errorCode === "INVALID_CREDENTIALS" ? (
                    <FormattedMessage
                      id="component.signature-cancelled-request-error.invalid-credentials.description"
                      defaultMessage="The provided credentials are not valid anymore and need to be updated."
                    />
                  ) : (
                    <FormattedMessage
                      id="component.signature-cancelled-request-error.unknown.description"
                      defaultMessage="An unknown error happened."
                    />
                  ),
              }}
            />
          );
      }
    },
    [intl.locale]
  );
}

useSignatureCancelledRequestErrorMessage.fragments = {
  SignatureCancelledEvent: gql`
    fragment useSignatureCancelledRequestErrorMessage_SignatureCancelledEvent on SignatureCancelledEvent {
      errorCode
      extraErrorData
      createdAt
    }
  `,
};
