import { gql } from "@apollo/client";
import { Avatar, Text } from "@chakra-ui/react";
import { BellOffIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { ContactUnsubscribeNotification_ContactUnsubscribeNotificationFragment } from "@parallel/graphql/__types";
import {
  UnsubscribeAnswersKey,
  useUnsubscribeAnswers,
} from "@parallel/utils/useUnsubscribeAnswers";
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
      const answers = useUnsubscribeAnswers();
      const { otherReason, access } = notification;
      const reason = notification.reason as UnsubscribeAnswersKey;

      return (
        <PetitionUserNotification
          ref={ref}
          isFirst={isFirst}
          notification={notification}
          icon={
            <Avatar
              boxSize="36px"
              background="red.600"
              icon={<BellOffIcon color="white" fontSize="1rem" />}
            />
          }
          path={`/activity`}
        >
          <FormattedMessage
            id="component.notification-contact-unsubscribe.body"
            defaultMessage="{name} was unsusbscribed from automatic reminders: "
            values={{
              name: (
                <ContactLink
                  draggable="false"
                  tabIndex={-1}
                  contact={access.contact}
                />
              ),
            }}
          />
          {reason === "OTHER" ? (
            <Text as="cite">{`"${answers[reason]}: ${otherReason}"`}</Text>
          ) : (
            <Text as="cite">{`"${answers[reason]}"`}</Text>
          )}
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
          reason
          otherReason
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${ContactLink.fragments.Contact}
      `,
    },
  }
);
