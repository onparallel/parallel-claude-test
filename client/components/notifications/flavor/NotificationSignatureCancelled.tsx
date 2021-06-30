import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { FormattedMessage } from "react-intl";
import { Notification } from "./Notification";

export interface NotificationSignatureCancelledProps {
  notification: any;
}

export function NotificationSignatureCancelled({
  notification,
}: NotificationSignatureCancelledProps) {
  return (
    <Notification
      notification={notification}
      icon={<NotificationAvatar />}
      path={`/replies#signatures`}
    >
      <FormattedMessage
        id="component.notification-signature-cancelled.body"
        defaultMessage="The eSignature has been cancelled."
      />
    </Notification>
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

NotificationSignatureCancelled.fragments = {
  SignatureCancelledUserNotification: gql`
    fragment NotificationSignatureCanceled_SignatureCancelledUserNotification on SignatureCancelledUserNotification {
      ...Notification_PetitionUserNotification
    }
    ${Notification.fragments.PetitionUserNotification}
  `,
};
