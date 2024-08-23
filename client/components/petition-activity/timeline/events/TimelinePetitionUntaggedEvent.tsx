import { gql } from "@apollo/client";
import { TagIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionUntaggedEvent_PetitionUntaggedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { TagReference } from "../../../common/TagReference";
import { UserReference } from "../../../common/UserReference";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelinePetitionUntaggedEventProps {
  event: TimelinePetitionUntaggedEvent_PetitionUntaggedEventFragment;
}

export function TimelinePetitionUntaggedEvent({ event }: TimelinePetitionUntaggedEventProps) {
  const intl = useIntl();
  return (
    <TimelineItem icon={<TimelineIcon icon={TagIcon} color="white" backgroundColor="red.500" />}>
      <FormattedMessage
        id="component.timeline-petition-untagged-event.description"
        defaultMessage="{user} removed {tagCount, plural, =1{tag} other{tags}} {tagList} from this parallel {timeAgo}"
        values={{
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
