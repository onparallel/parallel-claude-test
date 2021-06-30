import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { NotificationEmailBounced_MessageEmailBouncedUserNotificationFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface NotificationEmailBouncedProps {
  notification: NotificationEmailBounced_MessageEmailBouncedUserNotificationFragment;
}

export function MessageEmailBouncedUserNotification({
  notification,
}: NotificationEmailBouncedProps) {
  return (
    <PetitionUserNotification
      notification={notification}
      icon={<NotificationAvatar />}
      path={`/activity`}
    >
      <FormattedMessage
        id="component.notification-email-bounced.body"
        defaultMessage="Error sending request to recipient {name}."
        values={{
          name: <ContactLink contact={notification.access.contact} isFull />,
        }}
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
      icon={<EmailXIcon color="white" fontSize="1rem" />}
    />
  );
}

MessageEmailBouncedUserNotification.fragments = {
  MessageEmailBouncedUserNotification: gql`
    fragment MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotification on MessageEmailBouncedUserNotification {
      ...PetitionUserNotification_PetitionUserNotification
      access {
        contact {
          ...ContactLink_Contact
        }
      }
    }
    ${PetitionUserNotification.fragments.PetitionUserNotification}
    ${ContactLink.fragments.Contact}
  `,
};
