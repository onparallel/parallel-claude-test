import { gql } from "@apollo/client";
import { Notification, NotificationBody } from "./Notification";
import { Avatar, Text } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionAccess, PetitionBase } from "@parallel/graphql/__types";

export interface NotificationPetitionCompletedProps {
  id: string;
  petition: PetitionBase;
  access: PetitionAccess;
  createdAt: string;
  isRead: boolean;
}

export function NotificationPetitionCompleted({
  id,
  petition,
  access,
  createdAt,
  isRead,
}: NotificationPetitionCompletedProps) {
  const intl = useIntl();

  const petitionTitle =
    petition.name ??
    intl.formatMessage({
      id: "generic.untitled-petition",
      defaultMessage: "Untitled petition",
    });

  const body = (
    <FormattedMessage
      id="ccomponent.notification-petition-completed.body"
      defaultMessage="<b>{name}</b> completed the petition."
      values={{
        name: access.contact?.fullName,
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
      }}
    />
  );

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={<NotificationBody body={body} />}
      title={petitionTitle}
      timestamp={createdAt}
      isRead={isRead}
    />
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
    fragment NotificationEmailBounced_PetitionCompletedUserNotification on PetitionCompletedUserNotification {
      id
      petition {
        id
        name
      }
      access {
        contact {
          id
          fullName
          email
        }
      }
      createdAt
    }
  `,
};
