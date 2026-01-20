import { gql } from "@apollo/client";
import { Box, Flex } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineSignatureReminderEvent_SignatureReminderEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineSignatureReminderEventProps {
  event: TimelineSignatureReminderEvent_SignatureReminderEventFragment;
}

export function TimelineSignatureReminderEvent({ event }: TimelineSignatureReminderEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={SignatureIcon} color="black" backgroundColor="gray.200" />}
    >
      <Flex alignItems="center">
        <Box>
          <FormattedMessage
            id="component.timeline-signature-reminder-event.description"
            defaultMessage="{user} sent a reminder to the pending signers {timeAgo}"
            values={{
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

const _fragments = {
  SignatureReminderEvent: gql`
    fragment TimelineSignatureReminderEvent_SignatureReminderEvent on SignatureReminderEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
  `,
};
