import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface SignatureCompletedUserNotificationProps {
  isFocusable?: boolean;
  notification: any;
}

export const SignatureCompletedUserNotification = Object.assign(
  forwardRef<HTMLElement, SignatureCompletedUserNotificationProps>(
    function SignatureCompletedUserNotification(
      { isFocusable, notification },
      ref
    ) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFocusable={isFocusable}
          notification={notification}
          icon={
            <Avatar
              boxSize="36px"
              background="green.500"
              icon={<SignatureIcon color="white" fontSize="1rem" />}
            />
          }
          path={`/replies#signatures`}
        >
          <FormattedMessage
            id="component.notification-signature-completed.body"
            defaultMessage="The eSignature has been completed."
          />
        </PetitionUserNotification>
      );
    }
  ),
  {
    fragments: {
      SignatureCompletedUserNotification: gql`
        fragment SignatureCompletedUserNotification_SignatureCompletedUserNotification on SignatureCompletedUserNotification {
          ...PetitionUserNotification_PetitionUserNotification
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
      `,
    },
  }
);
