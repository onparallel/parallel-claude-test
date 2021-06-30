import { gql } from "@apollo/client";
import { Avatar } from "@chakra-ui/react";
import { CheckIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment } from "@parallel/graphql/__types";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface PetitionCompletedUserNotificationProps {
  isFocusable?: boolean;
  notification: PetitionCompletedUserNotification_PetitionCompletedUserNotificationFragment;
}

export const PetitionCompletedUserNotification = Object.assign(
  forwardRef<HTMLElement, PetitionCompletedUserNotificationProps>(
    function PetitionCompletedUserNotification(
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
              background="green.600"
              icon={<CheckIcon color="white" fontSize="1rem" />}
            />
          }
          path={`/replies`}
        >
          <FormattedMessage
            id="component.notification-petition-completed.body"
            defaultMessage="{name} completed the petition."
            values={{
              name: (
                <ContactLink
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
    },
  }
);
