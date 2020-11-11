import { gql } from "@apollo/client";

import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineSignatureCompletedEvent_SignatureCompletedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureCompletedEventProps = {
  event: TimelineSignatureCompletedEvent_SignatureCompletedEventFragment;
};

export function TimelineSignatureCompletedEvent({
  event,
}: TimelineSignatureCompletedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<SignatureIcon />}
          color="white"
          backgroundColor="green.400"
        />
      }
    >
      <FormattedMessage
        id="timeline.signature-completed-description"
        defaultMessage="The petition has been signed {timeAgo}"
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

TimelineSignatureCompletedEvent.fragments = {
  SignatureCompletedEvent: gql`
    fragment TimelineSignatureCompletedEvent_SignatureCompletedEvent on SignatureCompletedEvent {
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
