import { gql } from "@apollo/client";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineSignatureStartedEvent_SignatureStartedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureStartedEventProps = {
  event: TimelineSignatureStartedEvent_SignatureStartedEventFragment;
};

export function TimelineSignatureStartedEvent({
  event,
}: TimelineSignatureStartedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<SignatureIcon />}
          color="black"
          backgroundColor="gray.200"
        />
      }
    >
      <FormattedMessage
        id="timeline.signature-started-description"
        defaultMessage="We started an eSignature process on the petition {timeAgo}"
        values={{
          timeAgo: (
            <DateTime
              value={event.createdAt}
              format={FORMATS.LLL}
              useRelativeTime="always"
            />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelineSignatureStartedEvent.fragments = {
  SignatureStartedEvent: gql`
    fragment TimelineSignatureStartedEvent_SignatureStartedEvent on SignatureStartedEvent {
      createdAt
    }
  `,
};
