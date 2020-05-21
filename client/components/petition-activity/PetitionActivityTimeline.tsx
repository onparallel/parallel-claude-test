import { Box } from "@chakra-ui/core";
import { PetitionActivityTimeline_PetitionEventFragment } from "@parallel/graphql/__types";
import { gql } from "apollo-boost";
import { TimelineIcon, TimelineItem } from "./timeline/helpers";
import { TimelineAccessActivatedEvent } from "./timeline/TimelineAccessActivatedEvent";
import { TimelineAccessDeactivatedEvent } from "./timeline/TimelineAccessDeactivatedEvent";
import { TimelineMessageProcessedEvent } from "./timeline/TimelineMessageProcessedEvent";
import { TimelineReminderProcessedEvent } from "./timeline/TimelineReminderProcessedEvent";
import { TimelineMessageScheduledEvent } from "./timeline/TimelineMessageScheduledEvent";

export type PetitionActivityTimelineProps = {
  userId: string;
  events: PetitionActivityTimeline_PetitionEventFragment[];
};

export function PetitionActivityTimeline({
  userId,
  events,
}: PetitionActivityTimelineProps) {
  return (
    <Box as="ol">
      {events.map((event) =>
        event.__typename === "AccessActivatedEvent" ? (
          <TimelineAccessActivatedEvent
            key={event.id}
            event={event}
            userId={userId}
          />
        ) : event.__typename === "AccessDeactivatedEvent" ? (
          <TimelineAccessDeactivatedEvent
            key={event.id}
            event={event}
            userId={userId}
          />
        ) : event.__typename === "MessageScheduledEvent" ? (
          <TimelineMessageScheduledEvent
            key={event.id}
            event={event}
            userId={userId}
          />
        ) : event.__typename === "MessageProcessedEvent" ? (
          <TimelineMessageProcessedEvent
            key={event.id}
            event={event}
            userId={userId}
          />
        ) : event.__typename === "ReminderProcessedEvent" ? (
          <TimelineReminderProcessedEvent
            key={event.id}
            event={event}
            userId={userId}
          />
        ) : null
      )}
    </Box>
  );
}

PetitionActivityTimeline.fragments = {
  Petition: gql`
    fragment PetitionActivityTimeline_Petition on Petition {
      events(limit: 100) {
        items {
          ...PetitionActivityTimeline_PetitionEvent
        }
      }
    }
    fragment PetitionActivityTimeline_PetitionEvent on PetitionEvent {
      id
      ... on AccessActivatedEvent {
        ...TimelineAccessActivatedEvent_AccessActivatedEvent
      }
      ... on AccessDeactivatedEvent {
        ...TimelineAccessDeactivatedEvent_AccessDeactivatedEvent
      }
      ... on MessageScheduledEvent {
        ...TimelineMessageScheduledEvent_MessageScheduledEvent
      }
      ... on MessageProcessedEvent {
        ...TimelineMessageProcessedEvent_MessageProcessedEvent
      }
      ... on ReminderProcessedEvent {
        ...TimelineReminderProcessedEvent_ReminderProcessedEvent
      }
    }
    ${TimelineAccessActivatedEvent.fragments.AccessActivatedEvent}
    ${TimelineAccessDeactivatedEvent.fragments.AccessDeactivatedEvent}
    ${TimelineMessageProcessedEvent.fragments.MessageProcessedEvent}
    ${TimelineMessageScheduledEvent.fragments.MessageScheduledEvent}
    ${TimelineReminderProcessedEvent.fragments.ReminderProcessedEvent}
  `,
};
