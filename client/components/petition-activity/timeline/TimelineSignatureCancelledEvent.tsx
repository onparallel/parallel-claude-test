import { gql } from "@apollo/client";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineSignatureCancelledEvent_SignatureCancelledEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
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
      <FormattedMessage
        id="timeline.signature-started-description"
        defaultMessage="{same, select, true {You} other {{user}}} cancelled the signature process {timeAgo}"
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
    </TimelineItem>
  );
}

TimelineSignatureCancelledEvent.fragments = {
  SignatureCancelledEvent: gql`
    fragment TimelineSignatureCancelledEvent_SignatureCancelledEvent on SignatureCancelledEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
