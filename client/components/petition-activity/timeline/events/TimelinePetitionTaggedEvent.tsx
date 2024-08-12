import { gql } from "@apollo/client";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionTaggedEvent_PetitionTaggedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage, useIntl } from "react-intl";
import { TagReference } from "../../../common/TagReference";
import { UserReference } from "../../../common/UserReference";
import { TimelineItem } from "../common/TimelineItem";
import { TagIcon } from "@parallel/chakra/icons";
import { TimelineIcon } from "../common/TimelineIcon";

export interface TimelinePetitionTaggedEventProps {
  event: TimelinePetitionTaggedEvent_PetitionTaggedEventFragment;
}

export function TimelinePetitionTaggedEvent({ event }: TimelinePetitionTaggedEventProps) {
  const intl = useIntl();
  return (
    <TimelineItem
      icon={<TimelineIcon icon={TagIcon} color="white" backgroundColor="primary.500" />}
    >
      <FormattedMessage
        id="component.timeline-petition-tagged-event.description"
        defaultMessage="{user} tagged this parallel with {tagList} {timeAgo}"
        values={{
          user: <UserReference user={event.user} />,
          tagList: intl.formatList(event.tags.map((tag, i) => <TagReference key={i} tag={tag} />)),
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionTaggedEvent.fragments = {
  PetitionTaggedEvent: gql`
    fragment TimelinePetitionTaggedEvent_PetitionTaggedEvent on PetitionTaggedEvent {
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
