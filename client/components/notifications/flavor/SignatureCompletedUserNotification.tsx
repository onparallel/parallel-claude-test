import { gql } from "@apollo/client";
import { Circle } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface SignatureCompletedUserNotificationProps {
  isFirst?: boolean;
  notification: any;
}

export const SignatureCompletedUserNotification = Object.assign(
  forwardRef<HTMLElement, SignatureCompletedUserNotificationProps>(
    function SignatureCompletedUserNotification({ isFirst, notification }, ref) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Circle boxSize="36px" background="green.500">
              <SignatureIcon color="white" fontSize="1rem" />
            </Circle>
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
