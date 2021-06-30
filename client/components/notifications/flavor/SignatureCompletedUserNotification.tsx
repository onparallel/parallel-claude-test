import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface SignatureCompletedUserNotificationProps {
  notification: any;
}

export function SignatureCompletedUserNotification({
  notification,
}: SignatureCompletedUserNotificationProps) {
  return (
    <PetitionUserNotification
      notification={notification}
      icon={<NotificationAvatar />}
      path={`/replies#signatures`}
    >
      <FormattedMessage
        id="component.notification-signature-completed.body"
        defaultMessage="The eSignature has been completed."
      />
    </PetitionUserNotification>
  );
}

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="green.500"
      icon={<SignatureIcon color="white" fontSize="1rem" />}
    />
  );
}

SignatureCompletedUserNotification.fragments = {
  SignatureCompletedUserNotification: gql`
    fragment SignatureCompletedUserNotification_SignatureCompletedUserNotification on SignatureCompletedUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
    }
    ${PetitionUserNotification.fragments.PetitionUserNotification}
  `,
};
