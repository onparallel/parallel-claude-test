import { gql } from "@apollo/client";
import { Avatar, Text } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";
import { PetitionAccess, PetitionBase } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { Notification } from "./Notification";

export interface NotificationEmailBouncedProps {
  id: string;
  petition: PetitionBase;
  access: PetitionAccess;
  createdAt: string;
  isRead: boolean;
}

export function NotificationEmailBounced({
  id,
  petition,
  access,
  createdAt,
  isRead,
}: NotificationEmailBouncedProps) {
  const intl = useIntl();

  const petitionTitle =
    petition.name ??
    intl.formatMessage({
      id: "generic.untitled-petition",
      defaultMessage: "Untitled petition",
    });

  const body = (
    <FormattedMessage
      id="ccomponent.notification-email-bounced.body"
      defaultMessage="Error sending request to recipient <b>{name}</b> ({email})."
      values={{
        name: access.contact?.fullName,
        b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
        email: access.contact?.email,
      }}
    />
  );

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={body}
      title={petitionTitle}
      timestamp={createdAt}
      isRead={isRead}
      url={`/${intl.locale}/app/petitions/${petition.id}/activity`}
    />
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
      access {
        contact {
          id
          fullName
          email
        }
      }
    }
  `,
};
