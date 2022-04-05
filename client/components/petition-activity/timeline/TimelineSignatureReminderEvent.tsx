import { gql } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineSignatureReminderEvent_SignatureReminderEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureReminderEventProps = {
  userId: string;
  event: TimelineSignatureReminderEvent_SignatureReminderEventFragment;
};

export function TimelineSignatureReminderEvent({
  event,
  userId,
}: TimelineSignatureReminderEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<SignatureIcon />} color="black" backgroundColor="gray.200" />}
    >
      <Flex alignItems="center">
        <Box>
          <FormattedMessage
            id="timeline.signature-reminder.description"
            defaultMessage="{userIsYou, select, true {You} other {{user}}} sent a reminder to the pending signers {timeAgo}"
            values={{
              userIsYou: userId === event.user?.id,
              user: <UserReference user={event.user} />,
              timeAgo: (
                <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
              ),
            }}
          />
        </Box>
      </Flex>
    </TimelineItem>
  );
}

TimelineSignatureReminderEvent.fragments = {
  SignatureReminderEvent: gql`
    fragment TimelineSignatureReminderEvent_SignatureReminderEvent on SignatureReminderEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
