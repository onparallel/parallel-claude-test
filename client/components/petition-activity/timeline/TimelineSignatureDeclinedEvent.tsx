import { gql } from "@apollo/client";
import { Box, Button, Flex, useDisclosure } from "@chakra-ui/core";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineSignatureDeclinedEvent_SignatureDeclinedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { SignatureDeclinedEventModal } from "../SignatureDeclinedEventModal";

import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureDeclinedEventProps = {
  event: TimelineSignatureDeclinedEvent_SignatureDeclinedEventFragment;
};

export function TimelineSignatureDeclinedEvent({
  event,
}: TimelineSignatureDeclinedEventProps) {
  const { isOpen, onClose, onOpen } = useDisclosure();

  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<SignatureIcon />}
          color="white"
          backgroundColor="red.400"
        />
      }
    >
      <Flex alignItems="center">
        <Box>
          <FormattedMessage
            id="timeline.signature-declined-description"
            defaultMessage="{declinerName} ({declinerEmail}) declined the signature {timeAgo}"
            values={{
              declinerName: event.declinerName,
              declinerEmail: event.declinerEmail,
              timeAgo: (
                <DateTime
                  value={event.createdAt}
                  format={FORMATS.LLL}
                  useRelativeTime="always"
                />
              ),
            }}
          />
        </Box>

        {event.declineReason && (
          <Button onClick={onOpen} size="sm" variant="outline" marginLeft={4}>
            <FormattedMessage
              id="timeline.signature-declined.see-reason"
              defaultMessage="See reason"
            />
          </Button>
        )}
      </Flex>
      <SignatureDeclinedEventModal
        isOpen={isOpen}
        onClose={onClose}
        declinerEmail={event.declinerEmail}
        declinerName={event.declinerName}
        declineReason={event.declineReason!}
      />
    </TimelineItem>
  );
}

TimelineSignatureDeclinedEvent.fragments = {
  SignatureDeclinedEvent: gql`
    fragment TimelineSignatureDeclinedEvent_SignatureDeclinedEvent on SignatureDeclinedEvent {
      declinerEmail
      declinerName
      declineReason
      createdAt
    }
  `,
};
