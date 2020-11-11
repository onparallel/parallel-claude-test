import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/core";
import { SignatureIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineSignatureStartedEvent_SignatureStartedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineSignatureStartedEventProps = {
  userId: string;
  event: TimelineSignatureStartedEvent_SignatureStartedEventFragment;
};

export function TimelineSignatureStartedEvent({
  event,
  userId,
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
        defaultMessage="{same, select, true {You} other {{user}}} sent the petition to sign {timeAgo}"
        values={{
          same: userId === event.user?.id,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
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

TimelineSignatureStartedEvent.fragments = {
  SignatureStartedEvent: gql`
    fragment TimelineSignatureStartedEvent_SignatureStartedEvent on SignatureStartedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
