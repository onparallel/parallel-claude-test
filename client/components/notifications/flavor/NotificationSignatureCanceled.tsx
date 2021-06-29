import { gql } from "@apollo/client";
import { Notification } from "./Notification";
import { Avatar } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { FormattedMessage, useIntl } from "react-intl";
import { PetitionBase } from "@parallel/graphql/__types";

export interface NotificationSignatureCanceledProps {
  id: string;
  petition: PetitionBase;
  createdAt: string;
  isRead: boolean;
}

export function NotificationSignatureCanceled({
  id,
  petition,
  createdAt,
  isRead,
}: NotificationSignatureCanceledProps) {
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
        <FormattedMessage
          id="component.notification-signature-canceled.body"
          defaultMessage="The digital signature has been canceled."
        />
      }
      title={petitionTitle}
      timestamp={createdAt}
      isRead={isRead}
      url={`/${intl.locale}/app/petitions/${petition.id}/replies#signatures`}
    />
  );
}

function NotificationAvatar() {
  return (
    <Avatar
      height="36px"
      width="36px"
      background="red.500"
      Ø
      icon={<SignatureIcon color="white" fontSize="1rem" />}
    />
  );
}

NotificationSignatureCanceled.fragments = {
  SignatureCancelledUserNotification: gql`
    fragment NotificationEmailBounced_SignatureCancelledUserNotification on SignatureCancelledUserNotification {
      id
      petition {
        id
        name
      }
      createdAt
      isRead
    }
  `,
};
