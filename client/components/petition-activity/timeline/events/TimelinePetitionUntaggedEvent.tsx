import { gql } from "@apollo/client";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionUntaggedEvent_PetitionUntaggedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { TagReference } from "../../TagReference";
import { UserReference } from "../../UserReference";
import { TimelineItem } from "../common/TimelineItem";
import { TagIcon } from "@parallel/chakra/icons";
import { TimelineIcon } from "../common/TimelineIcon";

export interface TimelinePetitionUntaggedEventProps {
  userId: string;
  event: TimelinePetitionUntaggedEvent_PetitionUntaggedEventFragment;
}

export function TimelinePetitionUntaggedEvent({
  event,
  userId,
}: TimelinePetitionUntaggedEventProps) {
  const intl = useIntl();
  return (
    <TimelineItem icon={<TimelineIcon icon={TagIcon} color="white" backgroundColor="red.500" />}>
      <FormattedMessage
        id="component.timeline-petition-untagged-event.description"
        defaultMessage="{userIsYou, select, true {You} other {{user}}} removed {tagCount, plural, =1{tag} other{tags}} {tagList} from this parallel {timeAgo}"
        values={{
          userIsYou: userId === event.user?.id,
          user: <UserReference user={event.user} />,
          tagList: intl.formatList(event.tags.map((tag, i) => <TagReference key={i} tag={tag} />)),
          tagCount: event.tags.length,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionUntaggedEvent.fragments = {
  PetitionUntaggedEvent: gql`
    fragment TimelinePetitionUntaggedEvent_PetitionUntaggedEvent on PetitionUntaggedEvent {
      user {
        ...UserReference_User
      }
      tags {
        ...TagReference_Tag
      }
      createdAt
    }
    ${UserReference.fragments.User}
    ${TagReference.fragments.Tag}
  `,
};
