import { Link, Text, Flex, Box, Button } from "@chakra-ui/core";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { MessageEventsIndicator } from "@parallel/components/petition-activity/MessageEventsIndicator";
import { TimelineMessageScheduledEvent_MessageScheduledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { gql } from "apollo-boost";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineMessageScheduledEventProps = {
  userId: string;
  event: TimelineMessageScheduledEvent_MessageScheduledEventFragment;
  onCancelScheduledMessage: () => void;
};

export function TimelineMessageScheduledEvent({
  event: { message, createdAt },
  userId,
  onCancelScheduledMessage,
}: TimelineMessageScheduledEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon="time" color="black" backgroundColor="gray.200" />
      }
    >
      <Flex alignItems="center">
        <Box flex="1">
          <FormattedMessage
            id="timeline.message-scheduled-description"
            defaultMessage="{same, select, true {You} other {<b>{user}</b>}} scheduled a message for {scheduledAt} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
            values={{
              same: userId === message.sender!.id,
              b: (...chunks: any[]) => <Text as="strong">{chunks}</Text>,
              user: message.sender!.fullName,
              subject: message.emailSubject,
              contact: message.access.contact ? (
                <ContactLink contact={message.access.contact} />
              ) : (
                <DeletedContact />
              ),
              scheduledAt: (
                <Link fontWeight="bold">
                  <DateTime
                    value={message.scheduledAt!}
                    format={FORMATS.LLL}
                    useRelativeTime
                  />
                </Link>
              ),
              timeAgo: (
                <Link>
                  <DateTime
                    value={createdAt}
                    format={FORMATS.LLL}
                    useRelativeTime="always"
                  />
                </Link>
              ),
            }}
          />
        </Box>
        {message.status === "SCHEDULED" ? (
          <Button
            size="sm"
            variant="outline"
            variantColor="red"
            marginLeft={4}
            onClick={onCancelScheduledMessage}
          >
            <FormattedMessage
              id="timeline.message-scheduled-cancel"
              defaultMessage="Cancel"
            />
          </Button>
        ) : null}
      </Flex>
    </TimelineItem>
  );
}

TimelineMessageScheduledEvent.fragments = {
  MessageScheduledEvent: gql`
    fragment TimelineMessageScheduledEvent_MessageScheduledEvent on MessageScheduledEvent {
      message {
        sender {
          id
          fullName
        }
        status
        scheduledAt
        emailSubject
        access {
          contact {
            ...ContactLink_Contact
          }
        }
        ...MessageEventsIndicator_PetitionMessage
      }
      createdAt
    }
    ${MessageEventsIndicator.fragments.PetitionMessage}
    ${ContactLink.fragments.Contact}
  `,
};
