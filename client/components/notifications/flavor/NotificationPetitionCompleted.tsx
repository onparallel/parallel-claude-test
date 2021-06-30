import { gql } from "@apollo/client";
import { Avatar, Text } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { NotificationPetitionCompleted_PetitionCompletedUserNotificationFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { Notification } from "./Notification";

export interface NotificationPetitionCompletedProps {
  notification: NotificationPetitionCompleted_PetitionCompletedUserNotificationFragment;
}

export function NotificationPetitionCompleted({
  notification,
}: NotificationPetitionCompletedProps) {
  return (
    <Notification
      notification={notification}
      icon={<NotificationAvatar />}
      path={`/replies`}
    >
      <FormattedMessage
        id="component.notification-petition-completed.body"
        defaultMessage="{name} completed the petition."
        values={{
          name: <ContactLink contact={notification.access.contact} />,
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
      background="green.600"
      icon={<CheckIcon color="white" fontSize="1rem" />}
    />
  );
}

NotificationPetitionCompleted.fragments = {
  PetitionCompletedUserNotification: gql`
    fragment NotificationPetitionCompleted_PetitionCompletedUserNotification on PetitionCompletedUserNotification {
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
