import { gql } from "@apollo/client";
import { Circle } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface SignatureCancelledUserNotificationProps {
  isFirst?: boolean;
  notification: SignatureCancelledUserNotification_SignatureCancelledUserNotificationFragment;
}

export const SignatureCancelledUserNotification = Object.assign(
  forwardRef<HTMLElement, SignatureCancelledUserNotificationProps>(
    function SignatureCancelledUserNotification({ isFirst, notification }, ref) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Circle size="36px" background="red.500">
              <SignatureIcon color="white" fontSize="1rem" />
            </Circle>
          }
          path={"/replies#signatures"}
        >
          {notification.errorCode === "INSUFFICIENT_SIGNATURE_CREDITS" ? (
            <FormattedMessage
              id="component.notification-signature-cancelled.no-credits-left.body"
              defaultMessage="The eSignature could not be started because you reached your plan's limit."
            />
          ) : notification.errorCode === "EMAIL_BOUNCED" ? (
            <FormattedMessage
              id="component.notification-signature-cancelled.email-bounced.body"
              defaultMessage="The eSignature has been cancelled due to an error with {hasEmail, select, true{<{signerEmail}>} other{an email}}"
              values={{
                hasEmail: Boolean(notification.extraErrorData?.email),
                signerEmail: notification.extraErrorData?.email,
              }}
            />
          ) : (
            <FormattedMessage
              id="component.notification-signature-cancelled.generic.body"
              defaultMessage="The eSignature has been cancelled."
            />
          )}
        </PetitionUserNotification>
      );
    }
  ),
  {
    fragments: {
      SignatureCancelledUserNotification: gql`
        fragment SignatureCancelledUserNotification_SignatureCancelledUserNotification on SignatureCancelledUserNotification {
          errorCode
          extraErrorData
          ...PetitionUserNotification_PetitionUserNotification
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
      `,
    },
  }
);
