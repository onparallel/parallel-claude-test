import { gql } from "@apollo/client";
import { LinkIcon } from "@parallel/chakra/icons";
import { ContactLink } from "@parallel/components/common/ContactLink";
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
      icon={<TimelineIcon icon={<LinkIcon />} color="white" backgroundColor="purple.500" />}
    >
      <FormattedMessage
        id="timeline.public-petition-link-created-description"
        defaultMessage="{contact} created the petition from a public link {timeAgo}"
        values={{
          contact: <ContactLink contact={event.access.contact} />,
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
          ...ContactLink_Contact
        }
      }
      createdAt
    }
    ${ContactLink.fragments.Contact}
  `,
};
