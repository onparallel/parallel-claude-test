import { gql } from "@apollo/client";
import { Box, Button, Flex, useDisclosure } from "@chakra-ui/react";
import { SignatureIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { DeletedContact } from "@parallel/components/common/DeletedContact";
import { TimelineSignatureCancelledEvent_SignatureCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { SignatureDeclinedEventModal } from "../SignatureDeclinedEventModal";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureCancelledEventProps = {
  userId: string;
  event: TimelineSignatureCancelledEvent_SignatureCancelledEventFragment;
};

export function TimelineSignatureCancelledEvent({
  event,
  userId,
}: TimelineSignatureCancelledEventProps) {
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
          {event.cancelType === "CANCELLED_BY_USER" && (
            <FormattedMessage
              id="timeline.signature-cancelled-description"
              defaultMessage="{same, select, true {You} other {{user}}} cancelled the eSignature process {timeAgo}"
              values={{
                same: userId === event.user?.id,
                user: <UserReference user={event.user} />,
                timeAgo: (
                  <DateTime
                    value={event.createdAt}
                    format={FORMATS.LLL}
                    useRelativeTime="always"
                  />
                ),
              }}
            />
          )}
          {event.cancelType === "DECLINED_BY_SIGNER" && (
            <FormattedMessage
              id="timeline.signature-declined-description"
              defaultMessage="{contact} has declined the eSignature process {timeAgo}"
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
          )}
        </Box>
        {event.cancelType === "DECLINED_BY_SIGNER" && event.cancellerReason && (
          <Button onClick={onOpen} size="sm" variant="outline" marginLeft={4}>
            <FormattedMessage
              id="timeline.signature-declined.see-reason"
              defaultMessage="See reason"
            />
          </Button>
        )}
      </Flex>
      {event.cancelType === "DECLINED_BY_SIGNER" && event.cancellerReason && (
        <SignatureDeclinedEventModal
          isOpen={isOpen}
          onClose={onClose}
          contact={event.contact ?? null}
          declineReason={event.cancellerReason!}
        />
      )}
    </TimelineItem>
  );
}

TimelineSignatureCancelledEvent.fragments = {
  SignatureCancelledEvent: gql`
    fragment TimelineSignatureCancelledEvent_SignatureCancelledEvent on SignatureCancelledEvent {
      user {
        ...UserReference_User
      }
      contact {
        ...ContactLink_Contact
      }
      cancelType
      cancellerReason
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
