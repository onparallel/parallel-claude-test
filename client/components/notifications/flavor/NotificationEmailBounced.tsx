import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { NotificationEmailBounced_MessageEmailBouncedUserNotificationFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { Notification } from "./Notification";

export interface NotificationEmailBouncedProps {
  notification: NotificationEmailBounced_MessageEmailBouncedUserNotificationFragment;
}

export function NotificationEmailBounced({
  notification,
}: NotificationEmailBouncedProps) {
  return (
    <Notification
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
    </Notification>
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

NotificationEmailBounced.fragments = {
  MessageEmailBouncedUserNotification: gql`
    fragment NotificationEmailBounced_MessageEmailBouncedUserNotification on MessageEmailBouncedUserNotification {
      ...Notification_PetitionUserNotification
      access {
        contact {
          ...ContactLink_Contact
        }
      }
    }
    ${Notification.fragments.PetitionUserNotification}
    ${ContactLink.fragments.Contact}
  `,
};
