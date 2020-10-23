import { gql } from "@apollo/client";
import { Text } from "@chakra-ui/core";
import { EditIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionReopenedEvent_PetitionReopenedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { UserReference } from "../UserReference";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelinePetitionReopenedEventProps = {
  userId: string;
  event: TimelinePetitionReopenedEvent_PetitionReopenedEventFragment;
};

export function TimelinePetitionReopenedEvent({
  event,
  userId,
}: TimelinePetitionReopenedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon
          icon={<EditIcon />}
          color="black"
          backgroundColor="gray.200"
        />
      }
    >
      <FormattedMessage
        id="timeline.petition-reopened-description"
        defaultMessage="{same, select, true {You} other {{user}}} reopened the petition {timeAgo}"
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

TimelinePetitionReopenedEvent.fragments = {
  PetitionReopenedEvent: gql`
    fragment TimelinePetitionReopenedEvent_PetitionReopenedEvent on PetitionReopenedEvent {
      user {
        ...UserReference_User
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${ContactLink.fragments.Contact}
  `,
};
