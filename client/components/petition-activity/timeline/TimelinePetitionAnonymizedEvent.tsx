import { gql } from "@apollo/client";
import { CircleCrossFilledIcon } from "@parallel/chakra/icons";
import { DateTime } from "@parallel/components/common/DateTime";
import { TimelinePetitionAnonymizedEvent_PetitionAnonymizedEventFragment } from "@parallel/graphql/__types";
import { FORMATS } from "@parallel/utils/dates";
import { FormattedMessage } from "react-intl";
import { TimelineIcon, TimelineItem } from "./helpers";

type TimelinePetitionAnonymizedEventProps = {
  event: TimelinePetitionAnonymizedEvent_PetitionAnonymizedEventFragment;
};

export function TimelinePetitionAnonymizedEvent({ event }: TimelinePetitionAnonymizedEventProps) {
  return (
    <TimelineItem
      icon={
        <TimelineIcon icon={<CircleCrossFilledIcon />} color="white" backgroundColor="red.500" />
      }
    >
      <FormattedMessage
        id="timeline.petition-anonymized-description"
        defaultMessage="The parallel has been anonymized {timeAgo}"
        values={{
          timeAgo: (
            <DateTime value={event.createdAt} format={FORMATS.LLL} useRelativeTime="always" />
          ),
        }}
      />
    </TimelineItem>
  );
}

TimelinePetitionAnonymizedEvent.fragments = {
  PetitionAnonymizedEvent: gql`
    fragment TimelinePetitionAnonymizedEvent_PetitionAnonymizedEvent on PetitionAnonymizedEvent {
      createdAt
    }
  `,
};
