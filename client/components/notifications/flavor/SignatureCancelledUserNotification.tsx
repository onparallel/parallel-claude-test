import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface SignatureCancelledUserNotificationProps {
  isFirst?: boolean;
  notification: any;
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
            <Avatar
              boxSize="36px"
              background="red.500"
              icon={<SignatureIcon color="white" fontSize="1rem" />}
            />
          }
          path={`/replies#signatures`}
        >
          <FormattedMessage
            id="component.notification-signature-cancelled.body"
            defaultMessage="The eSignature has been cancelled."
          />
        </PetitionUserNotification>
      );
    }
  ),
  {
    fragments: {
      SignatureCancelledUserNotification: gql`
        fragment SignatureCancelledUserNotification_SignatureCancelledUserNotification on SignatureCancelledUserNotification {
          ...PetitionUserNotification_PetitionUserNotification
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
      `,
    },
  }
);
