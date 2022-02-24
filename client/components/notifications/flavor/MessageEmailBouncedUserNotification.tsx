import { gql } from "@apollo/client";
import { Circle } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface MessageEmailBouncedUserNotificationProps {
  isFirst?: boolean;
  notification: MessageEmailBouncedUserNotification_MessageEmailBouncedUserNotificationFragment;
}

export const MessageEmailBouncedUserNotification = Object.assign(
  forwardRef<HTMLElement, MessageEmailBouncedUserNotificationProps>(
    function MessageEmailBouncedUserNotification({ isFirst, notification }, ref) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Circle size="36px" background="red.500">
              <EmailXIcon color="white" fontSize="1rem" />
            </Circle>
          }
          path={`/activity`}
        >
          <FormattedMessage
            id="component.notification-email-bounced.body"
            defaultMessage="Error sending petition to recipient {name}."
            values={{
              name: (
                <ContactReference
                  draggable="false"
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
              ...ContactReference_Contact
            }
          }
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${ContactReference.fragments.Contact}
      `,
    },
  }
);
