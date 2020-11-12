import { gql } from "@apollo/client";
import { Box, Button, Flex, useDisclosure } from "@chakra-ui/core";
import { SignatureIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
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
            defaultMessage="{contact} declined the signature {timeAgo}"
            values={{
              contact: event.contact ? (
                <ContactLink contact={event.contact} />
              ) : (
                <DeletedContact />
              ),
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
        contact={event.contact ?? null}
        declineReason={event.declineReason!}
      />
    </TimelineItem>
  );
}

TimelineSignatureDeclinedEvent.fragments = {
  SignatureDeclinedEvent: gql`
    fragment TimelineSignatureDeclinedEvent_SignatureDeclinedEvent on SignatureDeclinedEvent {
      contact {
        ...ContactLink_Contact
      }
      declineReason
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
