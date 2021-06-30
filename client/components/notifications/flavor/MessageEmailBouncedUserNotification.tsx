import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface MessageEmailBouncedUserNotificationProps {
  isFocusable?: boolean;
  notification: MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragment;
}

export const MessageEmailBouncedUserNotification = Object.assign(
  forwardRef<HTMLElement, MessageEmailBouncedUserNotificationProps>(
    function MessageEmailBouncedUserNotification(
      { isFocusable, notification },
      ref
    ) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFocusable={isFocusable}
          notification={notification}
          icon={
            <Avatar
              boxSize="36px"
              background="red.500"
              icon={<EmailXIcon color="white" fontSize="1rem" />}
            />
          }
          path={`/activity`}
        >
          <FormattedMessage
            id="component.notification-email-bounced.body"
            defaultMessage="Error sending request to recipient {name}."
            values={{
              name: (
                <ContactLink
                  tabIndex={-1}
                  contact={notification.access.contact}
                  isFull
                />
              ),
            }}
          />
        </PetitionUserNotification>
      );
    }
  ),
  {
    fragments: {
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
    },
  }
);
