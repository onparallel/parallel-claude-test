import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { UserArrowIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineOwnershipTransferredEventProps = {
  userId: string;
  event: TimelineOwnershipTransferredEvent_OwnershipTransferredEventFragment;
};

export function TimelineOwnershipTransferredEvent({
  event,
  userId,
}: TimelineOwnershipTransferredEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<UserArrowIcon />}
          color="white"
          backgroundColor="purple.500"
        />
      }
    >
      <FormattedMessage
        id="timeline.ownership-transferred-description"
        defaultMessage="{same, select, true {You} other {{user}}} transferred the ownership of this petition {hasPreviousOwner, select, true {from {previousOwner} } other {}}to {owner} {timeAgo}"
        values={{
          same: userId === event.user?.id,
          hasPreviousOwner: !!event.previousOwner,
          previousOwner: <UserReference user={event.previousOwner!} />,
          b: (chunks: any[]) => <Text as="strong">{chunks}</Text>,
          user: <UserReference user={event.user} />,
          owner: <UserReference user={event.owner} />,
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

TimelineOwnershipTransferredEvent.fragments = {
  OwnershipTransferredEvent: gql`
    fragment TimelineOwnershipTransferredEvent_OwnershipTransferredEvent on OwnershipTransferredEvent {
      user {
        ...UserReference_User
      }
      owner {
        ...UserReference_User
      }
      previousOwner {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
  `,
};
