import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { EmailXIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface ReminderEmailBouncedUserNotificationProps {
  isFirst?: boolean;
  notification: ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotificationFragment;
}

export const ReminderEmailBouncedUserNotification = Object.assign(
  forwardRef<HTMLElement, ReminderEmailBouncedUserNotificationProps>(
    function ReminderEmailBouncedUserNotification(
      { isFirst, notification },
      ref
    ) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
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
            id="component.notification-reminder-bounced.body"
            defaultMessage="Error sending reminder to recipient {name}."
            values={{
              name: (
                <ContactLink
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
      ReminderEmailBouncedUserNotification: gql`
        fragment ReminderEmailBouncedUserNotification_ReminderEmailBouncedUserNotification on ReminderEmailBouncedUserNotification {
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
