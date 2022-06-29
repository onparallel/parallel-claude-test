import { gql } from "@apollo/client";
import { LinkIcon } from "@parallel/chakra/icons";
import { ContactReference } from "@parallel/components/common/ContactReference";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

export type TimelineAccessActivatedFromLinkEventProps = {
  event: TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEventFragment;
};

export function TimelineAccessActivatedFromLinkEvent({
  event,
}: TimelineAccessActivatedFromLinkEventProps) {
  return (
    <TimelineItem
      icon={<TimelineIcon icon={<LinkIcon />} color="white" backgroundColor="primary.500" />}
      paddingBottom={0}
    >
      <FormattedMessage
        id="timeline.public-petition-link-created-description"
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

TimelineAccessActivatedFromLinkEvent.fragments = {
  AccessActivatedFromPublicPetitionLinkEvent: gql`
    fragment TimelineAccessActivatedFromLinkEvent_AccessActivatedFromPublicPetitionLinkEvent on AccessActivatedFromPublicPetitionLinkEvent {
      access {
        contact {
          ...ContactReference_Contact
        }
      }
      createdAt
    }
    ${ContactReference.fragments.Contact}
  `,
};
