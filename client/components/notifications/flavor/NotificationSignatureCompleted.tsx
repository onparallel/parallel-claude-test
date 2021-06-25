import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { PetitionBase } from "@parallel/graphql/__types";
import { FormattedMessage, useIntl } from "react-intl";
import { Notification, NotificationBody } from "./Notification";

export interface NotificationSignatureCompletedProps {
  id: string;
  petition: PetitionBase;
  createdAt: string;
  isRead: boolean;
}

export function NotificationSignatureCompleted({
  id,
  petition,
  createdAt,
  isRead,
}: NotificationSignatureCompletedProps) {
  const intl = useIntl();

  const petitionTitle =
    petition.name ??
    intl.formatMessage({
      id: "generic.untitled-petition",
      defaultMessage: "Untitled petition",
    });

  return (
    <Notification
      id={id}
      icon={<NotificationAvatar />}
      body={
        <NotificationBody
          body={
            <FormattedMessage
              id="component.notification-signature-completed.body"
              defaultMessage="The digital signature has been completed."
            />
          }
        />
      }
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
      background="green.500"
      icon={<SignatureIcon color="white" fontSize="1rem" />}
    />
  );
}

NotificationSignatureCompleted.fragments = {
  SignatureCompletedUserNotification: gql`
    fragment NotificationEmailBounced_SignatureCompletedUserNotification on SignatureCompletedUserNotification {
      id
      petition {
        id
        name
      }
      createdAt
    }
  `,
};
