import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { PetitionBase } from "@parallel/graphql/__types";
import { useIntl } from "react-intl";
import { Notification } from "./Notification";

export interface NotificationDefaultProps {
  id: string;
  petition: PetitionBase;
  createdAt: string;
  isRead: boolean;
}

export function NotificationDefault({
  id,
  petition,
  createdAt,
  isRead,
}: NotificationDefaultProps) {
  const intl = useIntl();

  const petitionTitle =
    petition.name ??
    intl.formatMessage({
      id: "generic.untitled-petition",
      defaultMessage: "Untitled petition",
    });

  const body = "";

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={body}
      title={petitionTitle}
      timestamp={createdAt}
      isRead={isRead}
      url={`/${intl.locale}/app/petitions/${petition.id}`}
    />
  );
}

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="gray.200"
      icon={<BellIcon fontSize="1rem" />}
    />
  );
}

NotificationDefault.fragments = {
  PetitionUserNotification: gql`
    fragment NotificationDefault_PetitionUserNotification on PetitionUserNotification {
      id
      createdAt
      isRead
      petition {
        id
        name
      }
    }
  `,
};
