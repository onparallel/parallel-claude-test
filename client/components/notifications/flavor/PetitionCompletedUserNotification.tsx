import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment } from "@parallel/graphql/__types";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface PetitionCompletedUserNotificationProps {
  notification: PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment;
}

export function PetitionCompletedUserNotification({
  notification,
}: PetitionCompletedUserNotificationProps) {
  return (
    <PetitionUserNotification
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
    </PetitionUserNotification>
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

PetitionCompletedUserNotification.fragments = {
  PetitionCompletedUserNotification: gql`
    fragment PetitionCompletedUserNotification_PetitionCompletedUserNotification on PetitionCompletedUserNotification {
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
