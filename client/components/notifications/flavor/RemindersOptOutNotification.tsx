import { gql } from "@apollo/client";
import { Avatar, Text } from "@chakra-ui/react";
import { BellOffIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { RemindersOptOutNotification_RemindersOptOutNotificationFragment } from "@parallel/graphql/__types";
import {
  ReminderOptOutReason,
  useReminderOptOutReasons,
} from "@parallel/utils/useReminderOptOutReasons";
import { forwardRef } from "react";
import { FormattedMessage } from "react-intl";
import { PetitionUserNotification } from "./PetitionUserNotification";

export interface RemindersOptOutNotificationProps {
  isFirst?: boolean;
  notification: RemindersOptOutNotification_RemindersOptOutNotificationFragment;
}

export const RemindersOptOutNotification = Object.assign(
  forwardRef<HTMLElement, RemindersOptOutNotificationProps>(
    function RemindersOptOutNotification({ isFirst, notification }, ref) {
      const answers = useReminderOptOutReasons();
      const { other, access } = notification;
      const reason = notification.reason as ReminderOptOutReason;

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
          <Text>
            <FormattedMessage
              id="component.notification-reminders-opt-out.body"
              defaultMessage="{name} has opted out from receiving reminders: "
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
          </Text>
          <Text as="cite" fontSize="sm">
            {reason === "OTHER"
              ? `"${answers[reason]}: ${other}"`
              : answers[reason]}
          </Text>
        </PetitionUserNotification>
      );
    }
  ),
  {
    fragments: {
      RemindersOptOutNotification: gql`
        fragment RemindersOptOutNotification_RemindersOptOutNotification on RemindersOptOutNotification {
          ...PetitionUserNotification_PetitionUserNotification
          access {
            contact {
              ...ContactLink_Contact
            }
          }
          reason
          other
        }
        ${PetitionUserNotification.fragments.PetitionUserNotification}
        ${ContactLink.fragments.Contact}
      `,
    },
  }
);
