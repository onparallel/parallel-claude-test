import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { BellIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { ContactUnsubscribeNotification_ContactUnsubscribeNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface ContactUnsubscribeNotificationProps {
  isFirst?: boolean;
  notification: ContactUnsubscribeNotification_ContactUnsubscribeNotificationFragment;
}

export const ContactUnsubscribeNotification = Object.assign(
  forwardRef<HTMLElement, ContactUnsubscribeNotificationProps>(
    function ContactUnsubscribeNotification({ isFirst, notification }, ref) {
      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Avatar
              boxSize="36px"
              background="green.600"
              icon={<BellIcon color="white" fontSize="1rem" />}
            />
          }
          path={`/replies`}
        >
          <FormattedMessage
            id="component.notification-contact-unsubscribe.body"
            defaultMessage="{name} has unsubscribed from the reminders."
            values={{
              name: (
                <ContactLink
                  draggable="false"
                  tabIndex={-1}
                  contact={notification.access.contact}
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
      ContactUnsubscribeNotification: gql`
        fragment ContactUnsubscribeNotification_ContactUnsubscribeNotification on ContactUnsubscribeNotification {
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
