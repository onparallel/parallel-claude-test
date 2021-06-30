import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface SignatureCancelledUserNotificationProps {
  notification: any;
}

export function SignatureCancelledUserNotification({
  notification,
}: SignatureCancelledUserNotificationProps) {
  return (
    <PetitionUserNotification
      notification={notification}
      icon={<NotificationAvatar />}
      path={`/replies#signatures`}
    >
      <FormattedMessage
        id="component.notification-signature-cancelled.body"
        defaultMessage="The eSignature has been cancelled."
      />
    </PetitionUserNotification>
  );
}

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="red.500"
      icon={<SignatureIcon color="white" fontSize="1rem" />}
    />
  );
}

SignatureCancelledUserNotification.fragments = {
  SignatureCancelledUserNotification: gql`
    fragment SignatureCancelledUserNotification_SignatureCancelledUserNotification on SignatureCancelledUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
    }
    ${PetitionUserNotification.fragments.PetitionUserNotification}
  `,
};
