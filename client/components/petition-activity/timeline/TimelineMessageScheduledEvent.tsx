import { gql } from "@apollo/client";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { TimeIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineMessageScheduledEvent_MessageScheduledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import {
  SentPetitionMessageDialog,
  useSentPetitionMessageDialog,
} from "../SentPetitionMessageDialog";
import { UserReference } from "../UserReference";
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
  const showSentPetitionMessage = useSentPetitionMessageDialog();
  async function handleSeeMessageClick() {
    try {
      await showSentPetitionMessage({ message });
    } catch {}
  }
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<TimeIcon />}
          color="black"
          backgroundColor="gray.200"
        />
      }
    >
      <Flex alignItems="center">
        <Box>
          <FormattedMessage
            id="timeline.message-scheduled-description"
            defaultMessage="{same, select, true {You} other {{user}}} scheduled a message for {scheduledAt} {subject, select, null {without subject} other {with subject <b>{subject}</b>}} to {contact} {timeAgo}"
            values={{
              same: userId === message.sender?.id,
              b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
              user: <UserReference user={message.sender} />,
              subject: message.emailSubject,
              contact: <ContactLink contact={message.access.contact} />,
              scheduledAt: (
                <DateTime
                  fontWeight="bold"
                  value={message.scheduledAt!}
                  format={FORMATS.LLL}
                />
              ),
              timeAgo: (
                <DateTime
                  value={createdAt}
                  format={FORMATS.LLL}
                  useRelativeTime="always"
                />
              ),
            }}
          />
        </Box>
        <Button
          onClick={handleSeeMessageClick}
          size="sm"
          variant="outline"
          marginLeft={4}
        >
          <FormattedMessage
            id="timeline.message-sent-see-message"
            defaultMessage="See message"
          />
        </Button>
        {message.status === "SCHEDULED" ? (
          <Button
            size="sm"
            variant="outline"
            colorScheme="red"
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
          ...UserReference_User
        }
        status
        scheduledAt
        emailSubject
        access {
          contact {
            ...ContactLink_Contact
          }
        }
        ...SentPetitionMessageDialog_PetitionMessage
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
    ${SentPetitionMessageDialog.fragments.PetitionMessage}
  `,
};
