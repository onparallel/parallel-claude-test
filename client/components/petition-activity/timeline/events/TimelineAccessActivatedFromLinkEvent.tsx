import { gql } from "@apollo/client";
import { LinkIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon } from "../common/TimelineIcon";
import { TimelineItem } from "../common/TimelineItem";

export interface TimelineAccessActivatedFromLinkEventProps {
  event: TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragment;
}

export function TimelineAccessActivatedFromLinkEvent({
  event,
}: TimelineAccessActivatedFromLinkEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={LinkIcon} color="white" backgroundColor="primary.500" />}
      paddingBottom={0}
    >
      <FormattedMessage
        id="component.timeline-access-activated-from-link-event.description"
        defaultMessage="{contact} created the parallel from a public link {timeAgo}"
        values={{
          contact: <ContactReference contact={event.access.contact} />,
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

const _fragments = {
  AccessActivatedFromPublicPetitionLinkEvent: gql`
    fragment TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEvent on AccessActivatedFromPublicPetitionLinkEvent {
      access {
        contact {
          ...ContactReference_Contact
        }
      }
      createdAt
    }
  `,
};
